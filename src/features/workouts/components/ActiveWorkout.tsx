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
    <div className="page-shell flex-1 max-w-4xl pb-28 sm:pb-10">
      <div className="mb-6 border-b border-border-subtle pb-4 sm:mb-8">
        <div className="flex items-center justify-between mb-5">
          <Link 
            href="/workout/routines"
            className="inline-flex min-h-11 items-center text-sm font-medium text-text-secondary hover:text-text-primary transition-colors group"
          >
            <span className="mr-1 group-hover:-translate-x-0.5 transition-transform">←</span>
            Küçült
          </Link>
          <button
            onClick={handleDiscard}
            disabled={isDiscarding || isFinishing}
            className="button-tertiary min-h-11 text-sm text-status-danger hover:text-status-danger disabled:opacity-50"
          >
            {isDiscarding ? 'İptal ediliyor...' : 'İptal Et'}
          </button>
        </div>
        <p className="page-eyebrow mb-2">Aktif antrenman</p>
        <h1 className="page-title text-2xl sm:text-3xl truncate">
          {initialWorkout.routine_name_snapshot}
        </h1>
        <div className="mt-3 flex items-center gap-3">
          <span className="metric-value text-xl text-accent">{elapsedTime}</span>
          <span className="text-text-muted text-xs">
            Başlangıç {new Date(initialWorkout.started_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
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

      {/* Floating Action Bar for Mobile-First UX */}
      <div className="fixed sm:static bottom-0 left-0 right-0 border-t border-border-subtle bg-bg-elevated/95 p-3 backdrop-blur-sm sm:mt-8 sm:border-t-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none flex flex-row items-center justify-center sm:justify-end z-10 pb-safe">
        <button
          onClick={handleFinish}
          disabled={isFinishing || isDiscarding || completedSetCount === 0}
          className="button-primary w-full sm:w-auto sm:min-w-44 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isFinishing ? 'Bitiriliyor...' : 'Antrenmanı Bitir'}
        </button>
      </div>
    </div>
  );
}
