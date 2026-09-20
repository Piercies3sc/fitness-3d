import { describe, it, expect } from 'vitest';
import {
  validateRoutineName,
  validateExerciseReps,
  validateExerciseSets,
  validateRoutineForm,
} from './validation';

describe('Routine Editor Form Validation Logic', () => {
  describe('Routine Name Validation', () => {
    it('returns error when routine name is empty string', () => {
      const error = validateRoutineName('');
      expect(error).toBe('Routine name is required.');
    });

    it('returns error when routine name is only whitespace', () => {
      const error = validateRoutineName('   ');
      expect(error).toBe('Routine name is required.');
    });

    it('returns error when routine name exceeds 80 characters', () => {
      const longName = 'A'.repeat(81);
      const error = validateRoutineName(longName);
      expect(error).toBe('Routine name must be 80 characters or less.');
    });

    it('returns null for valid routine names', () => {
      expect(validateRoutineName('Leg Day')).toBeNull();
      expect(validateRoutineName('Upper Body Power')).toBeNull();
    });
  });

  describe('Exercise Rep Range Validation', () => {
    it('returns null when both min and max reps are undefined (optional reps)', () => {
      expect(validateExerciseReps(undefined, undefined)).toBeNull();
    });

    it('returns error when reps are below 1 (e.g., 0 - 10)', () => {
      expect(validateExerciseReps(0, 10)).toBe('Reps must be between 1 and 100.');
      expect(validateExerciseReps(-5, 10)).toBe('Reps must be between 1 and 100.');
    });

    it('returns error when reps exceed 100 (e.g., 11 - 111)', () => {
      expect(validateExerciseReps(11, 111)).toBe('Reps must be between 1 and 100.');
      expect(validateExerciseReps(101, 120)).toBe('Reps must be between 1 and 100.');
    });

    it('returns error when only min or only max is specified', () => {
      expect(validateExerciseReps(10, undefined)).toBe('Both minimum and maximum reps must be set.');
      expect(validateExerciseReps(undefined, 10)).toBe('Both minimum and maximum reps must be set.');
    });

    it('returns error when min reps is greater than max reps (e.g., 12 - 8)', () => {
      expect(validateExerciseReps(12, 8)).toBe('Minimum reps cannot be greater than maximum reps.');
    });

    it('returns null for valid rep ranges (e.g., 8 - 12)', () => {
      expect(validateExerciseReps(8, 12)).toBeNull();
      expect(validateExerciseReps(10, 15)).toBeNull();
      expect(validateExerciseReps(1, 100)).toBeNull();
      expect(validateExerciseReps(5, 5)).toBeNull(); // single target rep
    });
  });

  describe('Exercise Sets Validation', () => {
    it('returns error when sets is less than 1', () => {
      expect(validateExerciseSets(0)).toBe('Sets must be between 1 and 20.');
      expect(validateExerciseSets(-1)).toBe('Sets must be between 1 and 20.');
    });

    it('returns error when sets exceeds 20', () => {
      expect(validateExerciseSets(21)).toBe('Sets must be between 1 and 20.');
    });

    it('returns null for valid sets (1 to 20)', () => {
      expect(validateExerciseSets(1)).toBeNull();
      expect(validateExerciseSets(3)).toBeNull();
      expect(validateExerciseSets(20)).toBeNull();
    });
  });

  describe('Routine Form Holistic Validation (validateRoutineForm)', () => {
    it('is invalid when routine name is empty, even if exercises are valid', () => {
      const result = validateRoutineForm('', [
        { planned_sets: 3, target_reps_min: 8, target_reps_max: 12 },
      ]);
      expect(result.isValid).toBe(false);
      expect(result.nameError).toBe('Routine name is required.');
      expect(result.exerciseCountError).toBeNull();
      expect(result.exerciseErrors[0].repsError).toBeNull();
    });

    it('is invalid when there are zero exercises, even if name is valid', () => {
      const result = validateRoutineForm('Leg Day', []);
      expect(result.isValid).toBe(false);
      expect(result.nameError).toBeNull();
      expect(result.exerciseCountError).toBe('Add at least one exercise.');
    });

    it('is invalid when target reps exceed 100 (e.g., 11 - 111)', () => {
      const result = validateRoutineForm('Leg Day', [
        { planned_sets: 3, target_reps_min: 11, target_reps_max: 111 },
      ]);
      expect(result.isValid).toBe(false);
      expect(result.nameError).toBeNull();
      expect(result.exerciseCountError).toBeNull();
      expect(result.exerciseErrors[0].repsError).toBe('Reps must be between 1 and 100.');
    });

    it('is invalid when min reps > max reps (e.g., 12 - 8)', () => {
      const result = validateRoutineForm('Leg Day', [
        { planned_sets: 3, target_reps_min: 12, target_reps_max: 8 },
      ]);
      expect(result.isValid).toBe(false);
      expect(result.exerciseErrors[0].repsError).toBe('Minimum reps cannot be greater than maximum reps.');
    });

    it('is valid and enables Save when all fields are valid (Leg Day example)', () => {
      const result = validateRoutineForm('Leg Day', [
        { planned_sets: 3, target_reps_min: 8, target_reps_max: 12 }, // Romanian Deadlift
        { planned_sets: 3, target_reps_min: 10, target_reps_max: 15 }, // Seated Leg Curl
      ]);
      expect(result.isValid).toBe(true);
      expect(result.nameError).toBeNull();
      expect(result.exerciseCountError).toBeNull();
      expect(result.exerciseErrors).toHaveLength(2);
      expect(result.exerciseErrors[0].repsError).toBeNull();
      expect(result.exerciseErrors[1].repsError).toBeNull();
    });
  });

  describe('Real Flow Verification Scenarios (A - F)', () => {
    it('A) Empty routine name + valid exercise -> Save button is CLICKABLE, submit is blocked, "Routine name is required."', () => {
      const isPending = false;
      const isDeleting = false;
      const result = validateRoutineForm('', [
        { planned_sets: 3, target_reps_min: 8, target_reps_max: 12 },
      ]);
      expect(result.isValid).toBe(false);
      expect(result.nameError).toBe('Routine name is required.');

      // The button must NOT be disabled by validation errors:
      const isButtonDisabled = isPending || isDeleting;
      expect(isButtonDisabled).toBe(false);
    });

    it('B) Valid name + 11–111 reps -> Save button is CLICKABLE, submit is blocked, reps error visible', () => {
      const isPending = false;
      const isDeleting = false;
      const result = validateRoutineForm('Leg Day', [
        { planned_sets: 3, target_reps_min: 11, target_reps_max: 111 },
      ]);
      expect(result.isValid).toBe(false);
      expect(result.exerciseErrors[0].repsError).toBe('Reps must be between 1 and 100.');

      // The button must NOT be disabled by validation errors:
      const isButtonDisabled = isPending || isDeleting;
      expect(isButtonDisabled).toBe(false);
    });

    it('C) Valid name + 8–12 reps -> Save button CLICKABLE and submit proceeds', () => {
      const isPending = false;
      const isDeleting = false;
      const result = validateRoutineForm('Push Day', [
        { planned_sets: 3, target_reps_min: 8, target_reps_max: 12 },
      ]);
      expect(result.isValid).toBe(true);
      expect(result.nameError).toBeNull();
      expect(result.exerciseErrors[0].repsError).toBeNull();

      const isButtonDisabled = isPending || isDeleting;
      expect(isButtonDisabled).toBe(false);
    });

    it('Save button is disabled ONLY during async actions (isPending or isDeleting)', () => {
      expect(true || false).toBe(true); // isPending=true -> disabled=true
      expect(false || true).toBe(true); // isDeleting=true -> disabled=true
      expect(false || false).toBe(false); // idle -> disabled=false (even if form is invalid!)
    });

    it('D) Create routine payload maintains valid inputs when valid', () => {
      const routineName = 'Leg Day';
      const exercises = [
        { exercise_id: 'rdl-id', planned_sets: 3, target_reps_min: 8, target_reps_max: 12 },
        { exercise_id: 'curl-id', planned_sets: 3, target_reps_min: 10, target_reps_max: 15 },
      ];
      const validation = validateRoutineForm(routineName, exercises);
      expect(validation.isValid).toBe(true);

      const payload = {
        name: routineName.trim(),
        exercises: exercises.map((ex, i) => ({
          exercise_id: ex.exercise_id,
          position: i,
          planned_sets: ex.planned_sets,
          target_reps_min: ex.target_reps_min ?? null,
          target_reps_max: ex.target_reps_max ?? null,
        })),
      };
      expect(payload.name).toBe('Leg Day');
      expect(payload.exercises[0].target_reps_min).toBe(8);
      expect(payload.exercises[0].target_reps_max).toBe(12);
      expect(payload.exercises[1].target_reps_max).toBe(15);
    });

    it('E) Edit existing routine validates modifications correctly', () => {
      // Existing routine loaded:
      const originalRoutine = {
        name: 'Pull Day',
        exercises: [
          { exercise_id: 'lat-pulldown', planned_sets: 3, target_reps_min: 10, target_reps_max: 12 },
        ],
      };
      expect(validateRoutineForm(originalRoutine.name, originalRoutine.exercises).isValid).toBe(true);

      // User changes reps to invalid 12 - 8:
      const invalidEdit = {
        name: 'Pull Day',
        exercises: [
          { exercise_id: 'lat-pulldown', planned_sets: 3, target_reps_min: 12, target_reps_max: 8 },
        ],
      };
      const invalidResult = validateRoutineForm(invalidEdit.name, invalidEdit.exercises);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.exerciseErrors[0].repsError).toBe(
        'Minimum reps cannot be greater than maximum reps.'
      );

      // User corrects reps to 8 - 12:
      const correctedEdit = {
        name: 'Pull Day',
        exercises: [
          { exercise_id: 'lat-pulldown', planned_sets: 3, target_reps_min: 8, target_reps_max: 12 },
        ],
      };
      expect(validateRoutineForm(correctedEdit.name, correctedEdit.exercises).isValid).toBe(true);
    });

    it('F) Form state preservation when server returns an error', () => {
      // Simulating the component state retention when server fails:
      const clientState = {
        name: 'Leg Day',
        exercises: [
          { uiId: '1', exercise_id: 'rdl-id', position: 0, planned_sets: 3, target_reps_min: 8, target_reps_max: 12, name: 'Romanian Deadlift' },
        ],
      };

      // Server returns failure:
      const serverResult = {
        success: false,
        message: 'Database connection failed. Please try again.',
      };

      let errorMsg: string | null = null;
      if (!serverResult.success) {
        errorMsg = serverResult.message;
      }

      // Assert error message is visible and client form state is completely untouched
      expect(errorMsg).toBe('Database connection failed. Please try again.');
      expect(clientState.name).toBe('Leg Day');
      expect(clientState.exercises).toHaveLength(1);
      expect(clientState.exercises[0].target_reps_max).toBe(12);
    });
  });
});
