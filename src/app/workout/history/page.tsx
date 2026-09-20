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
    <main className="mx-auto w-full max-w-[24rem] flex-1 px-6 pb-12 pt-12 sm:max-w-2xl sm:px-8">
      <div className="border-b border-border-subtle pb-8">
        <div className="mb-9 flex items-center justify-between">
          <p className="page-eyebrow text-text-primary">Fitness 3D</p>
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
        </div>
        <BackLink href="/home" text="Ana Sayfaya Dön" />
        <p className="page-eyebrow mb-3">Geçmiş</p>
        <h1 className="text-[2rem] font-medium tracking-[-0.055em] text-text-primary">Antrenmanlar</h1>
        <p className="mt-3 max-w-[18rem] text-sm leading-6 text-text-secondary">Tüm kayıtlı antrenman seanslarını burada inceleyebilirsin.</p>
      </div>

      {!workouts || workouts.length === 0 ? (
        <div className="mt-8 border border-border-strong/70 bg-surface p-8 text-center flex flex-col items-center">
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
        <div className="mt-9 space-y-8">
          {workouts.map((workout, index) => {
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
            const monthLabel = workout.completed_at
              ? new Date(workout.completed_at).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }).toLocaleUpperCase('tr-TR')
              : 'BİLİNMEYEN TARİH';
            const previousWorkout = workouts[index - 1];
            const previousMonthLabel = previousWorkout?.completed_at
              ? new Date(previousWorkout.completed_at).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }).toLocaleUpperCase('tr-TR')
              : null;

            return (
              <article key={workout.id}>
              {monthLabel !== previousMonthLabel && <p className="page-eyebrow mb-3">{monthLabel}</p>}
              <Link 
                key={workout.id} 
                href={`/workout/history/${workout.id}`}
                className="group flex flex-col border-t border-border-subtle py-4 transition-colors hover:bg-surface-high/30"
              >
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="section-heading text-base sm:text-lg truncate" title={workout.routine_name_snapshot}>
                      {workout.routine_name_snapshot}
                    </h2>
                    <p className="mt-0.5 text-[11px] text-text-muted">
                      {dateStr}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start shrink-0">
                    {workout.prCount ? (
                    <span className="text-xs font-semibold text-accent">
                        {workout.prCount} PR{workout.prCount === 1 ? '' : 's'}
                      </span>
                    ) : null}
                    <span className="pt-0.5 text-text-muted transition-transform group-hover:translate-x-0.5">›</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2 border border-border-subtle/70 bg-surface/40 px-3 py-3 text-sm">
                  <div className="flex flex-col">
                    <span className="text-text-muted text-[9px] uppercase tracking-wider mb-0.5">Süre</span>
                    <span className="metric-value text-sm">{duration}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-text-muted text-[9px] uppercase tracking-wider mb-0.5">Hareket</span>
                    <span className="metric-value text-sm">{exerciseCount}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-text-muted text-[9px] uppercase tracking-wider mb-0.5">Set</span>
                    <span className="metric-value text-sm">{workingSetCount}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-text-muted text-[9px] uppercase tracking-wider mb-0.5">Hacim</span>
                    <span className="metric-value text-sm">{displayVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="font-sans text-[9px] tracking-normal">{unitPreference === 'lb' ? 'lb' : 'kg'}</span></span>
                  </div>
                </div>
              </Link>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
