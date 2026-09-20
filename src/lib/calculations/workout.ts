export function calculateSetVolume(weightKg: number, reps: number, setType: 'working' | 'warmup'): number {
  if (setType !== 'working') return 0;
  if (weightKg < 0 || reps <= 0) return 0;
  return weightKg * reps;
}

export function calculateWorkoutVolume(
  exercises: { workout_sets?: { weight_kg: number; reps: number; set_type: 'working' | 'warmup' }[] }[]
): number {
  let totalVolume = 0;
  for (const exercise of exercises) {
    if (!exercise.workout_sets) continue;
    for (const set of exercise.workout_sets) {
      totalVolume += calculateSetVolume(set.weight_kg, set.reps, set.set_type);
    }
  }
  return totalVolume;
}

export function calculateEstimated1RM(weightKg: number, reps: number, setType: 'working' | 'warmup'): number | null {
  if (setType !== 'working') return null;
  // Epley formula heuristic applies to 1-12 reps inclusive
  if (reps < 1 || reps > 12) return null;
  if (weightKg <= 0) return null;

  return weightKg * (1 + reps / 30);
}

export function getBestEstimated1RM(
  sets: { weight_kg: number; reps: number; set_type: 'working' | 'warmup' }[]
): number | null {
  let best1RM: number | null = null;
  for (const set of sets) {
    const e1rm = calculateEstimated1RM(set.weight_kg, set.reps, set.set_type);
    if (e1rm !== null) {
      if (best1RM === null || e1rm > best1RM) {
        best1RM = e1rm;
      }
    }
  }
  return best1RM;
}
