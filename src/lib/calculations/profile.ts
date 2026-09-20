import { MuscleTrainingExposure } from './exposure';
import { PRWorkoutInput, WorkoutPRResult } from './prs';
import { kgToLb } from '../../utils/weight-conversion';

/**
 * Returns Monday 00:00:00.000 for the local calendar week of the given date.
 */
export function getMondayOfWeek(date: Date = new Date()): Date {
  const d = new Date(date.getTime());
  const day = d.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const diff = (day + 6) % 7; // Days to subtract to reach Monday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Counts completed workouts starting on or after Monday 00:00 of the current week.
 */
export function calculateWeeklyWorkoutsCount(
  workouts: { completed_at?: string | null }[],
  mondayDate: Date
): number {
  const mondayMs = mondayDate.getTime();
  return workouts.filter((w) => {
    if (!w.completed_at) return false;
    const completedMs = new Date(w.completed_at).getTime();
    return completedMs >= mondayMs;
  }).length;
}

/**
 * Counts total completed working sets across all workouts.
 * Strictly excludes warmup sets.
 */
export function calculateTotalWorkingSets(
  workouts: {
    workout_exercises?: {
      workout_sets?: { set_type: string }[];
    }[];
  }[]
): number {
  let count = 0;
  for (const w of workouts) {
    for (const we of w.workout_exercises || []) {
      for (const ws of we.workout_sets || []) {
        if (ws.set_type === 'working') {
          count++;
        }
      }
    }
  }
  return count;
}

export type FormattedPREvent = {
  id: string;
  exerciseName: string;
  typeLabel: string;
  detail: string;
  date: string;
};

/**
 * Extracts up to `limit` recent PR events from historical workouts,
 * ordered from newest to oldest.
 */
export function extractRecentPRs(
  allWorkouts: PRWorkoutInput[],
  prsByWorkout: Map<string, WorkoutPRResult>,
  exerciseNameMap: Map<string, string>,
  unitPreference: 'kg' | 'lb' = 'kg',
  limit = 5
): FormattedPREvent[] {
  const events: FormattedPREvent[] = [];

  // Iterate backwards through sorted workouts (newest first)
  for (let i = allWorkouts.length - 1; i >= 0; i--) {
    const workout = allWorkouts[i];
    const workoutPRs = prsByWorkout.get(workout.id);
    if (!workoutPRs) continue;

    const workoutDate = workout.completed_at || workout.started_at;

    for (const [exId, prResult] of Object.entries(workoutPRs)) {
      const exName = exerciseNameMap.get(exId) || 'Exercise';

      // Weight PR
      if (prResult.weightPR !== undefined) {
        const loadVal = unitPreference === 'lb' ? kgToLb(prResult.weightPR) : prResult.weightPR;
        events.push({
          id: `${workout.id}-${exId}-weight`,
          exerciseName: exName,
          typeLabel: 'Weight PR',
          detail: `${loadVal} ${unitPreference}`,
          date: workoutDate,
        });
        if (events.length >= limit) return events;
      }

      // Estimated 1RM PR
      if (prResult.estimated1RMPR !== undefined) {
        const rawE1RM = unitPreference === 'lb' ? kgToLb(prResult.estimated1RMPR) : prResult.estimated1RMPR;
        const formattedE1RM = Math.round(rawE1RM * 10) / 10;
        events.push({
          id: `${workout.id}-${exId}-e1rm`,
          exerciseName: exName,
          typeLabel: 'Estimated 1RM PR',
          detail: `${formattedE1RM} ${unitPreference}`,
          date: workoutDate,
        });
        if (events.length >= limit) return events;
      }

      // Volume PR
      if (prResult.volumePR !== undefined) {
        const rawVol = unitPreference === 'lb' ? kgToLb(prResult.volumePR) : prResult.volumePR;
        const formattedVol = Math.round(rawVol).toLocaleString();
        events.push({
          id: `${workout.id}-${exId}-volume`,
          exerciseName: exName,
          typeLabel: 'Volume PR',
          detail: `${formattedVol} ${unitPreference}·reps`,
          date: workoutDate,
        });
        if (events.length >= limit) return events;
      }

      // Rep PRs
      if (prResult.repPRs && prResult.repPRs.length > 0) {
        for (const rpr of prResult.repPRs) {
          const loadVal = unitPreference === 'lb' ? kgToLb(rpr.load) : rpr.load;
          events.push({
            id: `${workout.id}-${exId}-rep-${rpr.load}`,
            exerciseName: exName,
            typeLabel: 'Rep PR',
            detail: `${rpr.reps} reps · ${loadVal} ${unitPreference}`,
            date: workoutDate,
          });
          if (events.length >= limit) return events;
        }
      }
    }
  }

  return events;
}

/**
 * Returns top `limit` muscles with strictly non-zero exposure, sorted descending.
 */
export function getTopTrainedMuscles(
  exposureData: MuscleTrainingExposure[],
  limit = 5
): MuscleTrainingExposure[] {
  return exposureData
    .filter((m) => m.exposure > 0)
    .sort((a, b) => b.exposure - a.exposure)
    .slice(0, limit);
}

/**
 * Validates display name according to the contract:
 * - optional
 * - trim whitespace
 * - max 50 characters
 * - returns null if empty or whitespace-only
 */
export function validateDisplayName(name: string | null | undefined): {
  isValid: boolean;
  value: string | null;
  error?: string;
} {
  if (name === null || name === undefined) {
    return { isValid: true, value: null };
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { isValid: true, value: null };
  }
  if (trimmed.length > 50) {
    return {
      isValid: false,
      value: trimmed,
      error: 'Display name must be 50 characters or less.',
    };
  }
  return { isValid: true, value: trimmed };
}

/**
 * Validates unit preference: must be 'kg' or 'lb'.
 */
export function validateUnitPreference(unit: string | null | undefined): {
  isValid: boolean;
  value: 'kg' | 'lb';
  error?: string;
} {
  if (unit === 'kg' || unit === 'lb') {
    return { isValid: true, value: unit };
  }
  return {
    isValid: false,
    value: 'kg',
    error: "Unit preference must be 'kg' or 'lb'.",
  };
}

export const ALLOWED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export function validateAvatarFile(file: { size: number; type: string } | null | undefined): {
  isValid: boolean;
  error?: string;
} {
  if (!file) {
    return { isValid: false, error: 'Fotoğraf dosyası seçilmedi.' };
  }
  if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.type as (typeof ALLOWED_AVATAR_MIME_TYPES)[number])) {
    return { isValid: false, error: 'Yalnızca JPEG, PNG veya WebP formatları desteklenir.' };
  }
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return { isValid: false, error: 'Fotoğraf boyutu 2 MB\'tan küçük olmalıdır.' };
  }
  return { isValid: true };
}
