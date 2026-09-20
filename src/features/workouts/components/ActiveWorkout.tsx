'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ActiveWorkout as ActiveWorkoutType, PreviousPerformance } from '@/lib/supabase/workouts';
import { discardWorkoutAction, finishWorkoutAction } from '@/features/workouts/actions';
import { ExerciseRow } from './ExerciseRow';

interface ActiveWorkoutProps {
  initialWorkout: ActiveWorkoutType;
  previousPerformance: Record<string, PreviousPerformance[]>;
  unitPreference: 'kg' | 'lb';
}

export function ActiveWorkout({ initialWorkout, previousPerformance, unitPreference }: ActiveWorkoutProps) {
  const router = useRouter();
  const [isFinishing, setIsFinishing] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);

  // We can track the total completed sets to enable/disable the Finish button.
  // Initially derived from the snapshot. 
  // We'll use a simple counter that children can increment/decrement.
  const initialSetCount = initialWorkout.workout_exercises.reduce((acc, we) => acc + (we.workout_sets?.length || 0), 0);
  const [completedSetCount, setCompletedSetCount] = useState(initialSetCount);

  const [elapsedTime, setElapsedTime] = useState('00:00');

  useEffect(() => {
    const start = new Date(initialWorkout.started_at).getTime();
    
    const updateTimer = () => {
      const now = Date.now();
      const diffMs = Math.max(0, now - start);
      
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      
      const parts = [
        hours > 0 ? hours.toString().padStart(2, '0') : null,
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
      ].filter(Boolean);
      
      setElapsedTime(parts.join(':'));
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [initialWorkout.started_at]);

  const handleFinish = async () => {
    if (completedSetCount === 0) {
      alert('Antrenmanı bitirmeden önce en az bir set tamamlamalısın.');
      return;
    }
    
    setIsFinishing(true);
    try {
      const res = await finishWorkoutAction(initialWorkout.id);
      if (res.success) {
        router.push('/workout/routines');
      } else {
        alert(res.message);
      }
    } catch {
      alert('Antrenman bitirilemedi.');
    } finally {
      setIsFinishing(false);
    }
  };

  const handleDiscard = async () => {
    if (!confirm('Bu antrenmanı iptal etmek istediğine emin misin? Tüm ilerleme silinir.')) return;
    
    setIsDiscarding(true);
    try {
      const res = await discardWorkoutAction(initialWorkout.id);
      if (res.success) {
        router.push('/workout/routines');
      } else {
        alert(res.message);
      }
    } catch {
      alert('Antrenman iptal edilemedi.');
    } finally {
      setIsDiscarding(false);
    }
  };

  const handleSetAdded = () => setCompletedSetCount(c => c + 1);
  const handleSetRemoved = () => setCompletedSetCount(c => Math.max(0, c - 1));

  return (
    <div className="mx-auto w-full max-w-[24rem] flex-1 px-6 pb-12 pt-12 sm:max-w-2xl sm:px-8">
      <div className="mb-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="page-eyebrow mb-2 text-accent">Aktif Antrenman</p>
            <div className="flex items-baseline gap-2">
              <span className="metric-value text-[1.85rem] font-sans font-medium tracking-[-0.065em]">{elapsedTime}</span>
              <span className="page-eyebrow text-[9px]">Süre</span>
            </div>
          </div>
          <button
            onClick={handleFinish}
            disabled={isFinishing || isDiscarding || completedSetCount === 0}
            className="min-h-10 border border-accent bg-accent px-5 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isFinishing ? 'Bitiriliyor...' : 'Bitir'}
          </button>
        </div>
        <div className="mt-7 flex items-center justify-between gap-3">
          <Link 
            href="/workout/routines"
            className="inline-flex min-h-8 items-center text-[11px] text-text-muted hover:text-text-primary transition-colors group"
          >
            <span className="mr-1 group-hover:-translate-x-0.5 transition-transform">←</span>
            Programlar
          </Link>
          <button
            onClick={handleDiscard}
            disabled={isDiscarding || isFinishing}
            className="text-[11px] text-text-muted hover:text-status-danger disabled:opacity-50"
          >
            {isDiscarding ? 'İptal ediliyor...' : 'İptal Et'}
          </button>
        </div>
        <p className="mt-5 truncate text-xs text-text-muted">{initialWorkout.routine_name_snapshot}</p>
      </div>

      <div className="flex flex-col gap-5">
        {initialWorkout.workout_exercises.map((we) => (
          <ExerciseRow 
            key={we.id}
            workoutExercise={we}
            previousPerformance={previousPerformance[we.exercise_id] || []}
            unitPreference={unitPreference}
            onSetAdded={handleSetAdded}
            onSetRemoved={handleSetRemoved}
          />
        ))}
      </div>

      <div className="mt-8 flex justify-center border-t border-border-subtle pt-5">
        <button
          onClick={handleFinish}
          disabled={isFinishing || isDiscarding || completedSetCount === 0}
          className="button-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isFinishing ? 'Bitiriliyor...' : 'Antrenmanı Bitir'}
        </button>
      </div>
    </div>
  );
}
