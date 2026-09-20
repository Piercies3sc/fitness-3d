import { createClient } from './server';
import { Database } from '@/types/database';

export type RoutineRow = Database['public']['Tables']['routines']['Row'];
export type RoutineExerciseRow = Database['public']['Tables']['routine_exercises']['Row'];
export type ExerciseRow = Database['public']['Tables']['exercises']['Row'];

export type RoutineExerciseWithDetails = RoutineExerciseRow & {
  exercises: Pick<ExerciseRow, 'id' | 'name' | 'slug' | 'equipment' | 'movement_type'> | null;
};

export type RoutineWithExercises = RoutineRow & {
  routine_exercises: RoutineExerciseWithDetails[];
};

export async function getRoutines() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('routines')
    .select(`
      *,
      routine_exercises (
        id,
        position,
        planned_sets,
        target_reps_min,
        target_reps_max,
        exercises (
          id,
          name,
          slug,
          equipment,
          movement_type
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching routines:', error);
    return null;
  }

  data.forEach((routine) => {
    if (routine.routine_exercises) {
      routine.routine_exercises.sort((a: RoutineExerciseWithDetails, b: RoutineExerciseWithDetails) => a.position - b.position);
    }
  });

  return data as unknown as RoutineWithExercises[];
}

export async function getRoutineById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('routines')
    .select(`
      *,
      routine_exercises (
        id,
        routine_id,
        exercise_id,
        position,
        planned_sets,
        target_reps_min,
        target_reps_max,
        exercises (
          id,
          name,
          slug,
          equipment,
          movement_type
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Error fetching routine by id:', error);
    }
    return null;
  }

  // Sort exercises by position
  if (data.routine_exercises) {
    data.routine_exercises.sort((a: RoutineExerciseWithDetails, b: RoutineExerciseWithDetails) => a.position - b.position);
  }

  return data as unknown as RoutineWithExercises;
}
