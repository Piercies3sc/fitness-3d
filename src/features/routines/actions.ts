'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const routineExerciseSchema = z.object({
  exercise_id: z.string().uuid(),
  position: z.number().int().min(0),
  planned_sets: z.number().int().min(1).max(20),
  target_reps_min: z.number().int().min(1).max(100).nullable().optional(),
  target_reps_max: z.number().int().min(1).max(100).nullable().optional(),
}).refine(
  (data) => {
    if (data.target_reps_min && data.target_reps_max) {
      return data.target_reps_min <= data.target_reps_max;
    }
    // If one is provided, both must be provided or none
    return !data.target_reps_min && !data.target_reps_max;
  },
  {
    message: "Invalid target rep range",
    path: ["target_reps_min"] // attach error here
  }
);

const routineSchema = z.object({
  name: z.string().trim().min(1, "Routine name is required").max(80, "Routine name must be 80 characters or less"),
  exercises: z.array(routineExerciseSchema)
}).refine(
  (data) => {
    const exerciseIds = data.exercises.map(e => e.exercise_id);
    return new Set(exerciseIds).size === exerciseIds.length;
  },
  {
    message: "Duplicate exercises are not allowed in the same routine",
    path: ["exercises"]
  }
);

export type RoutineFormData = z.infer<typeof routineSchema>;

export type ActionState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export async function createRoutineAction(prevState: unknown, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await supabase.auth.getClaims() as any;
  const userId = data?.claims?.sub;
  
  if (!userId) {
    return { success: false, message: 'Unauthorized' };
  }

  try {
    const rawData = formData.get('routineData');
    if (!rawData || typeof rawData !== 'string') {
      return { success: false, message: 'Missing routine data' };
    }

    const parsedData = JSON.parse(rawData);
    const validated = routineSchema.safeParse(parsedData);

    if (!validated.success) {
      return { 
        success: false, 
        message: 'Validation failed', 
        errors: validated.error.flatten().fieldErrors 
      };
    }

    const { name, exercises } = validated.data;

    // 1. Insert the routine
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .insert({
        user_id: userId,
        name
      })
      .select('id')
      .single();

    if (routineError || !routine) {
      console.error('Error creating routine:', routineError);
      return { success: false, message: 'Failed to create routine' };
    }

    // 2. Insert exercises if any
    if (exercises.length > 0) {
      const exerciseInserts = exercises.map(ex => ({
        routine_id: routine.id,
        exercise_id: ex.exercise_id,
        position: ex.position,
        planned_sets: ex.planned_sets,
        target_reps_min: ex.target_reps_min || null,
        target_reps_max: ex.target_reps_max || null,
      }));

      const { error: exerciseError } = await supabase
        .from('routine_exercises')
        .insert(exerciseInserts);

      if (exerciseError) {
        console.error('Error inserting routine exercises:', exerciseError);
        return { success: false, message: 'Failed to add exercises to routine' };
      }
    }

    revalidatePath('/workout/routines');
    return { success: true, message: 'Routine created successfully' };

  } catch (err) {
    console.error('Unexpected error in createRoutineAction:', err);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

export async function updateRoutineAction(routineId: string, prevState: unknown, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await supabase.auth.getClaims() as any;
  const userId = data?.claims?.sub;
  
  if (!userId) {
    return { success: false, message: 'Unauthorized' };
  }

  try {
    const rawData = formData.get('routineData');
    if (!rawData || typeof rawData !== 'string') {
      return { success: false, message: 'Missing routine data' };
    }

    const parsedData = JSON.parse(rawData);
    const validated = routineSchema.safeParse(parsedData);

    if (!validated.success) {
      return { 
        success: false, 
        message: 'Validation failed', 
        errors: validated.error.flatten().fieldErrors 
      };
    }

    const { name, exercises } = validated.data;

    // 1. Verify ownership & update routine name
    const { error: routineError } = await supabase
      .from('routines')
      .update({ name })
      .eq('id', routineId)
      .eq('user_id', userId);

    if (routineError) {
      console.error('Error updating routine:', routineError);
      return { success: false, message: 'Failed to update routine' };
    }

    // 2. Simplest approach: Delete all existing exercises and re-insert
    // RLS prevents deleting exercises from other users' routines because we 
    // restrict by routine_id which must belong to the user.
    const { error: deleteError } = await supabase
      .from('routine_exercises')
      .delete()
      .eq('routine_id', routineId);

    if (deleteError) {
      console.error('Error deleting old routine exercises:', deleteError);
      return { success: false, message: 'Failed to update routine exercises' };
    }

    if (exercises.length > 0) {
      const exerciseInserts = exercises.map(ex => ({
        routine_id: routineId,
        exercise_id: ex.exercise_id,
        position: ex.position,
        planned_sets: ex.planned_sets,
        target_reps_min: ex.target_reps_min || null,
        target_reps_max: ex.target_reps_max || null,
      }));

      const { error: exerciseError } = await supabase
        .from('routine_exercises')
        .insert(exerciseInserts);

      if (exerciseError) {
        console.error('Error inserting updated routine exercises:', exerciseError);
        return { success: false, message: 'Failed to update routine exercises' };
      }
    }

    revalidatePath('/workout/routines');
    revalidatePath(`/workout/routines/${routineId}/edit`);
    return { success: true, message: 'Routine updated successfully' };

  } catch (err) {
    console.error('Unexpected error in updateRoutineAction:', err);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

export async function deleteRoutineAction(routineId: string): Promise<ActionState> {
  const supabase = await createClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await supabase.auth.getClaims() as any;
  const userId = data?.claims?.sub;
  
  if (!userId) {
    return { success: false, message: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('routines')
    .delete()
    .eq('id', routineId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting routine:', error);
    return { success: false, message: 'Failed to delete routine' };
  }

  revalidatePath('/workout/routines');
  return { success: true, message: 'Routine deleted successfully' };
}
