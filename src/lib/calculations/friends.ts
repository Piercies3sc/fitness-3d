import { kgToLb } from '../../utils/weight-conversion';

const RESERVED_USERNAMES = new Set([
  'admin', 'support', 'system', 'api', 'profile', 'friends', 'login', 'register',
]);

export type FriendRelationshipState = 'none' | 'pending' | 'accepted';

export function validateUsername(value: string | null | undefined): {
  isValid: boolean;
  value: string | null;
  error?: string;
} {
  if (!value || value.trim() === '') return { isValid: true, value: null };
  const canonical = value.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(canonical)) {
    return { isValid: false, value: canonical, error: 'Use 3–20 lowercase letters, numbers, or underscores.' };
  }
  if (RESERVED_USERNAMES.has(canonical)) {
    return { isValid: false, value: canonical, error: 'That username is reserved.' };
  }
  return { isValid: true, value: canonical };
}

export function getRelationshipState(
  relationships: Array<{ requester_id: string; addressee_id: string; status: FriendRelationshipState }>,
  viewerId: string,
  targetId: string
): FriendRelationshipState {
  return relationships.find((relationship) =>
    (relationship.requester_id === viewerId && relationship.addressee_id === targetId) ||
    (relationship.requester_id === targetId && relationship.addressee_id === viewerId)
  )?.status ?? 'none';
}

export function getInitials(displayName: string | null, username: string): string {
  const source = (displayName || username).trim();
  return source.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

export function formatFriendWeight(weightKg: number, unitPreference: 'kg' | 'lb'): string {
  const value = unitPreference === 'lb' ? kgToLb(weightKg) : weightKg;
  return `${(Math.round(value * 10) / 10).toFixed(1)} ${unitPreference}`;
}

export type FriendVisibleProfile = {
  display_name: string | null;
  username: string;
  overview: { workouts_this_week: number; total_workouts: number; working_sets: number; routine_count: number };
  recent_workouts: Array<{ name: string; completed_at: string }>;
  recent_prs: Array<{ exercise_name: string; weight_kg: number; completed_at: string }>;
  top_muscles: Array<{ name: string; exposure: number }>;
};

export function friendVisibleProfile(data: FriendVisibleProfile): FriendVisibleProfile {
  return {
    display_name: data.display_name,
    username: data.username,
    overview: data.overview,
    recent_workouts: data.recent_workouts.slice(0, 3),
    recent_prs: data.recent_prs.slice(0, 5),
    top_muscles: data.top_muscles.slice(0, 5),
  };
}
