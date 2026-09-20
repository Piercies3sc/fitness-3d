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
    <main className="mx-auto w-full max-w-[24rem] flex-1 px-6 pb-12 pt-12 sm:max-w-2xl sm:px-8">
      <div className="border-b border-border-subtle pb-8">
        <div className="mb-9 flex items-center justify-between">
          <p className="page-eyebrow text-text-primary">Fitness 3D</p>
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
        </div>
        <BackLink href="/home" text="Ana Sayfaya Dön" />
        <p className="page-eyebrow mb-3">Kütüphane</p>
        <h1 className="text-[2rem] font-medium tracking-[-0.055em] text-text-primary">Hareketler</h1>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          Hareket kataloğu ve anatomik kas haritaları.
        </p>
      </div>

      <div className="pt-7">
      {!exercises || exercises.length === 0 ? (
        <div className="surface-panel p-8 text-center">
          <p className="text-text-muted text-sm">Hareket bulunamadı.</p>
        </div>
      ) : (
        <ExerciseCatalog exercises={exercises} />
      )}
      </div>
    </main>
  );
}
