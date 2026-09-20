import { describe, expect, it } from 'vitest';
import { friendVisibleProfile, formatFriendWeight, getRelationshipState, validateUsername } from './friends';

describe('friends helpers', () => {
  it('canonicalizes valid usernames and rejects reserved or malformed values', () => {
    expect(validateUsername(' Athlete_01 ')).toEqual({ isValid: true, value: 'athlete_01' });
    expect(validateUsername('ad')).toMatchObject({ isValid: false });
    expect(validateUsername('Admin')).toMatchObject({ isValid: false });
  });

  it('finds the relationship regardless of requester direction', () => {
    expect(getRelationshipState([{ requester_id: 'b', addressee_id: 'a', status: 'pending' }], 'a', 'b')).toBe('pending');
    expect(getRelationshipState([], 'a', 'b')).toBe('none');
  });

  it('returns only approved friend-profile fields and caps summaries', () => {
    const data = friendVisibleProfile({
      display_name: 'Alex', username: 'alex',
      overview: { workouts_this_week: 2, total_workouts: 8, working_sets: 24, routine_count: 1 },
      recent_workouts: Array.from({ length: 4 }, () => ({ name: 'Workout', completed_at: '2026-01-01' })),
      recent_prs: Array.from({ length: 6 }, () => ({ exercise_name: 'Squat', weight_kg: 80, completed_at: '2026-01-01' })),
      top_muscles: Array.from({ length: 6 }, () => ({ name: 'Quadriceps', exposure: 2 })),
    });
    expect(Object.keys(data).sort()).toEqual(['display_name', 'overview', 'recent_prs', 'recent_workouts', 'top_muscles', 'username']);
    expect(data.recent_workouts).toHaveLength(3);
    expect(data.recent_prs).toHaveLength(5);
    expect(data.top_muscles).toHaveLength(5);
  });

  it('formats friend loads in the viewer unit preference', () => {
    expect(formatFriendWeight(80, 'kg')).toBe('80.0 kg');
    expect(formatFriendWeight(80, 'lb')).toBe('176.4 lb');
  });
});
