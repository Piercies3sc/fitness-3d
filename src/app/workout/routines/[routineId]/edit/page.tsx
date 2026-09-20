import { notFound } from 'next/navigation';
import { RoutineEditor } from '@/features/routines/components/RoutineEditor';
import { getExercises } from '@/lib/supabase/exercises';
import { getRoutineById } from '@/lib/supabase/routines';
import { BackLink } from '@/components/ui/BackLink';

type Props = {
  params: Promise<{ routineId: string }>;
};

export const metadata = {
  title: 'Programı Düzenle | Fitness 3D',
};

export default async function EditRoutinePage({ params }: Props) {
  const resolvedParams = await params;
  
  // Use Promise.all to fetch both in parallel
  const [exercises, routine] = await Promise.all([
    getExercises(),
    getRoutineById(resolvedParams.routineId),
  ]);

  if (!routine) {
    notFound();
  }

  return (
    <main className="page-shell flex-1 max-w-4xl">
      <div className="page-header">
        <BackLink href="/workout/routines" text="Programlara Dön" />
        <p className="page-eyebrow mb-2">Antrenman programı</p>
        <h1 className="page-title">Programı düzenle</h1>
      </div>

      <RoutineEditor 
        initialRoutine={routine} 
        catalogExercises={exercises || []} 
      />
    </main>
  );
}
