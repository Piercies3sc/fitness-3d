export function validateRoutineName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed === '') {
    return 'Routine name is required.';
  }
  if (trimmed.length > 80) {
    return 'Routine name must be 80 characters or less.';
  }
  return null;
}

export function validateExerciseReps(min?: number | null, max?: number | null): string | null {
  const minVal = min ?? undefined;
  const maxVal = max ?? undefined;

  // If neither is provided, target reps are optional
  if (minVal === undefined && maxVal === undefined) {
    return null;
  }

  // 1. Range bounds check: 1 to 100
  if (
    (minVal !== undefined && (!Number.isFinite(minVal) || minVal < 1 || minVal > 100)) ||
    (maxVal !== undefined && (!Number.isFinite(maxVal) || maxVal < 1 || maxVal > 100))
  ) {
    return 'Reps must be between 1 and 100.';
  }

  // 2. Both must be set if one is provided
  if (minVal === undefined || maxVal === undefined) {
    return 'Both minimum and maximum reps must be set.';
  }

  // 3. Min cannot exceed Max
  if (minVal > maxVal) {
    return 'Minimum reps cannot be greater than maximum reps.';
  }

  return null;
}

export function validateExerciseSets(sets: number): string | null {
  if (!Number.isFinite(sets) || sets < 1 || sets > 20) {
    return 'Sets must be between 1 and 20.';
  }
  return null;
}

export interface RoutineExerciseValidationInput {
  planned_sets: number;
  target_reps_min?: number | null;
  target_reps_max?: number | null;
}

export interface ExerciseRowErrors {
  repsError: string | null;
  setsError: string | null;
}

export interface RoutineFormValidationResult {
  nameError: string | null;
  exerciseCountError: string | null;
  exerciseErrors: ExerciseRowErrors[];
  isValid: boolean;
}

export function validateRoutineForm(
  name: string,
  exercises: RoutineExerciseValidationInput[]
): RoutineFormValidationResult {
  const nameError = validateRoutineName(name);
  const exerciseCountError = exercises.length === 0 ? 'Add at least one exercise.' : null;

  const exerciseErrors: ExerciseRowErrors[] = exercises.map(ex => ({
    repsError: validateExerciseReps(ex.target_reps_min, ex.target_reps_max),
    setsError: validateExerciseSets(ex.planned_sets),
  }));

  const hasExerciseErrors = exerciseErrors.some(
    err => err.repsError !== null || err.setsError !== null
  );

  const isValid = !nameError && !exerciseCountError && !hasExerciseErrors;

  return {
    nameError,
    exerciseCountError,
    exerciseErrors,
    isValid,
  };
}
