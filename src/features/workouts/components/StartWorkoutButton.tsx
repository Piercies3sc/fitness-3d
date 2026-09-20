'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { startWorkoutAction } from '@/features/workouts/actions';

interface StartWorkoutButtonProps {
  routineId: string;
  hasActiveWorkout: boolean;
  className?: string;
}

export function StartWorkoutButton({ routineId, hasActiveWorkout, className = '' }: StartWorkoutButtonProps) {
  const [isStarting, setIsStarting] = useState(false);
  const router = useRouter();

  const handleStart = async () => {
    if (hasActiveWorkout) {
      alert('Zaten aktif bir antrenmanın var. Önce bitir veya iptal et.');
      return;
    }
    
    setIsStarting(true);
    try {
      const result = await startWorkoutAction(routineId);
      if (result.success) {
        router.push('/workout/active');
      } else if (result.message === 'ACTIVE_EXISTS') {
        alert('Zaten aktif bir antrenmanın var.');
        router.refresh();
      } else {
        alert(result.message || 'Antrenman başlatılamadı.');
      }
    } catch {
      alert('Beklenmeyen bir hata oluştu.');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <button
      onClick={handleStart}
      disabled={isStarting || hasActiveWorkout}
      className={`bg-accent hover:bg-accent-hover text-white text-sm font-medium py-1.5 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isStarting ? 'Başlatılıyor...' : 'Antrenmana Başla'}
    </button>
  );
}
