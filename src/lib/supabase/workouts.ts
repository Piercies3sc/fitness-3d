import { createClient } from './server';
import { Database } from '@/types/database';
import { computeAllWorkoutPRs, PRWorkoutInput, WorkoutPRResult } from '../calculations/prs';

export type WorkoutRow = Database['public']['Tables']['workouts']['Row'];
export type WorkoutExerciseRow = Database['public']['Tables']['workout_exercises']['Row'];
export type WorkoutSetRow = Database['public']['Tables']['workout_sets']['Row'];

export type WorkoutSetWithId = WorkoutSetRow;

export type WorkoutExerciseWithSets = WorkoutExerciseRow & {
  workout_sets: WorkoutSetWithId[];
  exercises: {
    id: string;
    name: string;
    slug: string;
    equipment: string | null;
  } | null;
};

export type ActiveWorkout = WorkoutRow & {
  workout_exercises: WorkoutExerciseWithSets[];
};

/**
 * Gets the current active workout for the authenticated user, if any.
 */
export async function getActiveWorkout(userId: string): Promise<ActiveWorkout | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('workouts')
    .select(`
      *,
      workout_exercises (
        *,
        exercises (
          id,
          name,
          slug,
          equipment
        ),
        workout_sets (*)
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Error fetching active workout:', error);
    }
    return null;
  }

  // Sort exercises by position, and sets by set_number
  if (data && data.workout_exercises) {
    data.workout_exercises.sort((a: { position: number }, b: { position: number }) => a.position - b.position);
    data.workout_exercises.forEach((we: { workout_sets?: { set_number: number }[] }) => {
      if (we.workout_sets) {
        we.workout_sets.sort((a: { set_number: number }, b: { set_number: number }) => a.set_number - b.set_number);
      } else {
        we.workout_sets = [];
      }
    });
  }

  return data as unknown as ActiveWorkout;
}

export type PreviousPerformance = {
  workout_exercise_id: string;
  set_number: number;
  weight_kg: number;
  reps: number;
};

/**
 * Fetches previous working sets for given exercise IDs from the MOST RECENT completed workout 
 * that contained those exercises.
 */
export async function getPreviousPerformanceForExercises(userId: string, exerciseIds: string[]): Promise<Record<string, PreviousPerformance[]>> {
  if (exerciseIds.length === 0) return {};
  
  const supabase = await createClient();

  const { data: workouts, error } = await supabase
    .from('workouts')
    .select(`
      id,
      workout_exercises (
        id,
        exercise_id,
        workout_sets (
          set_number,
          weight_kg,
          reps,
          set_type
        )
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching previous workouts:', error);
    return {};
  }

  const result: Record<string, PreviousPerformance[]> = {};
  const foundExercises = new Set<string>();

  for (const workout of workouts) {
    for (const we of workout.workout_exercises) {
      const exId = we.exercise_id;
      if (exerciseIds.includes(exId) && !foundExercises.has(exId)) {
        foundExercises.add(exId);
        
        type PartialSet = { set_type: string; set_number: number; weight_kg: number; reps: number };
        const workingSets = (we.workout_sets as PartialSet[] || [])
          .filter(s => s.set_type === 'working')
          .sort((a, b) => a.set_number - b.set_number);
          
        result[exId] = workingSets.map((ws, index) => ({
          workout_exercise_id: we.id,
          set_number: index + 1,
          weight_kg: ws.weight_kg,
          reps: ws.reps
        }));
      }
    }
  }

  return result;
}

export type HistoryWorkoutList = WorkoutRow & {
  workout_exercises: {
    workout_sets: { weight_kg: number; reps: number; set_type: 'working' | 'warmup' }[];
  }[];
  prCount?: number;
};

export async function getAllCompletedWorkoutsForPRs(userId: string): Promise<PRWorkoutInput[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('workouts')
    .select(`
      id,
      started_at,
      completed_at,
      status,
      routine_name_snapshot,
      workout_exercises (
        exercise_id,
        workout_sets (
          weight_kg,
          reps,
          set_type
        )
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('started_at', { ascending: true });

  if (error) {
    console.error('Error fetching all workouts for PRs:', error);
    return [];
  }
  return data as unknown as PRWorkoutInput[];
}

export async function getWorkoutHistory(userId: string, limit = 20): Promise<HistoryWorkoutList[]> {
  // We fetch ALL workouts to compute historical PRs properly.
  // Instead of fetching the top 20 separately, we reuse this comprehensive dataset.
  const allWorkouts = await getAllCompletedWorkoutsForPRs(userId);
  
  if (!allWorkouts || allWorkouts.length === 0) {
    return [];
  }

  // Calculate PRs using the full history
  const prsByWorkout = computeAllWorkoutPRs(allWorkouts);

  // Sort by completed_at descending (newest first)
  const sortedWorkouts = [...allWorkouts].sort(
    (a, b) => new Date(b.completed_at || b.started_at).getTime() - new Date(a.completed_at || a.started_at).getTime()
  );

  // Take the requested limit
  const topWorkouts = sortedWorkouts.slice(0, limit);

  // Map to the expected HistoryWorkoutList shape and attach PR counts
  const historyList: HistoryWorkoutList[] = topWorkouts.map(w => {
    // Map workout sets back to the expected structure
    const mappedExercises = w.workout_exercises.map(we => ({
      workout_sets: we.workout_sets as { weight_kg: number; reps: number; set_type: 'working' | 'warmup' }[]
    }));

    const workoutObj = {
      id: w.id,
      user_id: userId,
      status: (w.status as 'active' | 'completed') || 'completed',
      started_at: w.started_at,
      completed_at: w.completed_at || null,
      routine_name_snapshot: w.routine_name_snapshot || 'Unknown Routine',
      workout_exercises: mappedExercises
    } as unknown as HistoryWorkoutList;

    const workoutPRs = prsByWorkout.get(w.id);
    let prCount = 0;
    if (workoutPRs) {
      for (const pr of Object.values(workoutPRs)) {
        if (pr.weightPR) prCount++;
        if (pr.estimated1RMPR) prCount++;
        if (pr.volumePR) prCount++;
        if (pr.repPRs) prCount += pr.repPRs.length;
      }
    }
    workoutObj.prCount = prCount;

    return workoutObj;
  });

  return historyList;
}

export type CompletedWorkoutDetail = WorkoutRow & {
  workout_exercises: (WorkoutExerciseRow & {
    exercises: { name: string } | null;
    workout_sets: WorkoutSetRow[];
  })[];
  prs?: WorkoutPRResult;
};

export async function getCompletedWorkout(workoutId: string): Promise<CompletedWorkoutDetail | null> {
  const supabase = await createClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: authData } = await supabase.auth.getClaims() as any;
  const userId = authData?.claims?.sub;
  if (!userId) return null;

  const { data, error } = await supabase
    .from('workouts')
    .select(`
      *,
      workout_exercises (
        *,
        exercises ( name ),
        workout_sets (*)
      )
    `)
    .eq('id', workoutId)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .single();

  if (error) {
    console.error('Error fetching completed workout:', error);
    return null;
  }

  if (data && data.workout_exercises) {
    data.workout_exercises.sort((a: { position: number }, b: { position: number }) => a.position - b.position);
    data.workout_exercises.forEach((we: { workout_sets?: { set_number: number }[] }) => {
      if (we.workout_sets) {
        we.workout_sets.sort((a: { set_number: number }, b: { set_number: number }) => a.set_number - b.set_number);
      } else {
        we.workout_sets = [];
      }
    });
  }

  const result = data as unknown as CompletedWorkoutDetail;
  
  // Attach PRs
  const allWorkouts = await getAllCompletedWorkoutsForPRs(userId);
  const prsByWorkout = computeAllWorkoutPRs(allWorkouts);
  result.prs = prsByWorkout.get(result.id) || {};

  return result;
}
