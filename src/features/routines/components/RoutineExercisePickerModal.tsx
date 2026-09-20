'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ExerciseWithMuscles } from '@/lib/supabase/exercises';
import { displayExerciseName, displayMuscleName } from '../../../lib/ui/turkish';

const REGION_ORDER = [
  { key: 'chest', label: 'Göğüs' },
  { key: 'back', label: 'Sırt' },
  { key: 'shoulders', label: 'Omuz' },
  { key: 'biceps', label: 'Biceps' },
  { key: 'triceps', label: 'Triceps' },
  { key: 'quadriceps', label: 'Ön Bacak' },
  { key: 'hamstrings', label: 'Arka Bacak' },
  { key: 'glutes', label: 'Kalça' },
  { key: 'calves', label: 'Baldır' },
  { key: 'core', label: 'Karın' },
] as const;

interface RoutineExercisePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogExercises: ExerciseWithMuscles[];
  addedExerciseIds: Set<string>;
  onSelectExercise: (exercise: ExerciseWithMuscles) => void;
}

export function filterCatalogExercises(
  catalogExercises: ExerciseWithMuscles[],
  activeFilter: string,
  searchQuery: string
): ExerciseWithMuscles[] {
  const q = searchQuery.trim().toLowerCase();

  return catalogExercises.filter((ex) => {
    // Home filter
    if (activeFilter === 'home' && !ex.home_friendly) {
      return false;
    }

    // Region filter
    if (
      activeFilter !== 'home' &&
      activeFilter !== 'all' &&
      (ex.body_region || '').toLowerCase() !== activeFilter
    ) {
      return false;
    }

    // Search matching: name, equipment, region, muscles
    if (q) {
      const nameMatch = ex.name.toLowerCase().includes(q) || displayExerciseName(ex.name).toLowerCase().includes(q);
      const equipMatch = (ex.equipment || '').toLowerCase().includes(q);
      const regionMatch = (ex.body_region || '').toLowerCase().includes(q);
      const muscleMatch = ex.exercise_muscles?.some((em) =>
        em.muscles && (em.muscles.name.toLowerCase().includes(q) || displayMuscleName(em.muscles.name).toLowerCase().includes(q))
      );
      return nameMatch || equipMatch || regionMatch || muscleMatch;
    }

    return true;
  });
}

export function RoutineExercisePickerModal({
  isOpen,
  onClose,
  catalogExercises,
  addedExerciseIds,
  onSelectExercise,
}: RoutineExercisePickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('home');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setSearchQuery('');
    setActiveFilter('home');
    onClose();
  }, [onClose]);

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Lock body scroll when open on mobile
  useEffect(() => {
    if (isOpen) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Filtered exercises based on search query and active filter
  const filteredExercises = useMemo(() => {
    return filterCatalogExercises(catalogExercises, activeFilter, searchQuery);
  }, [catalogExercises, activeFilter, searchQuery]);

  // Region label helper
  function formatRegion(regionKey: string | null): string {
    if (!regionKey) return '';
    const match = REGION_ORDER.find((r) => r.key === regionKey.toLowerCase());
    return match ? match.label : regionKey.charAt(0).toUpperCase() + regionKey.slice(1);
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-picker-title"
    >
      <div
        className="w-full sm:max-w-lg bg-surface border-t sm:border border-border-strong rounded-t-[12px] sm:rounded-[12px] max-h-[85vh] sm:max-h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between shrink-0">
          <div>
            <h2 id="exercise-picker-title" className="text-base font-semibold text-text-primary">
              Hareket Ekle
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Bu programa eklemek için bir hareket seç.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-11 h-11 -mr-2 flex items-center justify-center text-text-muted hover:text-text-primary text-lg transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-md"
            aria-label="Pencereyi kapat"
          >
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-border-subtle/70 bg-surface-high shrink-0">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hareket ara..."
              className="field-control w-full pl-3.5 pr-8 text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 text-xs"
                aria-label="Aramayı temizle"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters: All, Home, and regions */}
          <div className="flex gap-1.5 overflow-x-auto pt-2 pb-0.5 no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded border whitespace-nowrap transition-colors ${
                activeFilter === 'all'
                  ? 'bg-accent border-accent text-white font-semibold'
                  : 'bg-surface border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-strong'
              }`}
            >
              Tümü
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('home')}
              className={`px-2.5 py-1 rounded border whitespace-nowrap transition-colors ${
                activeFilter === 'home'
                  ? 'bg-accent border-accent text-white font-semibold'
                  : 'bg-surface border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-strong'
              }`}
            >
              Ev
            </button>
            {REGION_ORDER.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveFilter(key)}
                className={`px-2.5 py-1 rounded border whitespace-nowrap transition-colors ${
                  activeFilter === key
                    ? 'bg-accent border-accent text-white font-semibold'
                    : 'bg-surface border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-strong'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border-subtle/50 px-2 py-1">
          {filteredExercises.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-xs">
              Aramanla eşleşen hareket yok.
            </div>
          ) : (
            filteredExercises.map((exercise) => {
              const isAdded = addedExerciseIds.has(exercise.id);
              const regionText = formatRegion(exercise.body_region);
              const metadataText = [regionText, exercise.equipment]
                .filter(Boolean)
                .join(' · ');

              return (
                <button
                  key={exercise.id}
                  type="button"
                  disabled={isAdded}
                  onClick={() => {
                    if (!isAdded) {
                      onSelectExercise(exercise);
                      handleClose();
                    }
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-md flex items-center justify-between transition-colors min-h-[44px] ${
                    isAdded
                      ? 'opacity-40 cursor-not-allowed bg-transparent'
                      : 'hover:bg-surface-high active:bg-surface-high/80 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent cursor-pointer'
                  }`}
                >
                  <div className="pr-3 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-sm font-medium truncate ${
                          isAdded ? 'text-text-muted' : 'text-text-primary'
                        }`}
                      >
                        {displayExerciseName(exercise.name)}
                      </span>
                      {exercise.home_friendly && (
                        <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.2 rounded bg-surface-high border border-border-subtle text-text-secondary">
                          Ev
                        </span>
                      )}
                    </div>
                    {metadataText && (
                      <div className="text-xs text-text-muted truncate mt-0.5">
                        {metadataText}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 text-xs">
                    {isAdded ? (
                      <span className="px-2 py-0.5 rounded bg-surface-high border border-border-subtle text-text-muted font-medium">
                        Eklendi
                      </span>
                    ) : (
                      <span className="text-accent text-sm font-semibold px-2 py-1">
                        + Ekle
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border-subtle bg-surface-high/50 flex justify-between items-center text-xs text-text-muted shrink-0">
          <span>
            {filteredExercises.length} hareket
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="button-secondary min-h-9 px-3 py-1.5 text-xs"
          >
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}
