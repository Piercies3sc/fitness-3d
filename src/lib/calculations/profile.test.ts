import { describe, it, expect } from 'vitest';
import {
  getMondayOfWeek,
  calculateWeeklyWorkoutsCount,
  calculateTotalWorkingSets,
  extractRecentPRs,
  getTopTrainedMuscles,
  validateDisplayName,
  validateUnitPreference,
  validateAvatarFile,
} from './profile';
import { PRWorkoutInput, WorkoutPRResult } from './prs';
import { MuscleTrainingExposure } from './exposure';

describe('Profile Domain Calculations & Validation', () => {
  describe('validateDisplayName', () => {
    it('handles null and undefined by returning null', () => {
      expect(validateDisplayName(null)).toEqual({ isValid: true, value: null });
      expect(validateDisplayName(undefined)).toEqual({ isValid: true, value: null });
    });

    it('trims whitespace and treats whitespace-only as null', () => {
      expect(validateDisplayName('   ')).toEqual({ isValid: true, value: null });
      expect(validateDisplayName('  John Doe  ')).toEqual({ isValid: true, value: 'John Doe' });
    });

    it('validates length constraint (max 50 characters)', () => {
      const valid50 = 'A'.repeat(50);
      expect(validateDisplayName(valid50)).toEqual({ isValid: true, value: valid50 });

      const invalid51 = 'A'.repeat(51);
      const res = validateDisplayName(invalid51);
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('Display name must be 50 characters or less.');
    });
  });

  describe('validateUnitPreference', () => {
    it('accepts kg and lb', () => {
      expect(validateUnitPreference('kg')).toEqual({ isValid: true, value: 'kg' });
      expect(validateUnitPreference('lb')).toEqual({ isValid: true, value: 'lb' });
    });

    it('rejects invalid or null values', () => {
      expect(validateUnitPreference(null)).toEqual({
        isValid: false,
        value: 'kg',
        error: "Unit preference must be 'kg' or 'lb'.",
      });
      expect(validateUnitPreference('stone')).toEqual({
        isValid: false,
        value: 'kg',
        error: "Unit preference must be 'kg' or 'lb'.",
      });
    });
  });

  describe('getMondayOfWeek', () => {
    it('returns Monday 00:00:00 for Monday', () => {
      // 2026-09-14 is a Monday
      const monday = new Date(2026, 8, 14, 15, 30, 0);
      const result = getMondayOfWeek(monday);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(8);
      expect(result.getDate()).toBe(14);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });

    it('returns preceding Monday 00:00:00 for Wednesday', () => {
      // 2026-09-16 is a Wednesday
      const wednesday = new Date(2026, 8, 16, 12, 0, 0);
      const result = getMondayOfWeek(wednesday);
      expect(result.getDate()).toBe(14);
      expect(result.getHours()).toBe(0);
    });

    it('returns preceding Monday 00:00:00 for Sunday', () => {
      // 2026-09-20 is a Sunday
      const sunday = new Date(2026, 8, 20, 23, 59, 59);
      const result = getMondayOfWeek(sunday);
      expect(result.getDate()).toBe(14);
      expect(result.getHours()).toBe(0);
    });
  });

  describe('calculateWeeklyWorkoutsCount', () => {
    const monday = new Date('2026-09-14T00:00:00.000Z');

    it('counts completed workouts on or after Monday', () => {
      const workouts = [
        { completed_at: new Date(monday.getTime() - 1000).toISOString() }, // 1 sec before Monday -> excluded
        { completed_at: new Date(monday.getTime() + 1000).toISOString() }, // 1 sec after Monday -> included
        { completed_at: new Date(monday.getTime() + 86400000).toISOString() }, // Tuesday -> included
      ];
      expect(calculateWeeklyWorkoutsCount(workouts, monday)).toBe(2);
    });

    it('handles empty workouts list', () => {
      expect(calculateWeeklyWorkoutsCount([], monday)).toBe(0);
    });
  });

  describe('calculateTotalWorkingSets', () => {
    it('sums only working sets, strictly ignoring warmup sets', () => {
      const workouts = [
        {
          workout_exercises: [
            {
              workout_sets: [
                { set_type: 'warmup' },
                { set_type: 'working' },
                { set_type: 'working' },
              ],
            },
          ],
        },
        {
          workout_exercises: [
            {
              workout_sets: [
                { set_type: 'warmup' },
                { set_type: 'warmup' },
                { set_type: 'working' },
              ],
            },
          ],
        },
      ];
      expect(calculateTotalWorkingSets(workouts)).toBe(3);
    });

    it('returns 0 for empty or new user', () => {
      expect(calculateTotalWorkingSets([])).toBe(0);
    });
  });

  describe('getTopTrainedMuscles', () => {
    it('returns top 5 non-zero muscles descending by exposure', () => {
      const exposures: MuscleTrainingExposure[] = [
        { muscleId: '1', muscleSlug: 'pecs', muscleName: 'Pectoralis Major', exposure: 8.5 },
        { muscleId: '2', muscleSlug: 'triceps', muscleName: 'Triceps', exposure: 4.2 },
        { muscleId: '3', muscleSlug: 'lats', muscleName: 'Latissimus Dorsi', exposure: 6.0 },
        { muscleId: '4', muscleSlug: 'quads', muscleName: 'Quadriceps', exposure: 0 },
        { muscleId: '5', muscleSlug: 'delts', muscleName: 'Anterior Deltoid', exposure: 3.1 },
        { muscleId: '6', muscleSlug: 'glutes', muscleName: 'Glutes', exposure: 1.5 },
        { muscleId: '7', muscleSlug: 'calves', muscleName: 'Calves', exposure: 0.5 },
      ];

      const top5 = getTopTrainedMuscles(exposures, 5);
      expect(top5).toHaveLength(5);
      expect(top5.map((m) => m.muscleSlug)).toEqual(['pecs', 'lats', 'triceps', 'delts', 'glutes']);
    });

    it('excludes all muscles if exposure is 0', () => {
      const exposures: MuscleTrainingExposure[] = [
        { muscleId: '1', muscleSlug: 'pecs', muscleName: 'Pectoralis Major', exposure: 0 },
        { muscleId: '2', muscleSlug: 'triceps', muscleName: 'Triceps', exposure: 0 },
      ];
      expect(getTopTrainedMuscles(exposures)).toHaveLength(0);
    });
  });

  describe('extractRecentPRs', () => {
    it('extracts PR events formatted correctly with kg/lb unit conversion', () => {
      const allWorkouts: PRWorkoutInput[] = [
        {
          id: 'w-1',
          started_at: '2026-09-10T10:00:00Z',
          completed_at: '2026-09-10T11:00:00Z',
          workout_exercises: [],
        },
        {
          id: 'w-2',
          started_at: '2026-09-15T10:00:00Z',
          completed_at: '2026-09-15T11:00:00Z',
          workout_exercises: [],
        },
      ];

      const prsByWorkout = new Map<string, WorkoutPRResult>();
      prsByWorkout.set('w-2', {
        'ex-bench': {
          weightPR: 100,
          estimated1RMPR: 120,
        },
        'ex-pushup': {
          repPRs: [{ load: 0, reps: 30 }],
        },
      });

      const exerciseNameMap = new Map<string, string>([
        ['ex-bench', 'Barbell Bench Press'],
        ['ex-pushup', 'Push-Up'],
      ]);

      // With kg
      const prsKg = extractRecentPRs(allWorkouts, prsByWorkout, exerciseNameMap, 'kg', 5);
      expect(prsKg).toHaveLength(3);
      expect(prsKg[0].typeLabel).toBe('Weight PR');
      expect(prsKg[0].detail).toBe('100 kg');
      expect(prsKg[1].typeLabel).toBe('Estimated 1RM PR');
      expect(prsKg[1].detail).toBe('120 kg');
      expect(prsKg[2].typeLabel).toBe('Rep PR');
      expect(prsKg[2].detail).toBe('30 reps · 0 kg');

      // With lb
      const prsLb = extractRecentPRs(allWorkouts, prsByWorkout, exerciseNameMap, 'lb', 5);
      expect(prsLb[0].detail).toBe('220.46 lb');
      expect(prsLb[1].detail).toBe('264.6 lb');
    });

    it('returns empty array when no PRs exist', () => {
      expect(extractRecentPRs([], new Map(), new Map(), 'kg', 5)).toHaveLength(0);
    });
  });

  describe('validateAvatarFile', () => {
    it('rejects null or undefined file', () => {
      expect(validateAvatarFile(null)).toEqual({
        isValid: false,
        error: 'Fotoğraf dosyası seçilmedi.',
      });
      expect(validateAvatarFile(undefined)).toEqual({
        isValid: false,
        error: 'Fotoğraf dosyası seçilmedi.',
      });
    });

    it('rejects unsupported mime types', () => {
      expect(validateAvatarFile({ size: 1024, type: 'image/gif' })).toEqual({
        isValid: false,
        error: 'Yalnızca JPEG, PNG veya WebP formatları desteklenir.',
      });
      expect(validateAvatarFile({ size: 1024, type: 'application/pdf' })).toEqual({
        isValid: false,
        error: 'Yalnızca JPEG, PNG veya WebP formatları desteklenir.',
      });
    });

    it('rejects files larger than 2 MB', () => {
      const over2MB = 2 * 1024 * 1024 + 1;
      expect(validateAvatarFile({ size: over2MB, type: 'image/jpeg' })).toEqual({
        isValid: false,
        error: 'Fotoğraf boyutu 2 MB\'tan küçük olmalıdır.',
      });
    });

    it('accepts valid JPEG, PNG, and WebP files <= 2 MB', () => {
      expect(validateAvatarFile({ size: 1024 * 100, type: 'image/jpeg' })).toEqual({
        isValid: true,
      });
      expect(validateAvatarFile({ size: 1024 * 100, type: 'image/png' })).toEqual({
        isValid: true,
      });
      expect(validateAvatarFile({ size: 2 * 1024 * 1024, type: 'image/webp' })).toEqual({
        isValid: true,
      });
    });
  });
});
