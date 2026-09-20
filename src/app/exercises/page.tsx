import { getExercises } from '@/lib/supabase/exercises';
import { BackLink } from '@/components/ui/BackLink';
import { ExerciseCatalog } from '@/features/exercises/components/ExerciseCatalog';

export const metadata = {
  title: 'Hareketler | Fitness 3D',
  description: 'Hareket kataloğunu ve anatomik kas haritalarını incele.',
};

export default async function ExercisesPage() {
  const exercises = await getExercises();

  return (
    <main className="page-shell flex-1 max-w-6xl">
      <div className="page-header">
        <BackLink href="/home" text="Ana Sayfaya Dön" />
        <p className="page-eyebrow mb-2">Hareket kütüphanesi</p>
        <h1 className="page-title">Hareketler</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Hareket kataloğu ve anatomik kas haritaları.
        </p>
      </div>

      {!exercises || exercises.length === 0 ? (
        <div className="surface-panel p-8 text-center">
          <p className="text-text-muted text-sm">Hareket bulunamadı.</p>
        </div>
      ) : (
        <ExerciseCatalog exercises={exercises} />
      )}
    </main>
  );
}
