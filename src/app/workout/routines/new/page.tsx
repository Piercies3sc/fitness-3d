import { RoutineEditor } from '@/features/routines/components/RoutineEditor';
import { getExercises } from '@/lib/supabase/exercises';
import { BackLink } from '@/components/ui/BackLink';

export const metadata = {
  title: 'Program Oluştur | Fitness 3D',
};

export default async function NewRoutinePage() {
  const exercises = await getExercises();

  return (
    <main className="page-shell flex-1 max-w-4xl">
      <div className="page-header">
        <BackLink href="/workout/routines" text="Programlara Dön" />
        <p className="page-eyebrow mb-2">Antrenman programı</p>
        <h1 className="page-title">Program oluştur</h1>
      </div>

      <RoutineEditor catalogExercises={exercises || []} />
    </main>
  );
}
