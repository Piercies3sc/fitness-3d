import { describe, it, expect } from 'vitest';
import { calculateSetVolume, calculateWorkoutVolume, calculateEstimated1RM, getBestEstimated1RM } from './workout';

describe('Workout Calculations', () => {
  describe('calculateSetVolume', () => {
    it('calculates volume for working sets', () => {
      expect(calculateSetVolume(100, 10, 'working')).toBe(1000);
      expect(calculateSetVolume(60, 5, 'working')).toBe(300);
    });

    it('returns 0 for warmup sets', () => {
      expect(calculateSetVolume(100, 10, 'warmup')).toBe(0);
    });

    it('returns 0 for invalid inputs', () => {
      expect(calculateSetVolume(-10, 10, 'working')).toBe(0);
      expect(calculateSetVolume(100, 0, 'working')).toBe(0);
    });
  });

  describe('calculateWorkoutVolume', () => {
    it('sums volume only for working sets across all exercises', () => {
      const exercises = [
        {
          workout_sets: [
            { weight_kg: 20, reps: 10, set_type: 'warmup' as const },
            { weight_kg: 60, reps: 10, set_type: 'working' as const },
            { weight_kg: 60, reps: 9, set_type: 'working' as const },
            { weight_kg: 60, reps: 8, set_type: 'working' as const },
          ]
        },
        {
          workout_sets: [
            { weight_kg: 100, reps: 5, set_type: 'working' as const },
          ]
        },
        {} // no workout sets
      ];

      // 60*10 + 60*9 + 60*8 + 100*5 = 600 + 540 + 480 + 500 = 2120
      expect(calculateWorkoutVolume(exercises)).toBe(2120);
    });
  });

  describe('calculateEstimated1RM', () => {
    it('calculates Estimated 1RM using Epley for valid reps (1-12)', () => {
      expect(calculateEstimated1RM(100, 10, 'working')).toBeCloseTo(133.33, 2);
      expect(calculateEstimated1RM(100, 1, 'working')).toBeCloseTo(103.33, 2);
      expect(calculateEstimated1RM(100, 12, 'working')).toBeCloseTo(140.00, 2);
    });

    it('returns null for reps > 12', () => {
      expect(calculateEstimated1RM(100, 13, 'working')).toBeNull();
    });

    it('returns null for reps < 1', () => {
      expect(calculateEstimated1RM(100, 0, 'working')).toBeNull();
    });

    it('returns null for warmup sets', () => {
      expect(calculateEstimated1RM(100, 10, 'warmup')).toBeNull();
    });
  });

  describe('getBestEstimated1RM', () => {
    it('finds the highest valid Estimated 1RM', () => {
      const sets = [
        { weight_kg: 20, reps: 10, set_type: 'warmup' as const },
        { weight_kg: 60, reps: 10, set_type: 'working' as const }, // E1RM: 60 * 1.333 = 80
        { weight_kg: 65, reps: 6, set_type: 'working' as const },  // E1RM: 65 * 1.2 = 78
        { weight_kg: 100, reps: 15, set_type: 'working' as const }, // Invalid (>12 reps)
      ];

      expect(getBestEstimated1RM(sets)).toBeCloseTo(80, 2);
    });

    it('returns null if no valid working sets exist', () => {
      const sets = [
        { weight_kg: 20, reps: 10, set_type: 'warmup' as const },
        { weight_kg: 100, reps: 15, set_type: 'working' as const },
      ];

      expect(getBestEstimated1RM(sets)).toBeNull();
    });
  });
});
