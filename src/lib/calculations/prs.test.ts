import { describe, it, expect } from 'vitest';
import { computeAllWorkoutPRs, normalizeLoadKg, PRWorkoutInput } from './prs';

describe('normalizeLoadKg', () => {
  it('rounds to 2 decimal places', () => {
    expect(normalizeLoadKg(45.3592)).toBe(45.36);
    expect(normalizeLoadKg(100)).toBe(100);
    expect(normalizeLoadKg(100.125)).toBe(100.13);
  });
});

describe('computeAllWorkoutPRs', () => {
  const ex1 = 'ex-1';

  it('establishes baseline on first performance, no PRs', () => {
    const workouts: PRWorkoutInput[] = [
      {
        id: 'w1',
        started_at: '2023-01-01T10:00:00Z',
        workout_exercises: [
          {
            exercise_id: ex1,
            workout_sets: [
              { weight_kg: 100, reps: 5, set_type: 'working' },
              { weight_kg: 100, reps: 5, set_type: 'working' },
            ]
          }
        ]
      }
    ];

    const prs = computeAllWorkoutPRs(workouts);
    expect(prs.get('w1')).toEqual({});
  });

  it('detects PRs strictly greater than previous bests', () => {
    const workouts: PRWorkoutInput[] = [
      {
        id: 'w1',
        started_at: '2023-01-01T10:00:00Z',
        workout_exercises: [
          {
            exercise_id: ex1,
            workout_sets: [
              { weight_kg: 100, reps: 5, set_type: 'working' },
            ]
          }
        ]
      },
      {
        id: 'w2',
        started_at: '2023-01-02T10:00:00Z',
        workout_exercises: [
          {
            exercise_id: ex1,
            workout_sets: [
              { weight_kg: 100, reps: 5, set_type: 'working' }, // Tie
            ]
          }
        ]
      },
      {
        id: 'w3',
        started_at: '2023-01-03T10:00:00Z',
        workout_exercises: [
          {
            exercise_id: ex1,
            workout_sets: [
              { weight_kg: 102.5, reps: 5, set_type: 'working' }, // Weight & E1RM PR
              { weight_kg: 100, reps: 6, set_type: 'working' }, // Rep PR at 100kg
            ]
          }
        ]
      }
    ];

    const prs = computeAllWorkoutPRs(workouts);
    
    // w2 has no PRs (ties)
    expect(prs.get('w2')).toEqual({});
    
    // w3 has PRs
    const w3PRs = prs.get('w3')!;
    expect(w3PRs[ex1]).toBeDefined();
    expect(w3PRs[ex1].weightPR).toBe(102.5);
    expect(w3PRs[ex1].repPRs).toEqual([
      { load: 100, reps: 6 }
    ]);
    
    // E1RM for 100x5 = 116.66...
    // E1RM for 102.5x5 = 119.58...
    // E1RM for 100x6 = 120
    expect(w3PRs[ex1].estimated1RMPR).toBe(120);

    // Volume w1: 500
    // Volume w2: 500
    // Volume w3: 102.5*5 + 100*6 = 512.5 + 600 = 1112.5
    expect(w3PRs[ex1].volumePR).toBe(1112.5);
  });

  it('excludes warm-up sets', () => {
    const workouts: PRWorkoutInput[] = [
      {
        id: 'w1',
        started_at: '2023-01-01T10:00:00Z',
        workout_exercises: [
          {
            exercise_id: ex1,
            workout_sets: [
              { weight_kg: 50, reps: 10, set_type: 'working' },
            ]
          }
        ]
      },
      {
        id: 'w2',
        started_at: '2023-01-02T10:00:00Z',
        workout_exercises: [
          {
            exercise_id: ex1,
            workout_sets: [
              { weight_kg: 100, reps: 10, set_type: 'warmup' }, // Huge warmup, shouldn't trigger PR
              { weight_kg: 50, reps: 10, set_type: 'working' },
            ]
          }
        ]
      }
    ];

    const prs = computeAllWorkoutPRs(workouts);
    expect(prs.get('w2')).toEqual({});
  });

  it('excludes 13+ reps from E1RM but keeps them for other PRs', () => {
    const workouts: PRWorkoutInput[] = [
      {
        id: 'w1',
        started_at: '2023-01-01T10:00:00Z',
        workout_exercises: [
          {
            exercise_id: ex1,
            workout_sets: [
              { weight_kg: 60, reps: 8, set_type: 'working' }, // E1RM: 76
            ]
          }
        ]
      },
      {
        id: 'w2',
        started_at: '2023-01-02T10:00:00Z',
        workout_exercises: [
          {
            exercise_id: ex1,
            workout_sets: [
              { weight_kg: 60, reps: 15, set_type: 'working' }, // E1RM formula would be 90, but should be excluded
            ]
          }
        ]
      }
    ];

    const prs = computeAllWorkoutPRs(workouts);
    const w2PRs = prs.get('w2')![ex1];
    
    expect(w2PRs.estimated1RMPR).toBeUndefined(); // Excluded from E1RM
    expect(w2PRs.repPRs).toEqual([{ load: 60, reps: 15 }]); // Still triggers Rep PR
    expect(w2PRs.volumePR).toBe(900); // 60 * 15 = 900 > 480
  });

  it('detects multiple Rep PRs in the same workout', () => {
    const workouts: PRWorkoutInput[] = [
      {
        id: 'w1',
        started_at: '2023-01-01T10:00:00Z',
        workout_exercises: [
          {
            exercise_id: ex1,
            workout_sets: [
              { weight_kg: 60, reps: 8, set_type: 'working' },
              { weight_kg: 70, reps: 5, set_type: 'working' },
            ]
          }
        ]
      },
      {
        id: 'w2',
        started_at: '2023-01-02T10:00:00Z',
        workout_exercises: [
          {
            exercise_id: ex1,
            workout_sets: [
              { weight_kg: 60, reps: 10, set_type: 'working' }, // Beats 60x8
              { weight_kg: 70, reps: 6, set_type: 'working' }, // Beats 70x5
            ]
          }
        ]
      }
    ];

    const prs = computeAllWorkoutPRs(workouts);
    const w2PRs = prs.get('w2')![ex1];
    
    expect(w2PRs.repPRs).toEqual([
      { load: 70, reps: 6 },
      { load: 60, reps: 10 },
    ]);
  });

  it('verifies historical chronology (Workout C does not affect Workout B)', () => {
    const workouts: PRWorkoutInput[] = [
      {
        id: 'A',
        started_at: '2023-01-01T10:00:00Z',
        workout_exercises: [
          {
            exercise_id: ex1,
            workout_sets: [
              { weight_kg: 60, reps: 8, set_type: 'working' },
              { weight_kg: 60, reps: 8, set_type: 'working' },
              { weight_kg: 60, reps: 8, set_type: 'working' },
            ] // Vol = 1440, E1RM = 76
          }
        ]
      },
      {
        id: 'B',
        started_at: '2023-01-02T10:00:00Z',
        workout_exercises: [
          {
            exercise_id: ex1,
            workout_sets: [
              { weight_kg: 65, reps: 5, set_type: 'working' },
              { weight_kg: 60, reps: 10, set_type: 'working' },
              { weight_kg: 60, reps: 8, set_type: 'working' },
            ] // Vol = 1405, E1RM = 80
          }
        ]
      },
      {
        id: 'C',
        started_at: '2023-01-03T10:00:00Z',
        workout_exercises: [
          {
            exercise_id: ex1,
            workout_sets: [
              { weight_kg: 60, reps: 10, set_type: 'working' },
              { weight_kg: 60, reps: 10, set_type: 'working' },
              { weight_kg: 60, reps: 10, set_type: 'working' },
            ] // Vol = 1800, E1RM = 80
          }
        ]
      }
    ];

    const prs = computeAllWorkoutPRs(workouts);
    
    const prA = prs.get('A');
    expect(prA).toEqual({});

    const prB = prs.get('B')![ex1];
    expect(prB.weightPR).toBe(65);
    expect(prB.estimated1RMPR).toBe(80);
    expect(prB.volumePR).toBeUndefined(); // 1405 < 1440
    expect(prB.repPRs).toEqual([
      { load: 60, reps: 10 } // Beats 8
    ]);

    const prC = prs.get('C')![ex1];
    expect(prC.weightPR).toBeUndefined();
    expect(prC.estimated1RMPR).toBeUndefined();
    expect(prC.volumePR).toBe(1800); // 1800 > 1440
    expect(prC.repPRs).toBeUndefined(); // 10 reps tied
  });
});
