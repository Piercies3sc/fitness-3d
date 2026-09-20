import { describe, it, expect } from 'vitest';
import {
  normalizeExposure,
  buildReverseMeshMapping,
  getExposureColor,
  EXPOSURE_COLOR_STOPS,
} from './visualization';
import { MuscleTrainingExposure } from './exposure';

describe('Visualization Helpers', () => {
  describe('EXPOSURE_COLOR_STOPS', () => {
    it('defines 5 continuous palette stops with correct hex values', () => {
      expect(EXPOSURE_COLOR_STOPS).toHaveLength(5);
      expect(EXPOSURE_COLOR_STOPS[0]).toEqual({ t: 0.00, hex: '#505054', label: 'Yok' });
      expect(EXPOSURE_COLOR_STOPS[1]).toEqual({ t: 0.25, hex: '#C7A36A', label: 'Düşük' });
      expect(EXPOSURE_COLOR_STOPS[2]).toEqual({ t: 0.50, hex: '#E58A47', label: 'Orta' });
      expect(EXPOSURE_COLOR_STOPS[3]).toEqual({ t: 0.75, hex: '#F15F3B', label: 'Yüksek' });
      expect(EXPOSURE_COLOR_STOPS[4]).toEqual({ t: 1.00, hex: '#FF3B30', label: 'En yüksek' });
    });
  });

  describe('getExposureColor (continuous interpolation)', () => {
    it('returns exact stop color at 0.00 (#505054)', () => {
      expect(getExposureColor(0)).toBe('#505054');
    });

    it('returns exact stop color at 0.25 (#C7A36A)', () => {
      expect(getExposureColor(0.25)).toBe('#C7A36A');
    });

    it('returns exact stop color at 0.50 (#E58A47)', () => {
      expect(getExposureColor(0.50)).toBe('#E58A47');
    });

    it('returns exact stop color at 0.75 (#F15F3B)', () => {
      expect(getExposureColor(0.75)).toBe('#F15F3B');
    });

    it('returns exact stop color at 1.00 (#FF3B30)', () => {
      expect(getExposureColor(1.00)).toBe('#FF3B30');
    });

    it('interpolates 0.40 between 0.25 (#C7A36A) and 0.50 (#E58A47) deterministically', () => {
      const result = getExposureColor(0.40);
      // f = (0.40 - 0.25) / 0.25 = 0.6
      // R: 199 + (229-199)*0.6 = 199 + 18 = 217
      // G: 163 + (138-163)*0.6 = 163 - 15 = 148
      // B: 106 + (71-106)*0.6 = 106 - 21 = 85
      expect(result).toBe('#D99455');
      // Must differ from both the 0.25 and 0.50 stop colors
      expect(result).not.toBe('#C7A36A');
      expect(result).not.toBe('#E58A47');
    });

    it('produces visually distinct colors for 0.40 vs 0.50 vs 0.60', () => {
      const c40 = getExposureColor(0.40);
      const c50 = getExposureColor(0.50);
      const c60 = getExposureColor(0.60);
      expect(c40).not.toBe(c50);
      expect(c50).not.toBe(c60);
      expect(c40).not.toBe(c60);
    });

    it('clamps negative input to 0 (#505054)', () => {
      expect(getExposureColor(-0.5)).toBe('#505054');
      expect(getExposureColor(-100)).toBe('#505054');
    });

    it('clamps input > 1 to 1.00 (#FF3B30)', () => {
      expect(getExposureColor(1.5)).toBe('#FF3B30');
      expect(getExposureColor(100)).toBe('#FF3B30');
    });

    it('handles NaN safely (returns #505054)', () => {
      expect(getExposureColor(NaN)).toBe('#505054');
    });

    it('returns a mid-segment color for 0.125 (midpoint of 0.00–0.25)', () => {
      const result = getExposureColor(0.125);
      // f = 0.5
      // R: 80 + (199-80)*0.5 = 80 + 59.5 = 140
      // G: 80 + (163-80)*0.5 = 80 + 41.5 = 122
      // B: 84 + (106-84)*0.5 = 84 + 11 = 95
      expect(result).toBe('#8C7A5F');
    });
  });

  describe('normalizeExposure', () => {
    it('normalizes exposure correctly relative to max and clamps to [0, 1]', () => {
      const exposures: MuscleTrainingExposure[] = [
        { muscleId: '1', muscleName: 'A', muscleSlug: 'a', exposure: 0 },
        { muscleId: '2', muscleName: 'B', muscleSlug: 'b', exposure: 2 },
        { muscleId: '3', muscleName: 'C', muscleSlug: 'c', exposure: 4 },
      ];

      const result = normalizeExposure(exposures);

      expect(result['a']).toBe(0);
      expect(result['b']).toBe(0.5);
      expect(result['c']).toBe(1);
    });

    it('returns all zeroes if all exposures are zero (all-zero exposure range)', () => {
      const exposures: MuscleTrainingExposure[] = [
        { muscleId: '1', muscleName: 'A', muscleSlug: 'a', exposure: 0 },
        { muscleId: '2', muscleName: 'B', muscleSlug: 'b', exposure: 0 },
      ];

      const result = normalizeExposure(exposures);

      expect(result['a']).toBe(0);
      expect(result['b']).toBe(0);
      expect(getExposureColor(result['a'])).toBe('#505054');
    });

    it('handles empty input', () => {
      expect(normalizeExposure([])).toEqual({});
    });

    it('verifies example (8 / 4 / 3.2) with continuous interpolation', () => {
      const exposures: MuscleTrainingExposure[] = [
        { muscleId: '1', muscleName: 'Pectoralis Major', muscleSlug: 'pectoralis-major', exposure: 8 },
        { muscleId: '2', muscleName: 'Triceps', muscleSlug: 'triceps', exposure: 4 },
        { muscleId: '3', muscleName: 'Anterior Deltoid', muscleSlug: 'anterior-deltoid', exposure: 3.2 },
        { muscleId: '4', muscleName: 'Glutes', muscleSlug: 'glutes', exposure: 0 },
      ];

      const normalized = normalizeExposure(exposures);

      expect(normalized['pectoralis-major']).toBe(1.0);
      expect(normalized['triceps']).toBe(0.5);
      expect(normalized['anterior-deltoid']).toBeCloseTo(0.4, 5);
      expect(normalized['glutes']).toBe(0.0);

      // Pectoralis: exact stop at 1.00 (#FF3B30)
      expect(getExposureColor(normalized['pectoralis-major'])).toBe('#FF3B30');

      // Triceps: exact stop at 0.50 (#E58A47)
      expect(getExposureColor(normalized['triceps'])).toBe('#E58A47');

      // Anterior Deltoid: interpolated at 0.40 (between 0.25 and 0.50)
      const antDeltColor = getExposureColor(normalized['anterior-deltoid']);
      expect(antDeltColor).not.toBe(getExposureColor(0.50)); // Must differ from Triceps!
      expect(antDeltColor).not.toBe('#C7A36A'); // Must differ from Low stop
      expect(antDeltColor).toBe('#D99455');

      // Zero muscles: #505054
      expect(getExposureColor(normalized['glutes'])).toBe('#505054');
    });
  });

  describe('buildReverseMeshMapping', () => {
    it('builds reverse mapping from multiple meshes to one slug', () => {
      const mapping = {
        'quadriceps': ['left rectus femoris', 'right rectus femoris'],
        'hamstrings': ['left semimembranosus']
      };

      const reverse = buildReverseMeshMapping(mapping);

      expect(reverse['left rectus femoris']).toBe('quadriceps');
      expect(reverse['right rectus femoris']).toBe('quadriceps');
      expect(reverse['left semimembranosus']).toBe('hamstrings');
    });

    it('handles unknown/unmapped mesh gracefully when queried', () => {
      const mapping = { 'chest': ['mesh-a'] };
      const reverse = buildReverseMeshMapping(mapping);
      
      expect(reverse['unknown-mesh']).toBeUndefined();
    });
  });
});
