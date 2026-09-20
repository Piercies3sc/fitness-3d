import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BackLink } from '@/components/ui/BackLink';
import { getWorkoutHistory } from '@/lib/supabase/workouts';
import { calculateWorkoutVolume } from '@/lib/calculations/workout';
import { createClient } from '@/lib/supabase/server';
import { kgToLb } from '@/utils/weight-conversion';

export const metadata = {
  title: 'Antrenman Geçmişi | Fitness 3D',
};

function formatDuration(start: string, end: string | null) {
  if (!end) return '—';
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  if (diffMs < 60000) return '<1 dk';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours} sa ${remainingMins.toString().padStart(2, '0')} dk`;
}

export default async function HistoryPage() {
  const supabase = await createClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: authData } = await supabase.auth.getClaims() as any;
  const userId = authData?.claims?.sub;

  if (!userId) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('unit_preference')
    .eq('id', userId)
    .single();

  const unitPreference = profile?.unit_preference || 'kg';
  const workouts = await getWorkoutHistory(userId, 20);

  return (
    <main className="page-shell flex-1 max-w-5xl">
      <div className="page-header flex flex-row items-center justify-between">
        <div>
          <BackLink href="/home" text="Ana Sayfaya Dön" />
          <p className="page-eyebrow mb-2">Tamamlanan seanslar</p>
          <h1 className="page-title">Antrenman geçmişi</h1>
          <p className="mt-2 text-sm text-text-secondary">Tamamladığın antrenman seansları.</p>
        </div>
      </div>

      {!workouts || workouts.length === 0 ? (
        <div className="surface-panel p-8 text-center flex flex-col items-center">
          <p className="text-text-primary font-medium mb-1">Henüz tamamlanan antrenman yok.</p>
          <p className="text-text-secondary text-sm mb-6">
            Burada görmek için bir antrenmanı tamamla.
          </p>
          <Link 
            href="/workout/routines"
            className="button-primary"
          >
            Programlara Git
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border-subtle border-y border-border-subtle">
          {workouts.map((workout) => {
            const duration = formatDuration(workout.started_at, workout.completed_at);
            const dateStr = workout.completed_at 
              ? new Date(workout.completed_at).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Bilinmeyen tarih';

            const exerciseCount = workout.workout_exercises?.length || 0;
            let workingSetCount = 0;
            workout.workout_exercises?.forEach(ex => {
              workingSetCount += (ex.workout_sets?.filter(s => s.set_type === 'working').length || 0);
            });

            const volumeKg = calculateWorkoutVolume(workout.workout_exercises || []);
            const displayVolume = unitPreference === 'lb' ? kgToLb(volumeKg) : volumeKg;

            return (
              <Link 
                key={workout.id} 
                href={`/workout/history/${workout.id}`}
                className="group flex flex-col py-4 sm:px-3 hover:bg-surface-high/40 transition-colors duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-2">
                  <div className="flex-1 min-w-0">
                    <h2 className="section-heading text-base sm:text-lg truncate" title={workout.routine_name_snapshot}>
                      {workout.routine_name_snapshot}
                    </h2>
                    <p className="text-sm text-text-secondary mt-0.5">
                      {dateStr}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start shrink-0">
                    {workout.prCount ? (
                    <span className="text-xs font-semibold text-accent">
                        {workout.prCount} PR{workout.prCount === 1 ? '' : 's'}
                      </span>
                    ) : null}
                    <div className="text-sm font-mono font-medium text-text-muted">
                      {duration}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border-subtle text-sm">
                  <div className="flex flex-col">
                    <span className="text-text-muted text-xs uppercase tracking-wider mb-0.5">Hareketler</span>
                    <span className="metric-value text-base">{exerciseCount}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-text-muted text-xs uppercase tracking-wider mb-0.5">Çalışma Setleri</span>
                    <span className="metric-value text-base">{workingSetCount}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-text-muted text-xs uppercase tracking-wider mb-0.5">Volume</span>
                    <span className="metric-value text-base">{displayVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="font-sans text-xs tracking-normal">{unitPreference === 'lb' ? 'lb·reps' : 'kg·reps'}</span></span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
