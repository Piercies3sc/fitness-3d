import { notFound, redirect } from 'next/navigation';
import { BackLink } from '@/components/ui/BackLink';
import { getCompletedWorkout } from '@/lib/supabase/workouts';
import { getBestEstimated1RM, calculateSetVolume } from '@/lib/calculations/workout';
import { createClient } from '@/lib/supabase/server';
import { kgToLb } from '@/utils/weight-conversion';
import { displayExerciseName } from '@/lib/ui/turkish';

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

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export default async function HistoryDetailPage({ params }: { params: Promise<{ workoutId: string }> }) {
  const { workoutId } = await params;
  const supabase = await createClient();
  
  const { data: authData } = await supabase.auth.getClaims();
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
  const workout = await getCompletedWorkout(workoutId);

  if (!workout) {
    notFound();
  }

  const dateStr = workout.completed_at 
    ? new Date(workout.completed_at).toLocaleDateString('tr-TR', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : 'Bilinmeyen tarih';
    
  const duration = formatDuration(workout.started_at, workout.completed_at);
  const startTime = formatTime(workout.started_at);
  const endTime = workout.completed_at ? formatTime(workout.completed_at) : '—';
  const unitLabel = unitPreference === 'lb' ? 'lbs' : 'kg';

  return (
    <main className="page-shell flex-1 max-w-4xl">
      <div className="page-header">
        <BackLink href="/workout/history" text="Geçmişe Dön" />
        <p className="page-eyebrow mb-2">Tamamlanan antrenman</p>
        <h1 className="page-title">{workout.routine_name_snapshot}</h1>
        <p className="mt-2 text-text-secondary text-sm sm:text-base">
          {dateStr}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8 border-y border-border-subtle py-4 text-sm">
        <div className="flex flex-col">
          <span className="text-text-muted text-xs uppercase tracking-wider mb-1">Başlangıç</span>
          <span className="metric-value text-base">{startTime}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-text-muted text-xs uppercase tracking-wider mb-1">Bitiş</span>
          <span className="metric-value text-base">{endTime}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-text-muted text-xs uppercase tracking-wider mb-1">Süre</span>
          <span className="metric-value text-base">{duration}</span>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {workout.workout_exercises.map((we, index) => {
          const e1rmKg = getBestEstimated1RM(we.workout_sets);
          let e1rmDisplay: string | null = null;
          if (e1rmKg !== null) {
            const e1rmVal = unitPreference === 'lb' ? kgToLb(e1rmKg) : e1rmKg;
            e1rmDisplay = `${e1rmVal.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unitLabel}`;
          }

          let exerciseVolumeKg = 0;
          we.workout_sets.forEach(set => {
            exerciseVolumeKg += calculateSetVolume(set.weight_kg, set.reps, set.set_type);
          });
          const exerciseVolumeDisplay = unitPreference === 'lb' ? kgToLb(exerciseVolumeKg) : exerciseVolumeKg;

          // Compute visually appealing ordinals
          let workingCount = 0;
          
          const exPrs = workout.prs?.[we.exercise_id];
          const hasAnyPR = exPrs && (exPrs.weightPR || exPrs.estimated1RMPR || exPrs.volumePR || (exPrs.repPRs && exPrs.repPRs.length > 0));
          
          return (
            <div key={we.id} className="surface-panel p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-2">
                <h3 className="text-lg font-bold text-text-primary flex-1">
                  {index + 1}. {displayExerciseName(we.exercises?.name || 'Bilinmeyen hareket')}
                </h3>
                {e1rmDisplay && (
                  <div className="shrink-0 flex items-center bg-accent/10 border border-accent/20 px-2 py-1 rounded text-xs font-semibold text-accent self-start">
                    Tahmini 1RM: {e1rmDisplay}
                  </div>
                )}
              </div>

              {we.workout_sets.length === 0 ? (
                <p className="text-sm text-text-muted italic px-1">Set kaydı yok.</p>
              ) : (
                <div className="space-y-1">
                  <div className="flex flex-row items-center text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
                    <div className="w-10 text-center">Set</div>
                    <div className="flex-1 text-center">{unitLabel}</div>
                    <div className="flex-1 text-center">Tekrar</div>
                    <div className="flex-1 text-right sm:text-center">Hacim</div>
                  </div>
                  
                  {we.workout_sets.map(set => {
                    const isWarmup = set.set_type === 'warmup';
                    if (!isWarmup) workingCount++;
                    
                    const setVolumeKg = calculateSetVolume(set.weight_kg, set.reps, set.set_type);
                    const setVolume = unitPreference === 'lb' ? kgToLb(setVolumeKg) : setVolumeKg;
                    
                    const displayWeight = unitPreference === 'lb' ? kgToLb(set.weight_kg) : set.weight_kg;

                    return (
                      <div 
                        key={set.id}
                        className={`flex flex-row items-center gap-2 p-2 rounded ${isWarmup ? 'bg-transparent text-text-secondary' : 'bg-surface-high text-text-primary'}`}
                      >
                        <div className="w-10 flex justify-center">
                          <span className={`text-sm font-bold ${isWarmup ? 'text-status-warning' : 'text-text-primary'}`}>
                            {isWarmup ? 'W' : workingCount}
                          </span>
                        </div>
                        <div className="flex-1 text-center font-medium">
                          {displayWeight.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </div>
                        <div className="flex-1 text-center font-medium">
                          {set.reps}
                        </div>
                        <div className="flex-1 text-right sm:text-center text-text-muted text-sm">
                          {isWarmup ? '—' : setVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {hasAnyPR && (
                <div className="mt-4 pt-4 border-t border-border-subtle flex flex-wrap gap-2">
                  {exPrs.weightPR ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-accent/10 border border-accent/20 text-xs font-semibold text-accent">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                      Ağırlık PR: {(unitPreference === 'lb' ? kgToLb(exPrs.weightPR) : exPrs.weightPR).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} {unitLabel}
                    </span>
                  ) : null}
                  {exPrs.estimated1RMPR ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-accent/10 border border-accent/20 text-xs font-semibold text-accent">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                      Tahmini 1RM PR: {(unitPreference === 'lb' ? kgToLb(exPrs.estimated1RMPR) : exPrs.estimated1RMPR).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} {unitLabel}
                    </span>
                  ) : null}
                  {exPrs.volumePR ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-accent/10 border border-accent/20 text-xs font-semibold text-accent">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                      Hacim PR: {(unitPreference === 'lb' ? kgToLb(exPrs.volumePR) : exPrs.volumePR).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} {unitPreference === 'lb' ? 'lb·tekrar' : 'kg·tekrar'}
                    </span>
                  ) : null}
                  {exPrs.repPRs?.map(repPR => {
                    const displayLoad = unitPreference === 'lb' ? kgToLb(repPR.load) : repPR.load;
                    return (
                      <span key={`rep-${repPR.load}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-accent/10 border border-accent/20 text-xs font-semibold text-accent">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                        Tekrar PR: {repPR.reps} tekrar @ {displayLoad.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} {unitLabel}
                      </span>
                    );
                  })}
                </div>
              )}
              
              {exerciseVolumeKg > 0 && !hasAnyPR && (
                <div className="mt-3 pt-3 border-t border-border-subtle flex justify-end items-center text-sm">
                  <span className="text-text-muted mr-2">Hareket Hacmi:</span>
                  <span className="font-semibold text-text-primary">
                    {exerciseVolumeDisplay.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} {unitPreference === 'lb' ? 'lb·tekrar' : 'kg·tekrar'}
                  </span>
                </div>
              )}
              
              {exerciseVolumeKg > 0 && hasAnyPR && !exPrs.volumePR && (
                <div className="mt-2 flex justify-end items-center text-sm">
                  <span className="text-text-muted mr-2">Hareket Hacmi:</span>
                  <span className="font-semibold text-text-primary">
                    {exerciseVolumeDisplay.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} {unitPreference === 'lb' ? 'lb·tekrar' : 'kg·tekrar'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
