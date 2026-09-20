'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from './server';
import { getAllCompletedWorkoutsForPRs, getActiveWorkout, ActiveWorkout } from './workouts';
import { getTrainingExposureData } from './body';
import { getRangeTimestamps } from '../calculations/exposure';
import { computeAllWorkoutPRs } from '../calculations/prs';
import { normalizeExposure, getExposureColor } from '../calculations/visualization';
import { calculateWorkoutVolume } from '../calculations/workout';
import { kgToLb } from '@/utils/weight-conversion';
import {
  getMondayOfWeek,
  calculateWeeklyWorkoutsCount,
  calculateTotalWorkingSets,
  extractRecentPRs,
  getTopTrainedMuscles,
  validateDisplayName,
  validateUnitPreference,
  validateAvatarFile,
  FormattedPREvent,
} from '../calculations/profile';
import { validateUsername } from '../calculations/friends';
import {
  calculateBMI,
  calculateAge,
  calculateEstimatedBMR,
  getBMRMissingFields,
  getBMRMissingMessage,
  getLatestWeight,
  WeightEntryItem,
} from '../calculations/body-metrics';

export type RecentWorkoutSummary = {
  id: string;
  name: string;
  dateStr: string;
  durationStr: string;
  exerciseCount: number;
  workingSetCount: number;
  volumeDisplay: string;
};

export type MuscleExposureSummary = {
  muscleName: string;
  exposure: number;
  colorHex: string;
};

export type BodyMetricsSummary = {
  weightKg: number | null;
  heightCm: number | null;
  dateOfBirth: string | null;
  bmrSex: 'male' | 'female' | null;
  age: number | null;
  bmi: number | null;
  estimatedBMR: number | null;
  bmrMissingMessage: string | null;
};

export type ProfileHubData = {
  profile: {
    displayName: string | null;
    username: string | null;
    unitPreference: 'kg' | 'lb';
    avatarPath: string | null;
    avatarUrl: string | null;
  };
  overview: {
    workoutsThisWeek: number;
    totalWorkouts: number;
    workingSets: number;
    personalRecords: number;
  };
  activeWorkout: ActiveWorkout | null;
  recentWorkout: RecentWorkoutSummary | null;
  recentPRs: FormattedPREvent[];
  topMuscles: MuscleExposureSummary[];
  routineCount: number;
  friends: { count: number; pendingCount: number };
  homeFriendlyCount: number;
  bodyMetrics: BodyMetricsSummary;
  weightEntries: WeightEntryItem[];
};

function formatDuration(start: string, end: string | null): string {
  if (!end) return '—';
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  if (diffMs < 60000) return '<1 min';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins.toString().padStart(2, '0')}m`;
}

/**
 * Batched data fetching for the /profile hub.
 * Avoids N+1 queries by fetching core datasets once and deriving metrics.
 */
export async function getProfileHubData(userId: string): Promise<ProfileHubData> {
  const supabase = await createClient();

  // 30D timestamp bounds for exposure
  const { start: start30d, end: end30d } = getRangeTimestamps('30d');

  // Batched parallel fetches
  const [
    profileRes,
    allWorkouts,
    activeWorkout,
    routineCountRes,
    exposureData,
    exercisesRes,
    homeFriendlyRes,
    weightRes,
    friendshipsRes,
  ] = await Promise.all([
    // 1. Profile row
    supabase
      .from('profiles')
      .select('display_name, username, unit_preference, height_cm, date_of_birth, bmr_sex, avatar_path')
      .eq('id', userId)
      .single(),

    // 2. All completed workouts (used for stats, recent workout, and PR engine)
    getAllCompletedWorkoutsForPRs(userId),

    // 3. Active workout (if any)
    getActiveWorkout(userId),

    // 4. Saved routines count
    supabase
      .from('routines')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),

    // 5. 30D Training Exposure data
    getTrainingExposureData(userId, start30d, end30d),

    // 6. Exercises lookup (for PR exercise names)
    supabase.from('exercises').select('id, name'),

    // 7. Home-friendly count
    supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true })
      .eq('home_friendly', true)
      .eq('is_active', true),

    // 8. Weight entries
    supabase
      .from('weight_entries')
      .select('id, weight_kg, recorded_at')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: true }),

    supabase
      .from('friendships')
      .select('status, requester_id, addressee_id')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
  ]);

  const unitPreference = (profileRes.data?.unit_preference === 'lb' ? 'lb' : 'kg') as 'kg' | 'lb';
  const displayName = profileRes.data?.display_name || null;
  const username = profileRes.data?.username || null;
  const avatarPath = profileRes.data?.avatar_path || null;
  const avatarUrl = await getSignedAvatarUrl(avatarPath);
  const heightCm = profileRes.data?.height_cm ? Number(profileRes.data.height_cm) : null;
  const dateOfBirth = profileRes.data?.date_of_birth || null;
  const bmrSex = (profileRes.data?.bmr_sex as 'male' | 'female' | null) || null;

  const weightEntries: WeightEntryItem[] = ((weightRes as { data: { id: string; weight_kg: number; recorded_at: string }[] | null }).data || []).map((w) => ({
    id: w.id,
    weight_kg: Number(w.weight_kg),
    recorded_at: w.recorded_at,
  }));

  const latestWeightKg = getLatestWeight(weightEntries);

  const age = calculateAge(dateOfBirth);
  const bmi = calculateBMI(latestWeightKg, heightCm);
  const estimatedBMR = calculateEstimatedBMR(latestWeightKg, heightCm, age, bmrSex);
  const missingBMRFields = getBMRMissingFields(latestWeightKg, heightCm, age, bmrSex);
  const bmrMissingMessage = getBMRMissingMessage(missingBMRFields);

  const bodyMetrics: BodyMetricsSummary = {
    weightKg: latestWeightKg,
    heightCm,
    dateOfBirth,
    bmrSex,
    age,
    bmi,
    estimatedBMR,
    bmrMissingMessage,
  };

  // Exercise ID -> Name Map
  const exerciseNameMap = new Map<string, string>();
  for (const ex of exercisesRes.data || []) {
    exerciseNameMap.set(ex.id, ex.name);
  }

  // PR computation across all completed workouts
  const prsByWorkout = computeAllWorkoutPRs(allWorkouts);

  let totalPRCount = 0;
  for (const workoutPRs of prsByWorkout.values()) {
    for (const pr of Object.values(workoutPRs)) {
      if (pr.weightPR !== undefined) totalPRCount++;
      if (pr.estimated1RMPR !== undefined) totalPRCount++;
      if (pr.volumePR !== undefined) totalPRCount++;
      if (pr.repPRs) totalPRCount += pr.repPRs.length;
    }
  }

  // Training Overview numbers
  const monday = getMondayOfWeek();
  const workoutsThisWeek = calculateWeeklyWorkoutsCount(allWorkouts, monday);
  const totalWorkouts = allWorkouts.length;
  const workingSets = calculateTotalWorkingSets(allWorkouts);

  // Recent Workout (latest completed workout)
  let recentWorkout: RecentWorkoutSummary | null = null;
  if (allWorkouts.length > 0) {
    const latest = allWorkouts[allWorkouts.length - 1]; // allWorkouts is sorted ascending by started_at
    const durationStr = formatDuration(latest.started_at, latest.completed_at || null);
    const dateStr = latest.completed_at
      ? new Date(latest.completed_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Recent';

    const exerciseCount = latest.workout_exercises?.length || 0;
    let wsCount = 0;
    for (const we of latest.workout_exercises || []) {
      for (const s of we.workout_sets || []) {
        if (s.set_type === 'working') wsCount++;
      }
    }

    // Cast workout sets for volume calculation
    const volumeKg = calculateWorkoutVolume(
      (latest.workout_exercises || []).map((we) => ({
        workout_sets: we.workout_sets as {
          weight_kg: number;
          reps: number;
          set_type: 'working' | 'warmup';
        }[],
      }))
    );
    const displayVolume = unitPreference === 'lb' ? kgToLb(volumeKg) : volumeKg;
    const volumeDisplay = `${Math.round(displayVolume).toLocaleString()} ${
      unitPreference === 'lb' ? 'lb·reps' : 'kg·reps'
    }`;

    recentWorkout = {
      id: latest.id,
      name: latest.routine_name_snapshot || 'Workout',
      dateStr,
      durationStr,
      exerciseCount,
      workingSetCount: wsCount,
      volumeDisplay,
    };
  }

  // Recent PRs (up to 5)
  const recentPRs = extractRecentPRs(allWorkouts, prsByWorkout, exerciseNameMap, unitPreference, 5);

  // Top 5 30D Trained Muscles
  const topMusclesRaw = getTopTrainedMuscles(exposureData, 5);
  const normalizedExposureMap = normalizeExposure(exposureData);

  const topMuscles: MuscleExposureSummary[] = topMusclesRaw.map((m) => ({
    muscleName: m.muscleName,
    exposure: Math.round(m.exposure * 10) / 10,
    colorHex: getExposureColor(normalizedExposureMap[m.muscleSlug] || 0),
  }));

  return {
    profile: {
      displayName,
      username,
      unitPreference,
      avatarPath,
      avatarUrl,
    },
    overview: {
      workoutsThisWeek,
      totalWorkouts,
      workingSets,
      personalRecords: totalPRCount,
    },
    activeWorkout,
    recentWorkout,
    recentPRs,
    topMuscles,
    routineCount: routineCountRes.count || 0,
    friends: {
      count: (friendshipsRes.data || []).filter((friendship) => friendship.status === 'accepted').length,
      pendingCount: (friendshipsRes.data || []).filter((friendship) => friendship.status === 'pending').length,
    },
    homeFriendlyCount: homeFriendlyRes.count || 0,
    bodyMetrics,
    weightEntries,
  };
}

export type ProfileUpdateResult = {
  success: boolean;
  message?: string;
  error?: string;
};

/**
 * Server action to update user profile preferences.
 */
export async function updateProfilePreferences(
  userId: string,
  rawDisplayName: string | null,
  rawUnitPreference: string,
  rawUsername?: string | null
): Promise<ProfileUpdateResult> {
  const nameValidation = validateDisplayName(rawDisplayName);
  if (!nameValidation.isValid) {
    return { success: false, error: nameValidation.error };
  }

  const unitValidation = validateUnitPreference(rawUnitPreference);
  if (!unitValidation.isValid) {
    return { success: false, error: unitValidation.error };
  }
  const usernameValidation = validateUsername(rawUsername);
  if (!usernameValidation.isValid) return { success: false, error: usernameValidation.error };

  const supabase = await createClient();

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: nameValidation.value,
      username: usernameValidation.value,
      unit_preference: unitValidation.value,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: 'Failed to update profile. Please try again.' };
  }

  revalidatePath('/profile');
  revalidatePath('/home');

  return { success: true, message: 'Profile updated.' };
}

/**
 * Generates a signed URL for a private avatar image path.
 */
export async function getSignedAvatarUrl(avatarPath: string | null): Promise<string | null> {
  if (!avatarPath) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.storage.from('avatars').createSignedUrl(avatarPath, 3600);
    if (error || !data?.signedUrl) {
      return null;
    }
    return data.signedUrl;
  } catch (err) {
    console.error('Error creating signed avatar URL:', err);
    return null;
  }
}

export type AvatarUploadResult = {
  success: boolean;
  error?: string;
  avatarUrl?: string;
  avatarPath?: string;
};

/**
 * Server action to upload or replace user profile photo in private avatars bucket.
 */
export async function uploadAvatar(formData: FormData): Promise<AvatarUploadResult> {
  const file = formData.get('avatar') as File | null;
  if (!file) {
    return { success: false, error: 'Fotoğraf seçilmedi.' };
  }

  const validation = validateAvatarFile({ size: file.size, type: file.type });
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  if (!userId) {
    return { success: false, error: 'Oturum açmanız gerekiyor.' };
  }

  // Get current avatar_path to delete old file if it exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_path')
    .eq('id', userId)
    .single();

  const oldPath = profile?.avatar_path;

  // Derive file extension
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const newPath = `${userId}/${Date.now()}.${ext}`;

  // Upload new avatar to private bucket
  const fileBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(newPath, fileBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error('Error uploading avatar:', uploadError);
    return { success: false, error: 'Fotoğraf yüklenemedi. Lütfen tekrar deneyin.' };
  }

  // Update profile avatar_path
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_path: newPath, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (updateError) {
    console.error('Error updating avatar_path in profile:', updateError);
    return { success: false, error: 'Profil güncellenemedi.' };
  }

  // If previous avatar existed and differs, clean it up
  if (oldPath && oldPath !== newPath) {
    await supabase.storage.from('avatars').remove([oldPath]);
  }

  const avatarUrl = await getSignedAvatarUrl(newPath);

  revalidatePath('/profile');
  revalidatePath('/home');
  revalidatePath('/friends');

  return { success: true, avatarUrl: avatarUrl || undefined, avatarPath: newPath };
}

export type AvatarRemoveResult = {
  success: boolean;
  error?: string;
};

/**
 * Server action to remove user profile photo from storage and clear avatar_path.
 */
export async function removeAvatar(): Promise<AvatarRemoveResult> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  if (!userId) {
    return { success: false, error: 'Oturum açmanız gerekiyor.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_path')
    .eq('id', userId)
    .single();

  const oldPath = profile?.avatar_path;
  if (oldPath) {
    await supabase.storage.from('avatars').remove([oldPath]);
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_path: null, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (updateError) {
    console.error('Error removing avatar_path in profile:', updateError);
    return { success: false, error: 'Fotoğraf kaldırılamadı.' };
  }

  revalidatePath('/profile');
  revalidatePath('/home');
  revalidatePath('/friends');

  return { success: true };
}
