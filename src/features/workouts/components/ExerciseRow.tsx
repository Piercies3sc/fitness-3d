'use client';

import { useState, useEffect, useRef } from 'react';
import { WorkoutExerciseWithSets, PreviousPerformance } from '@/lib/supabase/workouts';
import { logSetAction, removeSetAction } from '@/features/workouts/actions';
import { kgToLb, lbToKg, parseWeightInput } from '@/utils/weight-conversion';
import { displayExerciseName } from '@/lib/ui/turkish';

interface ExerciseRowProps {
  workoutExercise: WorkoutExerciseWithSets;
  previousPerformance: PreviousPerformance[];
  unitPreference: 'kg' | 'lb';
  onSetAdded: () => void;
  onSetRemoved: () => void;
}

type LocalSet = {
  set_number: number;
  set_type: 'warmup' | 'working';
  weight: string;
  reps: string;
  isCompleted: boolean;
  isSaving: boolean;
};

export function ExerciseRow({ workoutExercise, previousPerformance, unitPreference, onSetAdded, onSetRemoved }: ExerciseRowProps) {
  // Initialize local sets from snapshot
  const [sets, setSets] = useState<LocalSet[]>(() => {
    const existing = workoutExercise.workout_sets.map(s => ({
      set_number: s.set_number,
      set_type: s.set_type,
      weight: (unitPreference === 'lb' ? kgToLb(s.weight_kg) : s.weight_kg).toString(),
      reps: s.reps.toString(),
      isCompleted: true,
      isSaving: false
    }));
    
    const plannedSets = workoutExercise.planned_sets_snapshot || 0;
    const currentMaxSet = existing.length > 0 ? Math.max(...existing.map(s => s.set_number)) : 0;
    const totalWorkingSets = existing.filter(s => s.set_type === 'working').length;
    
    const setsToAdd = Math.max(0, plannedSets - totalWorkingSets);
    let nextSetNum = currentMaxSet + 1;
    
    const uncompletedSets: LocalSet[] = [];
    for (let i = 0; i < setsToAdd; i++) {
      uncompletedSets.push({
        set_number: nextSetNum++,
        set_type: 'working',
        weight: '',
        reps: '',
        isCompleted: false,
        isSaving: false
      });
    }

    if (existing.length === 0 && uncompletedSets.length === 0) {
      uncompletedSets.push({ set_number: 1, set_type: 'working', weight: '', reps: '', isCompleted: false, isSaving: false });
    }

    return [...existing, ...uncompletedSets];
  });

  const [restTimer, setRestTimer] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (restTimer !== null && restTimer > 0) {
      timerRef.current = setTimeout(() => setRestTimer(r => r! - 1), 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [restTimer]);

  const handleAddSet = (type: 'warmup' | 'working') => {
    if (type === 'warmup') {
      const firstUncompletedIndex = sets.findIndex(s => !s.isCompleted);
      if (firstUncompletedIndex !== -1) {
        const newSets = [...sets];
        const newSetNumber = newSets[firstUncompletedIndex].set_number;
        for (let i = firstUncompletedIndex; i < newSets.length; i++) {
          newSets[i].set_number += 1;
        }
        const lastSet = firstUncompletedIndex > 0 ? newSets[firstUncompletedIndex - 1] : null;
        const newSet: LocalSet = {
          set_number: newSetNumber,
          set_type: type,
          weight: lastSet ? lastSet.weight : '',
          reps: lastSet ? lastSet.reps : '',
          isCompleted: false,
          isSaving: false
        };
        newSets.splice(firstUncompletedIndex, 0, newSet);
        setSets(newSets);
        return;
      }
    }

    const nextNumber = sets.length > 0 ? Math.max(...sets.map(s => s.set_number)) + 1 : 1;
    const lastSet = sets[sets.length - 1];
    setSets([...sets, {
      set_number: nextNumber,
      set_type: type,
      weight: lastSet ? lastSet.weight : '',
      reps: lastSet ? lastSet.reps : '',
      isCompleted: false,
      isSaving: false
    }]);
  };

  const handleUpdateInput = (index: number, field: 'weight' | 'reps', value: string) => {
    const newSets = [...sets];
    newSets[index][field] = value;
    // If they edit a completed set, we un-complete it to require them to log it again, 
    // or we just auto-save. For workout loggers, un-completing is standard so they explicitly check it off.
    if (newSets[index].isCompleted) {
      newSets[index].isCompleted = false;
      onSetRemoved(); // decrement global counter
    }
    setSets(newSets);
  };

  const handleToggleComplete = async (index: number) => {
    const s = sets[index];
    if (s.isSaving) return;

    if (s.isCompleted) {
      // Un-complete
      const newSets = [...sets];
      newSets[index].isSaving = true;
      setSets(newSets);

      const res = await removeSetAction(workoutExercise.id, s.set_number);
      
      const revertedSets = [...sets];
      revertedSets[index].isSaving = false;
      if (res.success) {
        revertedSets[index].isCompleted = false;
        onSetRemoved();
      } else {
        alert(res.message);
      }
      setSets(revertedSets);
    } else {
      // Complete
      const parsedWeight = parseWeightInput(s.weight);
      const parsedReps = parseInt(s.reps, 10);
      
      if (isNaN(parsedReps) || parsedReps <= 0) {
        alert('Lütfen geçerli tekrar sayısı girin.');
        return;
      }
      if (parsedWeight < 0) {
        alert('Ağırlık negatif olamaz.');
        return;
      }

      const weightKg = unitPreference === 'lb' ? lbToKg(parsedWeight) : parsedWeight;

      const newSets = [...sets];
      newSets[index].isSaving = true;
      setSets(newSets);

      const res = await logSetAction({
        workout_exercise_id: workoutExercise.id,
        set_number: s.set_number,
        weight_kg: weightKg,
        reps: parsedReps,
        set_type: s.set_type
      });

      const updatedSets = [...sets];
      updatedSets[index].isSaving = false;
      if (res.success) {
        updatedSets[index].isCompleted = true;
        onSetAdded();
        setRestTimer(90); // start 90s rest
      } else {
        alert(res.message);
      }
      setSets(updatedSets);
    }
  };

  const getOrdinal = (index: number) => {
    const workingSetsUpToHere = sets.slice(0, index + 1).filter(set => set.set_type === 'working');
    return workingSetsUpToHere.length;
  };

  const getPreviousForSet = (index: number) => {
    const s = sets[index];
    if (s.set_type === 'warmup') return '—';
    
    const ordinal = getOrdinal(index);
    const prev = previousPerformance.find(p => p.set_number === ordinal);
    if (!prev) return '—';
    
    const displayWeight = unitPreference === 'lb' ? kgToLb(prev.weight_kg) : prev.weight_kg;
    return `${displayWeight} × ${prev.reps}`;
  };

  return (
    <section className="surface-panel p-4 sm:p-5">
      <div className="flex flex-row justify-between items-start gap-3 mb-4 border-b border-border-subtle pb-3">
        <div>
          <p className="section-eyebrow mb-1">Hareket</p>
          <h3 className="section-heading text-base sm:text-lg">
          {displayExerciseName(workoutExercise.exercises?.name || 'Bilinmeyen hareket')}
          </h3>
        </div>
        <div className="shrink-0 text-right text-[11px] text-text-muted font-medium">
          Hedef: {workoutExercise.planned_sets_snapshot} set
          {workoutExercise.target_reps_min_snapshot && ` • ${workoutExercise.target_reps_min_snapshot}-${workoutExercise.target_reps_max_snapshot} tekrar`}
        </div>
      </div>

      <div className="space-y-3">
        {/* Header Row */}
        <div className="flex flex-row items-center text-[10px] font-semibold text-text-muted uppercase tracking-[0.12em] mb-2 px-1">
          <div className="w-8 text-center">Set</div>
          <div className="flex-1 text-center">Önceki</div>
          <div className="flex-1 text-center">{unitPreference === 'lb' ? 'lbs' : 'kg'}</div>
          <div className="flex-1 text-center">Tekrar</div>
          <div className="w-11 text-center">✓</div>
        </div>

        {sets.map((s, idx) => (
          <div 
            key={s.set_number}
            className={`flex flex-row items-center gap-2 p-1 rounded transition-colors ${s.isCompleted ? 'bg-status-success/10 border border-status-success/30' : 'bg-transparent'}`}
          >
            {/* Set Indicator */}
            <div className="w-8 flex justify-center">
              <span className={`text-sm font-bold font-mono ${s.set_type === 'warmup' ? 'text-status-warning' : 'text-text-secondary'}`}>
                {s.set_type === 'warmup' ? 'W' : getOrdinal(idx)}
              </span>
            </div>

            {/* Previous Performance */}
            <div className="flex-1 text-center text-xs font-mono text-text-muted truncate px-1">
              {getPreviousForSet(idx)}
            </div>

            {/* Weight Input */}
            <div className="flex-1">
              <input
                type="text"
                inputMode="decimal"
                value={s.weight}
                onChange={(e) => handleUpdateInput(idx, 'weight', e.target.value)}
                disabled={s.isSaving}
                className={`field-control w-full h-11 min-h-11 text-center text-lg font-semibold font-mono ${s.isCompleted ? 'border-transparent bg-transparent' : ''} px-1 disabled:opacity-50`}
                placeholder=""
              />
            </div>

            {/* Reps Input */}
            <div className="flex-1">
              <input
                type="number"
                inputMode="numeric"
                value={s.reps}
                onChange={(e) => handleUpdateInput(idx, 'reps', e.target.value)}
                disabled={s.isSaving}
                className={`field-control w-full h-11 min-h-11 text-center text-lg font-semibold font-mono ${s.isCompleted ? 'border-transparent bg-transparent' : ''} px-1 disabled:opacity-50`}
                placeholder=""
              />
            </div>

            {/* Check Action */}
            <div className="w-11 flex justify-center">
              <button
                onClick={() => handleToggleComplete(idx)}
                disabled={s.isSaving}
                className={`w-11 h-11 flex items-center justify-center rounded transition-colors ${
                  s.isCompleted 
                  ? 'bg-status-success text-white' 
                    : 'bg-surface-high border border-border-strong text-text-muted hover:bg-border-subtle'
                } disabled:opacity-50`}
              >
                {s.isSaving ? '...' : '✓'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {restTimer !== null && restTimer > 0 && (
        <div className="surface-inset mt-4 flex items-center justify-between px-3 py-2 text-sm">
          <span className="text-text-muted">Dinlenme sayacı</span>
          <span className="metric-value text-base text-accent">{Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}</span>
        </div>
      )}

      <div className="mt-5 flex flex-row gap-3 border-t border-border-subtle pt-4">
        <button
          onClick={() => handleAddSet('warmup')}
          className="button-secondary flex-1 h-11 min-h-11 text-sm"
        >
          + Isınma
        </button>
        <button
          onClick={() => handleAddSet('working')}
          className="flex-1 h-11 min-h-11 rounded border border-accent/30 bg-accent/10 text-sm font-semibold text-accent hover:bg-accent/20 transition-colors"
        >
          + Set
        </button>
      </div>
    </section>
  );
}
