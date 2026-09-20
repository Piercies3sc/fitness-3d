import { describe, it, expect } from 'vitest';
import { 
  getRangeTimestamps, 
  calculateTrainingExposure, 
  MuscleCatalogData, 
  ExerciseMuscleMapping, 
  WorkingSetInput 
} from './exposure';

describe('getRangeTimestamps', () => {
  it('computes 7d range correctly', () => {
    const now = new Date('2023-10-15T12:00:00Z');
    const range = getRangeTimestamps('7d', now);
    expect(range.end).toBe('2023-10-15T12:00:00.000Z');
    expect(range.start).toBe('2023-10-08T12:00:00.000Z');
  });

  it('computes 30d range correctly', () => {
    const now = new Date('2023-10-15T12:00:00Z');
    const range = getRangeTimestamps('30d', now);
    expect(range.start).toBe('2023-09-15T12:00:00.000Z');
  });
  
  it('computes 3m calendar subtraction', () => {
    const now = new Date('2023-10-15T12:00:00Z');
    const range = getRangeTimestamps('3m', now);
    expect(range.start).toBe('2023-07-15T12:00:00.000Z');
  });

  it('handles month-end clamping for 3m (May 31 minus 3 months -> Feb 28)', () => {
    const now = new Date('2023-05-31T12:00:00Z');
    const range = getRangeTimestamps('3m', now);
    expect(range.start).toBe('2023-02-28T12:00:00.000Z');
  });

  it('handles month-end clamping for 6m (August 31 minus 6 months -> Feb 28)', () => {
    const now = new Date('2023-08-31T12:00:00Z');
    const range = getRangeTimestamps('6m', now);
    expect(range.start).toBe('2023-02-28T12:00:00.000Z');
  });

  it('handles 1y leap-year behavior (Feb 29 minus 1 year -> Feb 28)', () => {
    const now = new Date('2024-02-29T12:00:00Z'); // 2024 is a leap year
    const range = getRangeTimestamps('1y', now);
    expect(range.start).toBe('2023-02-28T12:00:00.000Z'); // 2023 is not
  });
});

describe('calculateTrainingExposure', () => {
  // Test Catalog
  const exBench = 'ex-bench';
  const exSquat = 'ex-squat';
  const exLat = 'ex-lat';
  
  const mPec = 'm-pec';
  const mTri = 'm-tri';
  const mAntDelt = 'm-ant-delt';
  
  const mQuad = 'm-quad';
  const mGlutes = 'm-glutes';
  const mAdductors = 'm-add';
  const mHamstrings = 'm-ham';
  
  const mLats = 'm-lats';
  const mBiceps = 'm-biceps';
  const mTeres = 'm-teres';
  const mTraps = 'm-traps';

  const muscles: MuscleCatalogData[] = [
    { id: mPec, slug: 'pectoralis-major', name: 'Pectoralis Major', region: 'Chest' },
    { id: mTri, slug: 'triceps', name: 'Triceps', region: 'Arms' },
    { id: mAntDelt, slug: 'anterior-deltoid', name: 'Anterior Deltoid', region: 'Shoulders' },
    { id: mQuad, slug: 'quadriceps', name: 'Quadriceps', region: 'Legs' },
    { id: mGlutes, slug: 'glutes', name: 'Glutes', region: 'Legs' },
    { id: mAdductors, slug: 'adductors', name: 'Adductors', region: 'Legs' },
    { id: mHamstrings, slug: 'hamstrings', name: 'Hamstrings', region: 'Legs' },
    { id: mLats, slug: 'latissimus-dorsi', name: 'Latissimus Dorsi', region: 'Back' },
    { id: mBiceps, slug: 'biceps', name: 'Biceps', region: 'Arms' },
    { id: mTeres, slug: 'teres-major', name: 'Teres Major', region: 'Back' },
    { id: mTraps, slug: 'mid-lower-trapezius', name: 'Mid / Lower Trapezius', region: 'Back' }
  ];

  const mappings: ExerciseMuscleMapping[] = [
    // Bench Press
    { exercise_id: exBench, muscle_id: mPec, role: 'primary', exposure_factor: 1.0 },
    { exercise_id: exBench, muscle_id: mTri, role: 'secondary', exposure_factor: 0.5 },
    { exercise_id: exBench, muscle_id: mAntDelt, role: 'secondary', exposure_factor: 0.4 },
    // Squat
    { exercise_id: exSquat, muscle_id: mQuad, role: 'primary', exposure_factor: 1.0 },
    { exercise_id: exSquat, muscle_id: mGlutes, role: 'primary', exposure_factor: 0.8 },
    { exercise_id: exSquat, muscle_id: mAdductors, role: 'secondary', exposure_factor: 0.4 },
    { exercise_id: exSquat, muscle_id: mHamstrings, role: 'secondary', exposure_factor: 0.25 },
    // Lat Pulldown
    { exercise_id: exLat, muscle_id: mLats, role: 'primary', exposure_factor: 1.0 },
    { exercise_id: exLat, muscle_id: mBiceps, role: 'secondary', exposure_factor: 0.5 },
    { exercise_id: exLat, muscle_id: mTeres, role: 'secondary', exposure_factor: 0.4 },
    { exercise_id: exLat, muscle_id: mTraps, role: 'secondary', exposure_factor: 0.25 },
  ];

  it('matches exactly the scenario provided in the prompt requirements', () => {
    // 3 bench press sets, 2 squats, 4 lat pulldowns
    const sets: WorkingSetInput[] = [
      { workout_id: 'w1', exercise_id: exBench, completed_at: '2023-10-10T12:00:00Z' },
      { workout_id: 'w1', exercise_id: exBench, completed_at: '2023-10-10T12:01:00Z' },
      { workout_id: 'w1', exercise_id: exBench, completed_at: '2023-10-10T12:02:00Z' },
      // The warm-up set is explicitly NOT INCLUDED in WorkingSetInput, simulating query exclusion
      
      { workout_id: 'w1', exercise_id: exSquat, completed_at: '2023-10-10T12:10:00Z' },
      { workout_id: 'w1', exercise_id: exSquat, completed_at: '2023-10-10T12:12:00Z' },
      
      { workout_id: 'w1', exercise_id: exLat, completed_at: '2023-10-10T12:20:00Z' },
      { workout_id: 'w1', exercise_id: exLat, completed_at: '2023-10-10T12:21:00Z' },
      { workout_id: 'w1', exercise_id: exLat, completed_at: '2023-10-10T12:22:00Z' },
      { workout_id: 'w1', exercise_id: exLat, completed_at: '2023-10-10T12:23:00Z' },
    ];

    const results = calculateTrainingExposure(
      sets, 
      muscles, 
      mappings, 
      '2023-10-01T00:00:00Z', 
      '2023-10-30T00:00:00Z'
    );
    
    // Map for easy checking
    const rMap = new Map(results.map(r => [r.muscleId, r.exposure]));

    expect(rMap.get(mPec)).toBe(3.0);
    expect(rMap.get(mTri)).toBe(1.5);
    expect(rMap.get(mAntDelt)).toBeCloseTo(1.2, 5);
    
    expect(rMap.get(mQuad)).toBe(2.0);
    expect(rMap.get(mGlutes)).toBeCloseTo(1.6, 5);
    expect(rMap.get(mAdductors)).toBeCloseTo(0.8, 5);
    expect(rMap.get(mHamstrings)).toBe(0.5);

    expect(rMap.get(mLats)).toBe(4.0);
    expect(rMap.get(mBiceps)).toBe(2.0);
    expect(rMap.get(mTeres)).toBeCloseTo(1.6, 5);
    expect(rMap.get(mTraps)).toBe(1.0);
  });

  it('verifies weight/rep independence since those properties do not exist on WorkingSetInput', () => {
    // The data structure physically lacks weight and reps, proving structural independence.
    // We just ensure two working sets of same exercise sum correctly.
    const sets: WorkingSetInput[] = [
      { workout_id: 'w1', exercise_id: exBench, completed_at: '2023-10-10T12:00:00Z' }, // simulating 200kg x 12
      { workout_id: 'w1', exercise_id: exBench, completed_at: '2023-10-10T12:00:00Z' }, // simulating 20kg x 1
    ];
    const results = calculateTrainingExposure(
      sets, muscles, mappings, '2023-10-01T00:00:00Z', '2023-10-30T00:00:00Z'
    );
    const rMap = new Map(results.map(r => [r.muscleId, r.exposure]));
    expect(rMap.get(mPec)).toBe(2.0); // 2 sets * 1.0
  });

  it('respects time boundaries correctly', () => {
    const sets: WorkingSetInput[] = [
      { workout_id: 'w1', exercise_id: exBench, completed_at: '2023-10-01T09:59:59.999Z' }, // Before start
      { workout_id: 'w1', exercise_id: exBench, completed_at: '2023-10-01T10:00:00.000Z' }, // Exactly at start (included)
      { workout_id: 'w1', exercise_id: exBench, completed_at: '2023-10-15T10:00:00.000Z' }, // Inside (included)
      { workout_id: 'w1', exercise_id: exBench, completed_at: '2023-10-30T10:00:00.000Z' }, // Exactly at end (included)
      { workout_id: 'w1', exercise_id: exBench, completed_at: '2023-10-30T10:00:00.001Z' }, // After end
    ];
    
    const results = calculateTrainingExposure(
      sets, muscles, mappings, '2023-10-01T10:00:00.000Z', '2023-10-30T10:00:00.000Z'
    );
    const rMap = new Map(results.map(r => [r.muscleId, r.exposure]));
    expect(rMap.get(mPec)).toBe(3.0); // 3 sets included
  });
});
