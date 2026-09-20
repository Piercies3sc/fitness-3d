import { calculateEstimated1RM, calculateSetVolume } from './workout';

export type PRSetInput = {
  weight_kg: number;
  reps: number;
  set_type: 'working' | 'warmup';
};

export type PRExerciseInput = {
  exercise_id: string;
  workout_sets: PRSetInput[];
};

export type PRWorkoutInput = {
  id: string;
  started_at: string;
  completed_at?: string | null;
  status?: string;
  routine_name_snapshot?: string;
  workout_exercises: PRExerciseInput[];
};

export type RepPRResult = {
  load: number;
  reps: number;
};

export type ExercisePRResult = {
  weightPR?: number;
  estimated1RMPR?: number;
  volumePR?: number;
  repPRs?: RepPRResult[];
};

export type WorkoutPRResult = Record<string, ExercisePRResult>; // Key is exercise_id

/**
 * Normalizes a kg weight to 2 decimal places to match the DB numeric(6,2)
 * and ensure deterministic load comparisons (e.g. for Rep PRs).
 */
export function normalizeLoadKg(weightKg: number): number {
  return Math.round(weightKg * 100) / 100;
}

type ExerciseBaseline = {
  maxWeight: number;
  maxE1RM: number;
  maxVolume: number;
  maxRepsByLoad: Map<number, number>;
};

/**
 * Iterates over all historically ordered completed workouts and computes PRs
 * strictly by comparing to performances that occurred before each workout's started_at.
 * 
 * Assumes `allWorkouts` is sorted by `started_at` ascending.
 */
export function computeAllWorkoutPRs(allWorkouts: PRWorkoutInput[]): Map<string, WorkoutPRResult> {
  const workoutPRs = new Map<string, WorkoutPRResult>();
  const baselines = new Map<string, ExerciseBaseline>();

  for (const workout of allWorkouts) {
    const currentWorkoutPRs: WorkoutPRResult = {};

    for (const exercise of workout.workout_exercises) {
      if (!exercise.workout_sets || exercise.workout_sets.length === 0) continue;
      
      const exId = exercise.exercise_id;
      const baseline = baselines.get(exId);
      const isFirstPerformance = !baseline;

      let workoutMaxWeight = 0;
      let workoutMaxE1RM = 0;
      let workoutVolume = 0;
      const workoutMaxRepsByLoad = new Map<number, number>();

      let hasWorkingSets = false;

      // Extract current workout stats for this exercise
      for (const set of exercise.workout_sets) {
        if (set.set_type !== 'working') continue;
        if (set.reps <= 0 || set.weight_kg < 0) continue;

        hasWorkingSets = true;
        const normLoad = normalizeLoadKg(set.weight_kg);

        // Weight
        if (normLoad > workoutMaxWeight) {
          workoutMaxWeight = normLoad;
        }

        // E1RM
        const e1rm = calculateEstimated1RM(set.weight_kg, set.reps, set.set_type);
        if (e1rm !== null && e1rm > workoutMaxE1RM) {
          workoutMaxE1RM = e1rm;
        }

        // Reps at load
        const currentRepsForLoad = workoutMaxRepsByLoad.get(normLoad) || 0;
        if (set.reps > currentRepsForLoad) {
          workoutMaxRepsByLoad.set(normLoad, set.reps);
        }

        // Volume
        workoutVolume += calculateSetVolume(set.weight_kg, set.reps, set.set_type);
      }

      if (!hasWorkingSets) continue;

      // Detect PRs
      const prResult: ExercisePRResult = {};
      let hasAnyPR = false;

      if (isFirstPerformance) {
        // First performance is baseline, not PR
        // Just create baseline
        baselines.set(exId, {
          maxWeight: workoutMaxWeight,
          maxE1RM: workoutMaxE1RM,
          maxVolume: workoutVolume,
          maxRepsByLoad: workoutMaxRepsByLoad
        });
        continue; // No PRs
      }

      // We have a baseline, check for PRs
      const b = baseline!;

      if (workoutMaxWeight > b.maxWeight) {
        prResult.weightPR = workoutMaxWeight;
        hasAnyPR = true;
      }

      if (workoutMaxE1RM > b.maxE1RM) {
        prResult.estimated1RMPR = workoutMaxE1RM;
        hasAnyPR = true;
      }

      if (workoutVolume > b.maxVolume) {
        prResult.volumePR = workoutVolume;
        hasAnyPR = true;
      }

      const repPRs: RepPRResult[] = [];
      for (const [load, reps] of workoutMaxRepsByLoad.entries()) {
        const previousMaxReps = b.maxRepsByLoad.get(load);
        if (previousMaxReps !== undefined) {
          if (reps > previousMaxReps) {
            repPRs.push({ load, reps });
            hasAnyPR = true;
          }
        } else {
          // No previous performance at this load. This establishes the baseline for this load, it's NOT a PR.
        }
      }

      if (repPRs.length > 0) {
        // Sort Rep PRs descending by load for consistent display
        prResult.repPRs = repPRs.sort((a, b) => b.load - a.load);
      }

      if (hasAnyPR) {
        currentWorkoutPRs[exId] = prResult;
      }

      // Update baseline for FUTURE workouts
      if (workoutMaxWeight > b.maxWeight) b.maxWeight = workoutMaxWeight;
      if (workoutMaxE1RM > b.maxE1RM) b.maxE1RM = workoutMaxE1RM;
      if (workoutVolume > b.maxVolume) b.maxVolume = workoutVolume;
      
      for (const [load, reps] of workoutMaxRepsByLoad.entries()) {
        const currentMax = b.maxRepsByLoad.get(load) || 0;
        if (reps > currentMax) {
          b.maxRepsByLoad.set(load, reps);
        }
      }
    }

    workoutPRs.set(workout.id, currentWorkoutPRs);
  }

  return workoutPRs;
}
