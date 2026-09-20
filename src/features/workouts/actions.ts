'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type ActionState = {
  success: boolean;
  message?: string;
  workoutId?: string;
};

/**
 * Starts a workout from a routine.
 * Enforces one active workout per user.
 */
export async function startWorkoutAction(routineId: string): Promise<ActionState> {
  const supabase = await createClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await supabase.auth.getClaims() as any;
  const userId = data?.claims?.sub;
  if (!userId) return { success: false, message: 'Unauthorized' };

  // Call the atomic RPC
  const { data: workoutId, error } = await supabase
    .rpc('start_workout_from_routine', { p_routine_id: routineId });

  if (error) {
    console.error('Error starting workout:', error);
    if (error.message.includes('An active workout already exists')) {
      return { success: false, message: 'ACTIVE_EXISTS' };
    }
    return { success: false, message: error.message };
  }

  // Use revalidate path to clear cache, but wait, we want to redirect to the active workout.
  revalidatePath('/workout/routines');
  // We can't redirect directly inside a try/catch easily without throwing the redirect.
  // We will return success and let the client redirect, or redirect here.
  return { success: true, workoutId };
}

/**
 * Discards the current active workout explicitly.
 */
export async function discardWorkoutAction(workoutId: string): Promise<ActionState> {
  const supabase = await createClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await supabase.auth.getClaims() as any;
  const userId = data?.claims?.sub;
  if (!userId) return { success: false, message: 'Unauthorized' };

  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', workoutId)
    .eq('status', 'active'); // RLS also enforces this, but explicit is good

  if (error) {
    console.error('Error discarding workout:', error);
    return { success: false, message: 'Failed to discard workout' };
  }

  revalidatePath('/workout/routines');
  return { success: true };
}

/**
 * Finishes the active workout.
 */
export async function finishWorkoutAction(workoutId: string): Promise<ActionState> {
  const supabase = await createClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await supabase.auth.getClaims() as any;
  const userId = data?.claims?.sub;
  if (!userId) return { success: false, message: 'Unauthorized' };

  // simpler joined count check:
  const { data: exercises, error: countCheckErr } = await supabase
    .from('workout_exercises')
    .select('id, workout_sets(id)')
    .eq('workout_id', workoutId);
    
  if (countCheckErr) {
    console.error('Error checking sets for finish:', countCheckErr);
    return { success: false, message: 'Error finalizing workout.' };
  }
  
  const totalSets = exercises?.reduce((sum, we) => sum + (we.workout_sets?.length || 0), 0) || 0;
  if (totalSets === 0) {
    return { success: false, message: 'Cannot finish a workout with no completed sets.' };
  }

  const { error } = await supabase
    .from('workouts')
    .update({ 
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', workoutId)
    .eq('status', 'active');

  if (error) {
    console.error('Error finishing workout:', error);
    return { success: false, message: 'Failed to finish workout' };
  }

  revalidatePath('/workout/routines');
  return { success: true };
}

export type SetPayload = {
  workout_exercise_id: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  set_type: 'warmup' | 'working';
};

/**
 * Logs or updates a single set.
 */
export async function logSetAction(payload: SetPayload): Promise<ActionState> {
  const supabase = await createClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await supabase.auth.getClaims() as any;
  if (!data?.claims?.sub) return { success: false, message: 'Unauthorized' };

  // Upsert the set based on unique constraint (workout_exercise_id, set_number)
  const { error } = await supabase
    .from('workout_sets')
    .upsert(
      {
        workout_exercise_id: payload.workout_exercise_id,
        set_number: payload.set_number,
        weight_kg: payload.weight_kg,
        reps: payload.reps,
        set_type: payload.set_type,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'workout_exercise_id, set_number' }
    );

  if (error) {
    console.error('Error logging set:', error);
    return { success: false, message: error.message };
  }

  // We don't need to revalidatePath if the client is doing optimistic updates
  // but it's safe to do so.
  return { success: true };
}

/**
 * Removes a specific set.
 */
export async function removeSetAction(workoutExerciseId: string, setNumber: number): Promise<ActionState> {
  const supabase = await createClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await supabase.auth.getClaims() as any;
  if (!data?.claims?.sub) return { success: false, message: 'Unauthorized' };

  const { error } = await supabase
    .from('workout_sets')
    .delete()
    .eq('workout_exercise_id', workoutExerciseId)
    .eq('set_number', setNumber);

  if (error) {
    console.error('Error removing set:', error);
    return { success: false, message: error.message };
  }

  return { success: true };
}

