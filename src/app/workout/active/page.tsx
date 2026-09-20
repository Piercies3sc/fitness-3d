import { redirect } from 'next/navigation';
import { getActiveWorkout, getPreviousPerformanceForExercises } from '@/lib/supabase/workouts';
import { createClient } from '@/lib/supabase/server';
import { ActiveWorkout } from '@/features/workouts/components/ActiveWorkout';

export const metadata = {
  title: 'Aktif Antrenman | Fitness 3D',
};

export default async function ActiveWorkoutPage() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await supabase.auth.getClaims() as any;
  const userId = data?.claims?.sub;
  
  if (!userId) {
    redirect('/login');
  }

  const activeWorkout = await getActiveWorkout(userId);

  if (!activeWorkout) {
    redirect('/workout/routines');
  }

  const exerciseIds = activeWorkout.workout_exercises.map(we => we.exercise_id);
  const previousPerformance = await getPreviousPerformanceForExercises(userId, exerciseIds);

  let unitPreference = 'kg';
  const { data: profile } = await supabase.from('profiles').select('unit_preference').eq('id', userId).single();
  if (profile) unitPreference = profile.unit_preference;

  return (
    <ActiveWorkout 
      initialWorkout={activeWorkout} 
      previousPerformance={previousPerformance} 
      unitPreference={unitPreference as 'kg' | 'lb'}
    />
  );
}
