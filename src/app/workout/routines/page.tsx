import Link from 'next/link';
import { getRoutines } from '@/lib/supabase/routines';
import { BackLink } from '@/components/ui/BackLink';
import { getActiveWorkout } from '@/lib/supabase/workouts';
import { StartWorkoutButton } from '@/features/workouts/components/StartWorkoutButton';
import { displayExerciseName } from '@/lib/ui/turkish';

import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Programlar | Fitness 3D',
};

export default async function RoutinesPage() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await supabase.auth.getClaims() as any;
  const userId = data?.claims?.sub;

  const routines = await getRoutines();
  const activeWorkout = userId ? await getActiveWorkout(userId) : null;
  const hasActiveWorkout = !!activeWorkout;

  return (
    <main className="page-shell flex-1 max-w-5xl">
      <div className="page-header flex flex-row items-end justify-between gap-3">
        <div>
          <BackLink href="/home" text="Ana Sayfaya Dön" />
          <p className="page-eyebrow mb-2">Antrenman programları</p>
          <h1 className="page-title">Programlar</h1>
          <p className="mt-2 text-sm text-text-secondary">Antrenman şablonlarını yönet.</p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/workout/history"
            className="button-secondary hidden sm:inline-flex"
          >
            Geçmiş
          </Link>
          <Link 
            href="/workout/routines/new"
            className="button-primary hidden sm:inline-flex"
          >
            Program Oluştur
          </Link>
          <Link 
            href="/workout/routines/new"
            className="button-primary min-h-11 px-3 sm:hidden"
            aria-label="Program oluştur"
          >
            +
          </Link>
        </div>
      </div>

      {hasActiveWorkout && (
        <div className="mb-8 border-l-2 border-accent bg-accent/5 px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-1">
              Aktif Antrenman: {activeWorkout.routine_name_snapshot}
            </h2>
            <p className="text-sm text-text-secondary">
              Başlangıç {new Date(activeWorkout.started_at).toLocaleString('tr-TR')}
            </p>
          </div>
          <Link
            href="/workout/active"
            className="button-primary whitespace-nowrap"
          >
            Antrenmana Dön
          </Link>
        </div>
      )}

      {!routines || routines.length === 0 ? (
        <div className="surface-panel p-8 text-center flex flex-col items-center">
          <p className="text-text-primary font-medium mb-1">Henüz program yok.</p>
          <p className="text-text-secondary text-sm mb-4">
            Hareketlerini düzenlemek için bir program oluştur.
          </p>
          <Link 
            href="/workout/routines/new"
            className="button-secondary"
          >
            Program Oluştur
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border-subtle border-y border-border-subtle">
          {routines.map((routine) => {
            const exerciseCount = routine.routine_exercises?.length || 0;
            const exercisesSummary = routine.routine_exercises
              ?.slice(0, 5)
              .map((re) => re.exercises?.name && displayExerciseName(re.exercises.name))
              .filter(Boolean)
              .join(', ') || 'Hareket yok';

            return (
              <div 
                key={routine.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between py-4 sm:px-3 hover:bg-surface-high/40 transition-colors gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-base font-bold text-text-primary truncate">
                      {routine.name}
                    </h2>
                    <span className="text-xs text-text-muted">
                      {exerciseCount} hareket
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary truncate">
                    {exercisesSummary}
                  </p>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  <Link 
                    href={`/workout/routines/${routine.id}/edit`}
                    className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
                  >
                    Düzenle
                  </Link>
                  {!hasActiveWorkout && (
                    <StartWorkoutButton 
                      routineId={routine.id} 
                      hasActiveWorkout={false}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
