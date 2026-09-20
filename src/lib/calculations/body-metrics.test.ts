import { describe, it, expect } from 'vitest';
import {
  calculateBMI,
  formatBMI,
  calculateAge,
  calculateEstimatedBMR,
  formatEstimatedBMR,
  getBMRMissingFields,
  getBMRMissingMessage,
  getLatestWeight,
  groupWeightEntriesByDay,
  filterWeightEntriesByRange,
  calculateWeightChange,
  getWeightChartData,
  validateHeight,
  validateDateOfBirth,
  validateBMRSex,
  validateWeightInput,
  WeightEntryItem,
} from './body-metrics';

describe('Body Metrics Calculations', () => {
  describe('calculateBMI', () => {
    it('calculates BMI for 80 kg and 180 cm (expected ~24.69)', () => {
      const bmi = calculateBMI(80, 180);
      expect(bmi).not.toBeNull();
      expect(bmi).toBeCloseTo(24.691358, 4);
      expect(formatBMI(bmi)).toBe('24.7');
    });

    it('recalculates BMI when latest weight changes', () => {
      const height = 180;
      const initialBMI = calculateBMI(80, height);
      expect(initialBMI).toBeCloseTo(24.69, 2);

      // Weight changes to 75 kg
      const updatedBMI = calculateBMI(75, height);
      expect(updatedBMI).toBeCloseTo(23.15, 2);
      expect(updatedBMI).toBeLessThan(initialBMI!);
    });

    it('returns null if weight or height is missing, zero, or negative', () => {
      expect(calculateBMI(null, 180)).toBeNull();
      expect(calculateBMI(80, null)).toBeNull();
      expect(calculateBMI(undefined, 180)).toBeNull();
      expect(calculateBMI(0, 180)).toBeNull();
      expect(calculateBMI(80, 0)).toBeNull();
      expect(calculateBMI(-70, 175)).toBeNull();
      expect(calculateBMI(70, -175)).toBeNull();
    });

    it('formatBMI formats null and undefined as em dash', () => {
      expect(formatBMI(null)).toBe('—');
      expect(formatBMI(undefined)).toBe('—');
    });
  });

  describe('calculateAge', () => {
    it('calculates age correctly when birthday has already occurred this year', () => {
      const refDate = new Date(2026, 8, 19); // Sep 19, 2026
      // Born Sep 10, 2000 -> 26 years old
      const age = calculateAge('2000-09-10', refDate);
      expect(age).toBe(26);
    });

    it('calculates age correctly when birthday is today', () => {
      const refDate = new Date(2026, 8, 19); // Sep 19, 2026
      // Born Sep 19, 2000 -> 26 years old
      const age = calculateAge('2000-09-19', refDate);
      expect(age).toBe(26);
    });

    it('calculates age correctly when birthday has not yet occurred this year', () => {
      const refDate = new Date(2026, 8, 19); // Sep 19, 2026
      // Born Sep 25, 2000 -> 25 years old
      const age = calculateAge('2000-09-25', refDate);
      expect(age).toBe(25);
    });

    it('returns null for future dates or invalid strings', () => {
      const refDate = new Date(2026, 8, 19);
      expect(calculateAge('2027-01-01', refDate)).toBeNull();
      expect(calculateAge('invalid-date', refDate)).toBeNull();
      expect(calculateAge(null, refDate)).toBeNull();
    });
  });

  describe('calculateEstimatedBMR (Mifflin–St Jeor)', () => {
    it('calculates male BMR correctly: 10*W + 6.25*H - 5*A + 5', () => {
      // 80 kg, 180 cm, 30 years old, male
      // 10*80 (800) + 6.25*180 (1125) - 5*30 (150) + 5 = 800 + 1125 - 150 + 5 = 1780
      const bmr = calculateEstimatedBMR(80, 180, 30, 'male');
      expect(bmr).toBe(1780);
      expect(formatEstimatedBMR(bmr)).toBe('1,780 kcal/day');
    });

    it('calculates female BMR correctly: 10*W + 6.25*H - 5*A - 161', () => {
      // 60 kg, 165 cm, 28 years old, female
      // 10*60 (600) + 6.25*165 (1031.25) - 5*28 (140) - 161 = 600 + 1031.25 - 140 - 161 = 1330.25
      const bmr = calculateEstimatedBMR(60, 165, 28, 'female');
      expect(bmr).toBeCloseTo(1330.25, 2);
      expect(formatEstimatedBMR(bmr)).toBe('1,330 kcal/day');
    });

    it('recalculates Estimated BMR when latest weight changes', () => {
      const height = 180;
      const age = 30;
      const sex = 'male';

      const initialBMR = calculateEstimatedBMR(80, height, age, sex);
      expect(initialBMR).toBe(1780);

      // Latest weight drops to 75 kg
      const updatedBMR = calculateEstimatedBMR(75, height, age, sex);
      // 10*75 + 1125 - 150 + 5 = 750 + 1125 - 150 + 5 = 1730
      expect(updatedBMR).toBe(1730);
    });

    it('returns null when any required field is missing', () => {
      expect(calculateEstimatedBMR(null, 180, 30, 'male')).toBeNull();
      expect(calculateEstimatedBMR(80, null, 30, 'male')).toBeNull();
      expect(calculateEstimatedBMR(80, 180, null, 'male')).toBeNull();
      expect(calculateEstimatedBMR(80, 180, 30, null)).toBeNull();
      expect(calculateEstimatedBMR(80, 180, 30, undefined)).toBeNull();
      expect(calculateEstimatedBMR(80, 180, 30, 'other')).toBeNull();
    });

    it('formatEstimatedBMR formats null as em dash', () => {
      expect(formatEstimatedBMR(null)).toBe('—');
    });
  });

  describe('BMR Missing Fields Helper', () => {
    it('identifies missing fields correctly', () => {
      expect(getBMRMissingFields(null, 180, 30, 'male')).toEqual(['weight']);
      expect(getBMRMissingFields(80, null, 30, 'male')).toEqual(['height']);
      expect(getBMRMissingFields(80, 180, null, 'male')).toEqual(['date of birth']);
      expect(getBMRMissingFields(80, 180, 30, null)).toEqual(['BMR sex']);
      expect(getBMRMissingFields(80, 180, null, null)).toEqual(['date of birth', 'BMR sex']);
      expect(getBMRMissingFields(null, null, null, null)).toEqual([
        'weight',
        'height',
        'date of birth',
        'BMR sex',
      ]);
      expect(getBMRMissingFields(80, 180, 30, 'male')).toEqual([]);
    });

    it('generates concise helper text explaining what is missing', () => {
      expect(getBMRMissingMessage([])).toBeNull();
      expect(getBMRMissingMessage(['date of birth'])).toBe(
        'Add date of birth to calculate.'
      );
      expect(getBMRMissingMessage(['date of birth', 'BMR sex'])).toBe(
        'Add date of birth and BMR sex to calculate.'
      );
      expect(
        getBMRMissingMessage(['weight', 'height', 'date of birth', 'BMR sex'])
      ).toBe('Add weight, height, date of birth, and BMR sex to calculate.');
    });
  });

  describe('getLatestWeight', () => {
    it('determines current weight strictly by latest recorded_at timestamp', () => {
      // Insertion order scrambled, weight values not monotonic
      const entries = [
        { weight_kg: 85.0, recorded_at: '2026-09-15T10:00:00Z' },
        { weight_kg: 92.0, recorded_at: '2026-09-18T10:00:00Z' },
        { weight_kg: 78.4, recorded_at: '2026-09-19T14:00:00Z' }, // latest timestamp
        { weight_kg: 88.0, recorded_at: '2026-09-17T10:00:00Z' },
      ];

      expect(getLatestWeight(entries)).toBe(78.4);
    });

    it('falls back to previous latest when latest entry is deleted', () => {
      const entries = [
        { weight_kg: 85.0, recorded_at: '2026-09-15T10:00:00Z' },
        { weight_kg: 92.0, recorded_at: '2026-09-18T10:00:00Z' },
        { weight_kg: 78.4, recorded_at: '2026-09-19T14:00:00Z' },
      ];

      expect(getLatestWeight(entries)).toBe(78.4);

      // Simulate deletion of the Sep 19 entry
      const remaining = entries.filter((e) => e.weight_kg !== 78.4);
      expect(getLatestWeight(remaining)).toBe(92.0);
    });

    it('returns null for empty entries', () => {
      expect(getLatestWeight([])).toBeNull();
    });
  });

  describe('Same-Day Weight Entries & groupWeightEntriesByDay', () => {
    it('groups multiple entries on the same day and selects the LATEST recorded entry', () => {
      // User logs 3 times on Sep 19
      const rawEntries: WeightEntryItem[] = [
        { id: '1', weight_kg: 95.0, recorded_at: '2026-09-19T09:00:00Z' },
        { id: '2', weight_kg: 100.0, recorded_at: '2026-09-19T14:00:00Z' },
        { id: '3', weight_kg: 150.0, recorded_at: '2026-09-19T20:00:00Z' },
      ];

      const daily = groupWeightEntriesByDay(rawEntries);

      // Distinct daily point count should be 1
      expect(daily.length).toBe(1);
      // Daily point should pick the latest recorded entry for that day (150 kg)
      expect(daily[0].weight_kg).toBe(150.0);
      expect(daily[0].rawEntryId).toBe('3');

      // Raw entries remain 3 separate items (database/recent entries preservation)
      expect(rawEntries.length).toBe(3);
    });

    it('preserves distinct calendar days in chronological order', () => {
      const rawEntries: WeightEntryItem[] = [
        { id: '1', weight_kg: 80.0, recorded_at: '2026-09-17T08:00:00Z' },
        { id: '2', weight_kg: 80.5, recorded_at: '2026-09-18T08:00:00Z' },
        { id: '3', weight_kg: 81.0, recorded_at: '2026-09-19T08:00:00Z' },
        { id: '4', weight_kg: 79.5, recorded_at: '2026-09-19T18:00:00Z' }, // latest for Sep 19
      ];

      const daily = groupWeightEntriesByDay(rawEntries);

      expect(daily.length).toBe(3);
      expect(daily[0].weight_kg).toBe(80.0);
      expect(daily[1].weight_kg).toBe(80.5);
      expect(daily[2].weight_kg).toBe(79.5);
    });
  });

  describe('filterWeightEntriesByRange', () => {
    const refDate = new Date('2026-09-19T12:00:00Z');
    const sampleEntries: WeightEntryItem[] = [
      { id: '1', weight_kg: 82.0, recorded_at: '2025-08-01T10:00:00Z' }, // > 1 year ago
      { id: '2', weight_kg: 81.0, recorded_at: '2025-10-01T10:00:00Z' }, // ~11 months ago (in 1Y)
      { id: '3', weight_kg: 80.0, recorded_at: '2026-05-01T10:00:00Z' }, // ~4.5 months ago (in 6M, 1Y)
      { id: '4', weight_kg: 79.0, recorded_at: '2026-07-15T10:00:00Z' }, // ~2 months ago (in 3M, 6M, 1Y)
      { id: '5', weight_kg: 78.4, recorded_at: '2026-09-10T10:00:00Z' }, // ~9 days ago (in all ranges)
    ];

    it('filters correctly for 30d', () => {
      const res = filterWeightEntriesByRange(sampleEntries, '30d', refDate);
      expect(res.map((r) => r.id)).toEqual(['5']);
    });

    it('filters correctly for 3m', () => {
      const res = filterWeightEntriesByRange(sampleEntries, '3m', refDate);
      expect(res.map((r) => r.id)).toEqual(['4', '5']);
    });

    it('filters correctly for 6m', () => {
      const res = filterWeightEntriesByRange(sampleEntries, '6m', refDate);
      expect(res.map((r) => r.id)).toEqual(['3', '4', '5']);
    });

    it('filters correctly for 1y', () => {
      const res = filterWeightEntriesByRange(sampleEntries, '1y', refDate);
      expect(res.map((r) => r.id)).toEqual(['2', '3', '4', '5']);
    });
  });

  describe('adaptive weight chart data', () => {
    it('does not create a chart for zero or one raw entry', () => {
      expect(getWeightChartData([])).toBeNull();
      expect(
        getWeightChartData([
          { id: '1', weight_kg: 80, recorded_at: '2026-09-19T09:00:00Z' },
        ])
      ).toBeNull();
    });

    it('uses intraday mode for two same-day entries and sorts by recorded_at', () => {
      const chart = getWeightChartData([
        { id: 'late', weight_kg: 78, recorded_at: '2026-09-19T20:05:00Z' },
        { id: 'early', weight_kg: 80, recorded_at: '2026-09-19T16:21:00Z' },
      ]);

      expect(chart?.mode).toBe('intraday');
      expect(chart?.points.map((point) => point.id)).toEqual(['early', 'late']);
    });

    it('preserves all five raw same-day entries in intraday mode', () => {
      const entries: WeightEntryItem[] = [
        { id: '1', weight_kg: 80, recorded_at: '2026-09-19T08:00:00Z' },
        { id: '2', weight_kg: 79, recorded_at: '2026-09-19T10:00:00Z' },
        { id: '3', weight_kg: 78, recorded_at: '2026-09-19T12:00:00Z' },
        { id: '4', weight_kg: 77, recorded_at: '2026-09-19T14:00:00Z' },
        { id: '5', weight_kg: 76, recorded_at: '2026-09-19T16:00:00Z' },
      ];

      const chart = getWeightChartData(entries);
      expect(chart?.mode).toBe('intraday');
      expect(chart?.points).toHaveLength(5);
    });

    it('uses daily mode across dates and keeps each day\'s latest entry', () => {
      const chart = getWeightChartData([
        { id: 'day-two', weight_kg: 79, recorded_at: '2026-09-20T09:00:00Z' },
        { id: 'day-one-late', weight_kg: 80, recorded_at: '2026-09-19T20:00:00Z' },
        { id: 'day-one-early', weight_kg: 81, recorded_at: '2026-09-19T08:00:00Z' },
      ]);

      expect(chart?.mode).toBe('daily');
      expect(chart?.points.map((point) => point.id)).toEqual(['day-one-late', 'day-two']);
      expect(chart?.points.map((point) => point.weight_kg)).toEqual([80, 79]);
    });
  });

  describe('calculateWeightChange', () => {
    it('returns "More entries needed for a trend." when fewer than two points exist', () => {
      // 0 entries
      const zeroRes = calculateWeightChange([], '3m', 'kg');
      expect(zeroRes.hasTrend).toBe(false);
      expect(zeroRes.formatted).toBe('More entries needed for a trend.');

      // 1 entry
      const singleRes = calculateWeightChange(
        [
          {
            weight_kg: 80,
            recorded_at: '2026-09-19T00:00:00Z',
          },
        ],
        '3m',
        'kg'
      );
      expect(singleRes.hasTrend).toBe(false);
      expect(singleRes.formatted).toBe('More entries needed for a trend.');
    });

    it('calculates intraday change from earliest to latest raw timestamp', () => {
      const rawEntries: WeightEntryItem[] = [
        { id: 'late', weight_kg: 78.0, recorded_at: '2026-09-19T20:00:00Z' },
        { id: 'early', weight_kg: 80.0, recorded_at: '2026-09-19T09:00:00Z' },
      ];

      const result = calculateWeightChange(rawEntries, '30d', 'kg', 'today');

      expect(result.hasTrend).toBe(true);
      expect(result.changeValue).toBe(-2);
      expect(result.formatted).toBe('−2.0 kg today');
    });

    it('compares earliest DAILY chart value vs latest DAILY chart value (not insertion order)', () => {
      // Earliest day: 100 kg, Latest day: 95 kg -> −5.0 kg
      const dailyPoints = [
        {
          dateKey: '2026-09-15',
          weight_kg: 98.0,
          recorded_at: '2026-09-15T10:00:00Z',
          rawEntryId: '2',
        },
        {
          dateKey: '2026-09-01',
          weight_kg: 100.0,
          recorded_at: '2026-09-01T10:00:00Z', // earliest daily
          rawEntryId: '1',
        },
        {
          dateKey: '2026-09-19',
          weight_kg: 95.0,
          recorded_at: '2026-09-19T10:00:00Z', // latest daily
          rawEntryId: '3',
        },
      ];

      const result = calculateWeightChange(dailyPoints, '30d', 'kg');
      expect(result.hasTrend).toBe(true);
      expect(result.changeValue).toBe(-5.0);
      expect(result.formatted).toBe('−5.0 kg in 30D');
    });

    it('calculates positive weight change in lb: latest - earliest', () => {
      // 80 kg = 176.37 lb, 81.2 kg = 179.02 lb -> +2.65 lb
      const dailyPoints = [
        {
          dateKey: '2026-08-19',
          weight_kg: 80.0,
          recorded_at: '2026-08-19T10:00:00Z',
          rawEntryId: '1',
        },
        {
          dateKey: '2026-09-19',
          weight_kg: 81.2,
          recorded_at: '2026-09-19T10:00:00Z',
          rawEntryId: '2',
        },
      ];
      const result = calculateWeightChange(dailyPoints, '30d', 'lb');
      expect(result.hasTrend).toBe(true);
      expect(result.changeValue).toBeGreaterThan(0);
      expect(result.formatted).toContain('+');
      expect(result.formatted).toContain('lb in 30D');
    });
  });

  describe('Validation Functions', () => {
    it('validates height: optional, positive, up to 300 cm', () => {
      expect(validateHeight(null).isValid).toBe(true);
      expect(validateHeight('').isValid).toBe(true);
      expect(validateHeight(180).value).toBe(180);
      expect(validateHeight('175.5').value).toBe(175.5);
      expect(validateHeight(0).isValid).toBe(false);
      expect(validateHeight(-5).isValid).toBe(false);
      expect(validateHeight(305).isValid).toBe(false);
    });

    it('validates date of birth: optional, valid date, not future', () => {
      const refDate = new Date('2026-09-19T12:00:00Z');
      expect(validateDateOfBirth(null, refDate).isValid).toBe(true);
      expect(validateDateOfBirth('', refDate).isValid).toBe(true);
      expect(validateDateOfBirth('1995-05-12', refDate).value).toBe('1995-05-12');
      expect(validateDateOfBirth('2027-01-01', refDate).isValid).toBe(false);
      expect(validateDateOfBirth('invalid', refDate).isValid).toBe(false);
    });

    it('validates BMR sex: male, female, or null', () => {
      expect(validateBMRSex(null).isValid).toBe(true);
      expect(validateBMRSex('').isValid).toBe(true);
      expect(validateBMRSex('male').value).toBe('male');
      expect(validateBMRSex('female').value).toBe('female');
      expect(validateBMRSex('other').isValid).toBe(false);
    });

    it('validates weight input and converts lb to kg', () => {
      // kg input
      const resKg = validateWeightInput('80.5', 'kg');
      expect(resKg.isValid).toBe(true);
      expect(resKg.weightKg).toBe(80.5);

      // lb input: 176.37 lb -> 80.0 kg
      const resLb = validateWeightInput('176.37', 'lb');
      expect(resLb.isValid).toBe(true);
      expect(resLb.weightKg).toBe(80);

      // zero or negative
      expect(validateWeightInput('0', 'kg').isValid).toBe(false);
      expect(validateWeightInput('-5', 'kg').isValid).toBe(false);

      // too large
      expect(validateWeightInput('600', 'kg').isValid).toBe(false);
      expect(validateWeightInput('1200', 'lb').isValid).toBe(false);
    });
  });
});
