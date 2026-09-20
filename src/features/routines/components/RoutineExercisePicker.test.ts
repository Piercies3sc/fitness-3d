import { describe, it, expect } from 'vitest';
import { filterCatalogExercises } from './RoutineExercisePickerModal';
import { ExerciseWithMuscles } from '../../../lib/supabase/exercises';
import { EXERCISE_CATALOG } from '../../../lib/calculations/catalog_expansion.test';

// Convert EXERCISE_CATALOG (80 exercises) to typed mock ExerciseWithMuscles[]
const mockCatalogExercises: ExerciseWithMuscles[] = EXERCISE_CATALOG.map((ex, index) => ({
  id: `ex-id-${index + 1}`,
  slug: ex.slug,
  name: ex.name,
  body_region: ex.region,
  equipment: ex.equipment,
  home_friendly: ex.home_friendly,
  movement_type: 'Sample Type',
  description: null,
  model_path: null,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  exercise_muscles: [],
}));

describe('Routine Exercise Picker - 80 Exercises, Home-First, Filters & Search', () => {
  it('A) returns all 80 exercises when filter is All and search is empty', () => {
    const results = filterCatalogExercises(mockCatalogExercises, 'all', '');
    expect(results).toHaveLength(80);
  });

  it('B) returns exactly 55 home-friendly exercises when filter is Home', () => {
    const results = filterCatalogExercises(mockCatalogExercises, 'home', '');
    expect(results).toHaveLength(55);
    for (const ex of results) {
      expect(ex.home_friendly).toBe(true);
    }
  });

  it('C) searches across all exercises (home + gym) when filter is All', () => {
    // Cable is gym
    const cableResults = filterCatalogExercises(mockCatalogExercises, 'all', 'cable');
    expect(cableResults.length).toBeGreaterThanOrEqual(7);
    const cableNames = cableResults.map((r) => r.name);
    expect(cableNames).toContain('Cable Chest Fly');
    expect(cableNames).toContain('Cable Lateral Raise');

    // Bodyweight is home
    const bwResults = filterCatalogExercises(mockCatalogExercises, 'all', 'bodyweight');
    expect(bwResults.length).toBeGreaterThanOrEqual(15);
    const bwNames = bwResults.map((r) => r.name);
    expect(bwNames).toContain('Push-Up');
    expect(bwNames).toContain('Bodyweight Squat');
  });

  it('D) searches by exercise name (e.g., "bench" -> Barbell Bench Press, Incline Dumbbell Press)', () => {
    const results = filterCatalogExercises(mockCatalogExercises, 'all', 'bench');
    const names = results.map((r) => r.name);
    expect(names).toContain('Barbell Bench Press');
    expect(names).toContain('Incline Dumbbell Press');
  });

  it('E) searches by equipment (e.g., "band" -> resistance band movements)', () => {
    const results = filterCatalogExercises(mockCatalogExercises, 'all', 'band');
    const names = results.map((r) => r.name);
    expect(names).toContain('Resistance Band Row');
    expect(names).toContain('Resistance Band Face Pull');
    expect(names).toContain('Resistance Band Biceps Curl');
  });

  it('F) filters by region (e.g., Chest -> all chest exercises including home and gym)', () => {
    const results = filterCatalogExercises(mockCatalogExercises, 'chest', '');
    const names = results.map((r) => r.name);
    // Home chest
    expect(names).toContain('Push-Up');
    expect(names).toContain('Incline Push-Up');
    expect(names).toContain('Decline Push-Up');
    expect(names).toContain('Dumbbell Floor Press');
    expect(names).toContain('Barbell Bench Press');
    expect(names).toContain('Incline Dumbbell Press');
    // Gym chest
    expect(names).toContain('Cable Chest Fly');
    expect(names).toContain('Machine Chest Press');
    expect(names).toContain('Pec Deck Fly');
  });

  it('G) filters by region (e.g., Quadriceps -> includes Squats, Lunges, Leg Press, Hack Squat)', () => {
    const results = filterCatalogExercises(mockCatalogExercises, 'quadriceps', '');
    const names = results.map((r) => r.name);
    expect(names).toContain('Barbell Back Squat');
    expect(names).toContain('Bodyweight Squat');
    expect(names).toContain('Goblet Squat');
    expect(names).toContain('Reverse Lunge');
    expect(names).toContain('Walking Lunge');
    expect(names).toContain('Leg Press');
    expect(names).toContain('Leg Extension');
    expect(names).toContain('Hack Squat');
    expect(names).toContain('Smith Machine Squat');
    expect(names).toContain('Hip Adduction Machine');
  });

  it('H) combines Home filter with search query', () => {
    const results = filterCatalogExercises(mockCatalogExercises, 'home', 'curl');
    const names = results.map((r) => r.name);
    // Home curls
    expect(names).toContain('Dumbbell Biceps Curl');
    expect(names).toContain('Hammer Curl');
    expect(names).toContain('Concentration Curl');
    expect(names).toContain('Resistance Band Biceps Curl');
    expect(names).toContain('Incline Dumbbell Curl');
    expect(names).toContain('Sliding Leg Curl');
    expect(names).toContain('Nordic Hamstring Curl');

    // Non-home curls should NOT be present
    expect(names).not.toContain('Preacher Curl');
    expect(names).not.toContain('Seated Leg Curl');
    expect(names).not.toContain('Lying Leg Curl');
  });

  it('I) returns empty array for non-matching search', () => {
    const results = filterCatalogExercises(mockCatalogExercises, 'all', 'kettlebell-swing-xyz');
    expect(results).toHaveLength(0);
  });

  it('J) simulates already-added check to prevent duplicates in routine', () => {
    const addedIds = new Set(['ex-id-1']); // Barbell Bench Press
    const benchPress = mockCatalogExercises.find((e) => e.id === 'ex-id-1')!;

    const isAdded = addedIds.has(benchPress.id);
    expect(isAdded).toBe(true);

    const pushUp = mockCatalogExercises.find((e) => e.slug === 'push-up')!;
    const isPushUpAdded = addedIds.has(pushUp.id);
    expect(isPushUpAdded).toBe(false);
  });
});
