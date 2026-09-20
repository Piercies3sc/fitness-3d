export type TimeRange = '7d' | '30d' | '3m' | '6m' | '1y';

export function getRangeTimestamps(range: TimeRange, now: Date = new Date()): { start: string; end: string } {
  const start = new Date(now.getTime());
  
  switch (range) {
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '3m': {
      const d = start.getDate();
      start.setMonth(start.getMonth() - 3);
      if (start.getDate() !== d) start.setDate(0);
      break;
    }
    case '6m': {
      const d = start.getDate();
      start.setMonth(start.getMonth() - 6);
      if (start.getDate() !== d) start.setDate(0);
      break;
    }
    case '1y': {
      const d = start.getDate();
      start.setFullYear(start.getFullYear() - 1);
      if (start.getDate() !== d) start.setDate(0);
      break;
    }
  }
  
  return {
    start: start.toISOString(),
    end: now.toISOString()
  };
}

export type MuscleTrainingExposure = {
  muscleId: string;
  muscleSlug: string;
  muscleName: string;
  exposure: number;
};

export type MuscleCatalogData = {
  id: string;
  slug: string;
  name: string;
  region: string;
};

export type ExerciseMuscleMapping = {
  exercise_id: string;
  muscle_id: string;
  role: 'primary' | 'secondary';
  exposure_factor: number;
};

export type WorkingSetInput = {
  workout_id: string;
  exercise_id: string;
  completed_at: string; // ISO string
};

export function calculateTrainingExposure(
  workingSets: WorkingSetInput[],
  muscles: MuscleCatalogData[],
  mappings: ExerciseMuscleMapping[],
  startDate: string,
  endDate: string
): MuscleTrainingExposure[] {
  // Initialize result map with all logical muscles at 0 exposure
  const exposureMap = new Map<string, MuscleTrainingExposure>();
  
  for (const muscle of muscles) {
    exposureMap.set(muscle.id, {
      muscleId: muscle.id,
      muscleSlug: muscle.slug,
      muscleName: muscle.name,
      exposure: 0
    });
  }
  
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  
  // Create quick lookup for exercise -> muscle mappings
  const exerciseMappings = new Map<string, ExerciseMuscleMapping[]>();
  for (const mapping of mappings) {
    if (!exerciseMappings.has(mapping.exercise_id)) {
      exerciseMappings.set(mapping.exercise_id, []);
    }
    exerciseMappings.get(mapping.exercise_id)!.push(mapping);
  }
  
  // Aggregate valid sets
  for (const set of workingSets) {
    const completedMs = new Date(set.completed_at).getTime();
    
    // Boundary check (inclusive)
    if (completedMs >= startMs && completedMs <= endMs) {
      const exerciseMuscles = exerciseMappings.get(set.exercise_id) || [];
      
      for (const em of exerciseMuscles) {
        const muscleTotal = exposureMap.get(em.muscle_id);
        if (muscleTotal) {
          muscleTotal.exposure += em.exposure_factor;
        }
      }
    }
  }
  
  // Format exposure and sort deterministically
  const results = Array.from(exposureMap.values());
  
  return results.sort((a, b) => {
    // Sort by exposure descending, then name ascending
    if (Math.abs(a.exposure - b.exposure) > 0.001) {
      return b.exposure - a.exposure;
    }
    return a.muscleName.localeCompare(b.muscleName);
  });
}
