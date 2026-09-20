import { createClient } from './server';
import { Database } from '@/types/database';

export type ExerciseRow = Database['public']['Tables']['exercises']['Row'];
export type MuscleRow = Database['public']['Tables']['muscles']['Row'];
export type ExerciseMuscleRow = Database['public']['Tables']['exercise_muscles']['Row'];

export type ExerciseWithMuscles = ExerciseRow & {
  exercise_muscles: (ExerciseMuscleRow & {
    muscles: MuscleRow | null
  })[]
};

export async function getExercises() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('exercises')
    .select(`
      *,
      exercise_muscles (
        role,
        exposure_factor,
        muscles (
          id,
          name,
          slug,
          region
        )
      )
    `)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching exercises:', error);
    return null;
  }
  
  return data as unknown as ExerciseWithMuscles[];
}

export async function getExerciseBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('exercises')
    .select(`
      *,
      exercise_muscles (
        role,
        exposure_factor,
        muscles (
          id,
          name,
          slug,
          region
        )
      )
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Error fetching exercise by slug:', error);
    }
    return null;
  }

  return data as unknown as ExerciseWithMuscles;
}
