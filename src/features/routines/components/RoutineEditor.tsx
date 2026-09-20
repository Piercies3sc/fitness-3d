'use client';

import { useState, useTransition, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createRoutineAction, updateRoutineAction, deleteRoutineAction, RoutineFormData } from '@/features/routines/actions';
import { ExerciseWithMuscles } from '@/lib/supabase/exercises';
import { RoutineWithExercises } from '@/lib/supabase/routines';
import { RoutineExercisePickerModal } from './RoutineExercisePickerModal';
import { validateRoutineForm } from '@/features/routines/validation';
import { displayExerciseName } from '@/lib/ui/turkish';

type Props = {
  initialRoutine?: RoutineWithExercises;
  catalogExercises: ExerciseWithMuscles[];
};

type EditorExercise = RoutineFormData['exercises'][0] & {
  uiId: string; // unique ID for React keys since we can reorder
  name: string;
};

export function RoutineEditor({ initialRoutine, catalogExercises }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const addExerciseButtonRef = useRef<HTMLButtonElement>(null);
  
  const [name, setName] = useState(initialRoutine?.name || '');
  const [exercises, setExercises] = useState<EditorExercise[]>(() => {
    if (!initialRoutine?.routine_exercises) return [];
    return initialRoutine.routine_exercises.map(re => ({
      uiId: crypto.randomUUID(),
      exercise_id: re.exercise_id,
      position: re.position,
      planned_sets: re.planned_sets,
      target_reps_min: re.target_reps_min ?? undefined,
      target_reps_max: re.target_reps_max ?? undefined,
      name: re.exercises?.name || 'Bilinmeyen hareket',
    }));
  });

  const addedExerciseIds = useMemo(
    () => new Set(exercises.map(e => e.exercise_id)),
    [exercises]
  );

  const validation = useMemo(
    () =>
      validateRoutineForm(
        name,
        exercises.map(ex => ({
          planned_sets: ex.planned_sets,
          target_reps_min: ex.target_reps_min,
          target_reps_max: ex.target_reps_max,
        }))
      ),
    [name, exercises]
  );

  function handleSelectExercise(catalogEx: ExerciseWithMuscles) {
    // Prevent duplicate exercises in the routine
    if (addedExerciseIds.has(catalogEx.id)) return;

    setExercises(prev => [
      ...prev,
      {
        uiId: crypto.randomUUID(),
        exercise_id: catalogEx.id,
        position: prev.length,
        planned_sets: 3, // sensible default
        target_reps_min: undefined,
        target_reps_max: undefined,
        name: displayExerciseName(catalogEx.name),
      }
    ]);
  }

  function handleRemoveExercise(uiId: string) {
    setExercises(prev => {
      const filtered = prev.filter(e => e.uiId !== uiId);
      // Re-assign positions
      return filtered.map((ex, i) => ({ ...ex, position: i }));
    });
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    setExercises(prev => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy.map((ex, i) => ({ ...ex, position: i }));
    });
  }

  function handleMoveDown(index: number) {
    if (index === exercises.length - 1) return;
    setExercises(prev => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy.map((ex, i) => ({ ...ex, position: i }));
    });
  }

  function updateExerciseParam(uiId: string, field: keyof EditorExercise, value: string | number | undefined) {
    setExercises(prev => prev.map(ex => {
      if (ex.uiId === uiId) {
        return { ...ex, [field]: value };
      }
      return ex;
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    if (!validation.isValid) {
      setErrorMsg('Kaydetmeden önce vurgulanan alanları düzeltin.');

      // Scroll/focus to first invalid field
      if (validation.nameError && nameInputRef.current) {
        nameInputRef.current.focus();
        nameInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (validation.exerciseCountError && addExerciseButtonRef.current) {
        addExerciseButtonRef.current.focus();
        addExerciseButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        const firstErrorIndex = validation.exerciseErrors.findIndex(
          err => err.repsError !== null || err.setsError !== null
        );
        if (firstErrorIndex !== -1) {
          const ex = exercises[firstErrorIndex];
          const rowErrors = validation.exerciseErrors[firstErrorIndex];
          if (rowErrors.setsError) {
            const el = document.getElementById(`sets-${ex.uiId}`);
            el?.focus();
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else if (rowErrors.repsError) {
            const el = document.getElementById(`reps-min-${ex.uiId}`) || document.getElementById(`reps-max-${ex.uiId}`);
            el?.focus();
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
      return;
    }

    setErrorMsg(null);

    const formData = new FormData();
    const payload = {
      name: name.trim(),
      exercises: exercises.map(ex => ({
        exercise_id: ex.exercise_id,
        position: ex.position,
        planned_sets: ex.planned_sets,
        target_reps_min: ex.target_reps_min ?? null,
        target_reps_max: ex.target_reps_max ?? null,
      }))
    };
    
    formData.append('routineData', JSON.stringify(payload));

    startTransition(async () => {
      let result;
      if (initialRoutine) {
        result = await updateRoutineAction(initialRoutine.id, null, formData);
      } else {
        result = await createRoutineAction(null, formData);
      }

      if (result.success) {
        router.push('/workout/routines');
      } else {
        setErrorMsg(result.message || 'Doğrulama başarısız oldu');
      }
    });
  }

  async function handleDelete() {
    if (!initialRoutine) return;
    if (!window.confirm(`“${initialRoutine.name}” programını silmek istediğine emin misin?`)) {
      return;
    }

    setIsDeleting(true);
    startTransition(async () => {
      const result = await deleteRoutineAction(initialRoutine.id);
      if (result.success) {
        router.push('/workout/routines');
      } else {
        setErrorMsg(result.message);
        setIsDeleting(false);
      }
    });
  }

  const showNameError = (hasAttemptedSubmit || (name.length > 0 && name.trim() === '')) && validation.nameError;

  return (
    <div className="w-full">
      {errorMsg && (
        <div className="mb-6 p-4 bg-status-danger/10 border border-status-danger/20 text-status-danger rounded-md text-sm">
          {errorMsg}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">
            Program adı
          </label>
          <input
            ref={nameInputRef}
            id="name"
            type="text"
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ör. Tüm Vücut Antrenmanı"
            className={`field-control w-full px-4 text-text-primary ${
              showNameError
                ? 'border-status-danger focus:border-status-danger focus:ring-1 focus:ring-status-danger'
                : 'border-border-strong focus:border-accent focus:ring-1 focus:ring-accent'
            }`}
          />
          {showNameError && (
            <p className="text-xs text-status-danger mt-1.5">{validation.nameError}</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Hareketler</h2>
          </div>

          <div className="space-y-3">
            {exercises.length === 0 ? (
              <div className="py-4 space-y-1">
                <p className="text-sm text-text-muted italic">Henüz hareket eklenmedi.</p>
                {hasAttemptedSubmit && validation.exerciseCountError && (
                  <p className="text-xs text-status-danger">{validation.exerciseCountError}</p>
                )}
              </div>
            ) : (
              exercises.map((ex, index) => {
                const rowErrors = validation.exerciseErrors[index];
                const repsError = rowErrors?.repsError;
                const setsError = rowErrors?.setsError;

                const showSetsError = (hasAttemptedSubmit || ex.planned_sets < 1 || ex.planned_sets > 20) && setsError;
                const showRepsError = (hasAttemptedSubmit || ex.target_reps_min !== undefined || ex.target_reps_max !== undefined) && repsError;

                return (
                  <div key={ex.uiId} className="flex flex-col sm:flex-row sm:items-center gap-4 border-y border-border-subtle py-4">
                    <div className="flex-1 flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <button 
                          type="button" 
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="text-text-muted hover:text-text-primary disabled:opacity-30 p-1"
                          aria-label="Yukarı taşı"
                        >
                          ▲
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleMoveDown(index)}
                          disabled={index === exercises.length - 1}
                          className="text-text-muted hover:text-text-primary disabled:opacity-30 p-1"
                          aria-label="Aşağı taşı"
                        >
                          ▼
                        </button>
                      </div>
                      <span className="font-medium text-text-primary">{ex.name}</span>
                    </div>

                    <div className="flex flex-wrap items-start sm:items-center gap-4 text-sm sm:justify-end">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <label className="text-text-secondary">Set</label>
                          <input
                            id={`sets-${ex.uiId}`}
                            type="number"
                            min={1}
                            max={20}
                            inputMode="numeric"
                            value={ex.planned_sets || ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                              updateExerciseParam(ex.uiId, 'planned_sets', Number.isNaN(val) ? 0 : val);
                            }}
                            className={`field-control w-16 min-h-10 px-2 py-1 text-center font-mono text-text-primary ${
                              showSetsError ? 'border-status-danger focus:border-status-danger' : 'border-border-strong focus:border-accent'
                            }`}
                          />
                        </div>
                        {showSetsError && (
                          <span className="text-xs text-status-danger mt-1">
                            {setsError}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <label className="text-text-secondary">Tekrar</label>
                          <input
                            id={`reps-min-${ex.uiId}`}
                            type="number"
                            min={1}
                            max={100}
                            inputMode="numeric"
                            placeholder="Min."
                            value={ex.target_reps_min ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                              updateExerciseParam(ex.uiId, 'target_reps_min', val !== undefined && Number.isNaN(val) ? undefined : val);
                            }}
                            className={`field-control w-16 min-h-10 px-2 py-1 text-center font-mono text-text-primary ${
                              showRepsError ? 'border-status-danger focus:border-status-danger' : 'border-border-strong focus:border-accent'
                            }`}
                          />
                          <span className="text-text-muted">-</span>
                          <input
                            id={`reps-max-${ex.uiId}`}
                            type="number"
                            min={1}
                            max={100}
                            inputMode="numeric"
                            placeholder="Maks."
                            value={ex.target_reps_max ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                              updateExerciseParam(ex.uiId, 'target_reps_max', val !== undefined && Number.isNaN(val) ? undefined : val);
                            }}
                            className={`field-control w-16 min-h-10 px-2 py-1 text-center font-mono text-text-primary ${
                              showRepsError ? 'border-status-danger focus:border-status-danger' : 'border-border-strong focus:border-accent'
                            }`}
                          />
                        </div>
                        {showRepsError && (
                          <span className="text-xs text-status-danger mt-1">
                            {repsError}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(ex.uiId)}
                        className="text-status-danger hover:text-status-danger p-2 transition-colors ml-auto sm:ml-2 cursor-pointer"
                        title="Hareketi kaldır"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2">
            <button
              ref={addExerciseButtonRef}
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="button-secondary h-11 px-4 inline-flex gap-2 cursor-pointer"
            >
              <span className="text-accent font-semibold text-base leading-none">+</span>
              <span>Hareket Ekle</span>
            </button>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-border-subtle flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
          {initialRoutine ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending || isDeleting}
              className="button-destructive w-full sm:w-auto text-left cursor-pointer disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Siliniyor...' : 'Programı Sil'}
            </button>
          ) : (
            <div /> 
          )}
          
          <button
            type="submit"
            disabled={isPending || isDeleting}
            className="button-primary disabled:bg-surface-high disabled:border-border-subtle disabled:text-text-muted w-full sm:w-auto cursor-pointer disabled:cursor-not-allowed"
          >
            {isPending ? 'Kaydediliyor...' : 'Programı Kaydet'}
          </button>
        </div>
      </form>

      {isPickerOpen && (
        <RoutineExercisePickerModal
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          catalogExercises={catalogExercises}
          addedExerciseIds={addedExerciseIds}
          onSelectExercise={handleSelectExercise}
        />
      )}
    </div>
  );
}
