import { createClient } from './server';
import { 
  MuscleCatalogData, 
  ExerciseMuscleMapping, 
  WorkingSetInput,
  MuscleTrainingExposure,
  calculateTrainingExposure
} from '../calculations/exposure';

export async function getTrainingExposureData(
  userId: string,
  startDate: string,
  endDate: string
): Promise<MuscleTrainingExposure[]> {
  const supabase = await createClient();

  // 1. Fetch Muscles
  const { data: musclesData, error: musclesError } = await supabase
    .from('muscles')
    .select('id, slug, name, region');

  if (musclesError) throw new Error(`Failed to fetch muscles: ${musclesError.message}`);
  const muscles = musclesData as MuscleCatalogData[];

  // 2. Fetch Mappings
  const { data: mappingsData, error: mappingsError } = await supabase
    .from('exercise_muscles')
    .select('exercise_id, muscle_id, role, exposure_factor');

  if (mappingsError) throw new Error(`Failed to fetch exercise mappings: ${mappingsError.message}`);
  const mappings = mappingsData as ExerciseMuscleMapping[];

  // 3. Fetch all working sets for completed workouts in range
  // Note: we can't easily filter by ws.completed_at efficiently in a deep nested select with RLS, 
  // so we fetch workouts that overlap or we just flat fetch workout_sets via a join view.
  // Actually, we can fetch workout_sets where workout_exercise.workout.user_id = userId
  // Wait, Supabase PostgREST allows nested filtering, but it's cleaner to query workouts
  // where status = 'completed' and then their exercises/sets.
  // Or query workout_sets directly. Let's query workouts.
  const { data: workoutsData, error: workoutsError } = await supabase
    .from('workouts')
    .select(`
      id,
      workout_exercises (
        exercise_id,
        workout_sets (
          set_type,
          completed_at
        )
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed');

  if (workoutsError) throw new Error(`Failed to fetch workouts: ${workoutsError.message}`);

  const workingSets: WorkingSetInput[] = [];

  for (const workout of workoutsData) {
    for (const we of workout.workout_exercises || []) {
      for (const ws of we.workout_sets || []) {
        // Filter working sets
        if (ws.set_type === 'working') {
          workingSets.push({
            workout_id: workout.id,
            exercise_id: we.exercise_id,
            completed_at: ws.completed_at
          });
        }
      }
    }
  }

  // Calculate pure exposure
  return calculateTrainingExposure(workingSets, muscles, mappings, startDate, endDate);
}

export async function getMuscleMeshes(): Promise<Record<string, string[]>> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('muscles')
    .select(`
      slug,
      muscle_meshes (
        mesh_name
      )
    `);
    
  if (error) {
    throw new Error(`Failed to fetch muscle meshes: ${error.message}`);
  }
  
  const mapping: Record<string, string[]> = {};
  for (const muscle of data || []) {
    mapping[muscle.slug] = (muscle.muscle_meshes || []).map((m: { mesh_name: string }) => m.mesh_name);
  }
  
  return mapping;
}
