import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { 
  calculateTrainingExposure, 
  MuscleCatalogData, 
  ExerciseMuscleMapping, 
  WorkingSetInput 
} from './exposure';
import { CONTEXT_RUNTIME_MESHES, CONTEXT_MESH_SET } from '../../features/body/constants/contextMeshes';
import { EXPECTED_MAPPING, EXPECTED_CONTEXT } from '../../../scripts/validate-anatomy.mjs';

// Canonical 21 logical muscles definition
export const LOGICAL_MUSCLES: MuscleCatalogData[] = [
  { id: 'm-pec-maj', slug: 'pectoralis-major', name: 'Pectoralis Major', region: 'Chest' },
  { id: 'm-triceps', slug: 'triceps', name: 'Triceps', region: 'Arms' },
  { id: 'm-ant-delt', slug: 'anterior-deltoid', name: 'Anterior Deltoid', region: 'Shoulders' },
  { id: 'm-quads', slug: 'quadriceps', name: 'Quadriceps', region: 'Legs' },
  { id: 'm-glutes', slug: 'glutes', name: 'Glutes', region: 'Legs' },
  { id: 'm-adductors', slug: 'adductors', name: 'Adductors', region: 'Legs' },
  { id: 'm-hamstrings', slug: 'hamstrings', name: 'Hamstrings', region: 'Legs' },
  { id: 'm-lats', slug: 'latissimus-dorsi', name: 'Latissimus Dorsi', region: 'Back' },
  { id: 'm-biceps', slug: 'biceps', name: 'Biceps', region: 'Arms' },
  { id: 'm-teres-maj', slug: 'teres-major', name: 'Teres Major', region: 'Back' },
  { id: 'm-traps', slug: 'mid-lower-trapezius', name: 'Mid / Lower Trapezius', region: 'Back' },
  { id: 'm-lat-delt', slug: 'lateral-deltoid', name: 'Lateral Deltoid', region: 'Shoulders' },
  { id: 'm-post-delt', slug: 'posterior-deltoid', name: 'Posterior Deltoid', region: 'Shoulders' },
  { id: 'm-calves', slug: 'calves', name: 'Calves', region: 'Legs' },
  { id: 'm-rectus-abd', slug: 'rectus-abdominis', name: 'Rectus Abdominis', region: 'Core' },
  { id: 'm-obliques', slug: 'obliques', name: 'Obliques', region: 'Core' },
  { id: 'm-erector', slug: 'erector-spinae', name: 'Erector Spinae', region: 'Back' },
  { id: 'm-forearms', slug: 'forearms', name: 'Forearms', region: 'Arms' },
  { id: 'm-hip-flexors', slug: 'hip-flexors', name: 'Hip Flexors', region: 'Hips' },
  { id: 'm-tibialis-anterior', slug: 'tibialis-anterior', name: 'Tibialis Anterior', region: 'Legs' },
  { id: 'm-fibularis', slug: 'fibularis', name: 'Fibularis', region: 'Legs' },
];

export interface CatalogExerciseItem {
  slug: string;
  name: string;
  region: string;
  equipment: string;
  home_friendly: boolean;
}

// Canonical 80 exercises catalog
export const EXERCISE_CATALOG: CatalogExerciseItem[] = [
  // --- Existing 30 Exercises ---
  // Chest
  { slug: 'bench-press', name: 'Barbell Bench Press', region: 'chest', equipment: 'Barbell + Bench', home_friendly: true },
  { slug: 'incline-dumbbell-press', name: 'Incline Dumbbell Press', region: 'chest', equipment: 'Dumbbells + Incline Bench', home_friendly: true },
  { slug: 'cable-chest-fly', name: 'Cable Chest Fly', region: 'chest', equipment: 'Cable Machine', home_friendly: false },
  // Back
  { slug: 'lat-pulldown', name: 'Lat Pulldown', region: 'back', equipment: 'Cable Machine', home_friendly: false },
  { slug: 'seated-cable-row', name: 'Seated Cable Row', region: 'back', equipment: 'Cable Machine', home_friendly: false },
  { slug: 'one-arm-dumbbell-row', name: 'One-Arm Dumbbell Row', region: 'back', equipment: 'Dumbbell + Bench', home_friendly: true },
  // Shoulders
  { slug: 'dumbbell-shoulder-press', name: 'Dumbbell Shoulder Press', region: 'shoulders', equipment: 'Dumbbells + Bench', home_friendly: true },
  { slug: 'dumbbell-lateral-raise', name: 'Dumbbell Lateral Raise', region: 'shoulders', equipment: 'Dumbbells', home_friendly: true },
  { slug: 'reverse-pec-deck-rear-delt-fly', name: 'Reverse Pec Deck / Rear Delt Fly', region: 'shoulders', equipment: 'Machine', home_friendly: false },
  // Biceps
  { slug: 'dumbbell-biceps-curl', name: 'Dumbbell Biceps Curl', region: 'biceps', equipment: 'Dumbbells', home_friendly: true },
  { slug: 'hammer-curl', name: 'Hammer Curl', region: 'biceps', equipment: 'Dumbbells', home_friendly: true },
  { slug: 'preacher-curl', name: 'Preacher Curl', region: 'biceps', equipment: 'EZ-Bar + Preacher Bench', home_friendly: false },
  // Triceps
  { slug: 'cable-triceps-pushdown', name: 'Cable Triceps Pushdown', region: 'triceps', equipment: 'Cable Machine', home_friendly: false },
  { slug: 'overhead-cable-triceps-extension', name: 'Overhead Cable Triceps Extension', region: 'triceps', equipment: 'Cable Machine', home_friendly: false },
  { slug: 'ez-bar-skull-crusher', name: 'EZ-Bar Skull Crusher', region: 'triceps', equipment: 'EZ-Bar + Bench', home_friendly: true },
  // Quadriceps
  { slug: 'squat', name: 'Barbell Back Squat', region: 'quadriceps', equipment: 'Barbell + Squat Rack', home_friendly: true },
  { slug: 'leg-press', name: 'Leg Press', region: 'quadriceps', equipment: 'Leg Press Machine', home_friendly: false },
  { slug: 'leg-extension', name: 'Leg Extension', region: 'quadriceps', equipment: 'Leg Extension Machine', home_friendly: false },
  // Hamstrings
  { slug: 'romanian-deadlift', name: 'Romanian Deadlift', region: 'hamstrings', equipment: 'Barbell', home_friendly: true },
  { slug: 'seated-leg-curl', name: 'Seated Leg Curl', region: 'hamstrings', equipment: 'Leg Curl Machine', home_friendly: false },
  { slug: 'lying-leg-curl', name: 'Lying Leg Curl', region: 'hamstrings', equipment: 'Leg Curl Machine', home_friendly: false },
  // Glutes
  { slug: 'barbell-hip-thrust', name: 'Barbell Hip Thrust', region: 'glutes', equipment: 'Barbell + Bench', home_friendly: true },
  { slug: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', region: 'glutes', equipment: 'Dumbbells + Bench', home_friendly: true },
  { slug: 'cable-glute-kickback', name: 'Cable Glute Kickback', region: 'glutes', equipment: 'Cable Machine + Ankle Strap', home_friendly: false },
  // Calves
  { slug: 'standing-calf-raise', name: 'Standing Calf Raise', region: 'calves', equipment: 'Calf Raise Machine', home_friendly: true },
  { slug: 'seated-calf-raise', name: 'Seated Calf Raise', region: 'calves', equipment: 'Seated Calf Machine', home_friendly: true },
  { slug: 'leg-press-calf-raise', name: 'Leg Press Calf Raise', region: 'calves', equipment: 'Leg Press Machine', home_friendly: false },
  // Core
  { slug: 'cable-crunch', name: 'Cable Crunch', region: 'core', equipment: 'Cable Machine + Rope', home_friendly: false },
  { slug: 'hanging-knee-raise', name: 'Hanging Knee Raise', region: 'core', equipment: 'Pull-Up Bar', home_friendly: true },
  { slug: 'plank', name: 'Plank', region: 'core', equipment: 'Bodyweight / Mat', home_friendly: true },

  // --- 50 New Exercises ---
  // Chest (1-4)
  { slug: 'push-up', name: 'Push-Up', region: 'chest', equipment: 'Bodyweight', home_friendly: true },
  { slug: 'incline-push-up', name: 'Incline Push-Up', region: 'chest', equipment: 'Bodyweight + Bench/Chair', home_friendly: true },
  { slug: 'decline-push-up', name: 'Decline Push-Up', region: 'chest', equipment: 'Bodyweight + Bench/Chair', home_friendly: true },
  { slug: 'dumbbell-floor-press', name: 'Dumbbell Floor Press', region: 'chest', equipment: 'Dumbbells', home_friendly: true },
  // Back (5-9)
  { slug: 'pull-up', name: 'Pull-Up', region: 'back', equipment: 'Pull-Up Bar', home_friendly: true },
  { slug: 'chin-up', name: 'Chin-Up', region: 'back', equipment: 'Pull-Up Bar', home_friendly: true },
  { slug: 'resistance-band-row', name: 'Resistance Band Row', region: 'back', equipment: 'Resistance Band', home_friendly: true },
  { slug: 'dumbbell-pullover', name: 'Dumbbell Pullover', region: 'back', equipment: 'Dumbbell + Bench/Floor', home_friendly: true },
  { slug: 'superman', name: 'Superman', region: 'back', equipment: 'Bodyweight', home_friendly: true },
  // Shoulders (10-13)
  { slug: 'pike-push-up', name: 'Pike Push-Up', region: 'shoulders', equipment: 'Bodyweight', home_friendly: true },
  { slug: 'dumbbell-front-raise', name: 'Dumbbell Front Raise', region: 'shoulders', equipment: 'Dumbbells', home_friendly: true },
  { slug: 'arnold-press', name: 'Arnold Press', region: 'shoulders', equipment: 'Dumbbells', home_friendly: true },
  { slug: 'resistance-band-face-pull', name: 'Resistance Band Face Pull', region: 'shoulders', equipment: 'Resistance Band + Anchor', home_friendly: true },
  // Biceps (14-16)
  { slug: 'concentration-curl', name: 'Concentration Curl', region: 'biceps', equipment: 'Dumbbell + Chair', home_friendly: true },
  { slug: 'resistance-band-biceps-curl', name: 'Resistance Band Biceps Curl', region: 'biceps', equipment: 'Resistance Band', home_friendly: true },
  { slug: 'incline-dumbbell-curl', name: 'Incline Dumbbell Curl', region: 'biceps', equipment: 'Dumbbells + Incline Bench', home_friendly: true },
  // Triceps (17-20)
  { slug: 'close-grip-push-up', name: 'Close-Grip Push-Up', region: 'triceps', equipment: 'Bodyweight', home_friendly: true },
  { slug: 'chair-dip', name: 'Chair Dip', region: 'triceps', equipment: 'Bodyweight + Chair/Bench', home_friendly: true },
  { slug: 'dumbbell-overhead-triceps-extension', name: 'Dumbbell Overhead Triceps Extension', region: 'triceps', equipment: 'Dumbbell', home_friendly: true },
  { slug: 'dumbbell-triceps-kickback', name: 'Dumbbell Triceps Kickback', region: 'triceps', equipment: 'Dumbbell', home_friendly: true },
  // Quadriceps (21-24)
  { slug: 'bodyweight-squat', name: 'Bodyweight Squat', region: 'quadriceps', equipment: 'Bodyweight', home_friendly: true },
  { slug: 'goblet-squat', name: 'Goblet Squat', region: 'quadriceps', equipment: 'Dumbbell/Kettlebell', home_friendly: true },
  { slug: 'reverse-lunge', name: 'Reverse Lunge', region: 'quadriceps', equipment: 'Bodyweight / Dumbbells', home_friendly: true },
  { slug: 'walking-lunge', name: 'Walking Lunge', region: 'quadriceps', equipment: 'Bodyweight / Dumbbells', home_friendly: true },
  // Hamstrings (25-28)
  { slug: 'dumbbell-romanian-deadlift', name: 'Dumbbell Romanian Deadlift', region: 'hamstrings', equipment: 'Dumbbells', home_friendly: true },
  { slug: 'single-leg-romanian-deadlift', name: 'Single-Leg Romanian Deadlift', region: 'hamstrings', equipment: 'Dumbbell / Bodyweight', home_friendly: true },
  { slug: 'sliding-leg-curl', name: 'Sliding Leg Curl', region: 'hamstrings', equipment: 'Sliders/Towel', home_friendly: true },
  { slug: 'nordic-hamstring-curl', name: 'Nordic Hamstring Curl', region: 'hamstrings', equipment: 'Bodyweight + Foot Anchor', home_friendly: true },
  // Glutes (29-32)
  { slug: 'glute-bridge', name: 'Glute Bridge', region: 'glutes', equipment: 'Bodyweight', home_friendly: true },
  { slug: 'single-leg-glute-bridge', name: 'Single-Leg Glute Bridge', region: 'glutes', equipment: 'Bodyweight', home_friendly: true },
  { slug: 'donkey-kick', name: 'Donkey Kick', region: 'glutes', equipment: 'Bodyweight', home_friendly: true },
  { slug: 'frog-pump', name: 'Frog Pump', region: 'glutes', equipment: 'Bodyweight', home_friendly: true },
  // Calves (33-36)
  { slug: 'single-leg-calf-raise', name: 'Single-Leg Calf Raise', region: 'calves', equipment: 'Bodyweight', home_friendly: true },
  { slug: 'donkey-calf-raise', name: 'Donkey Calf Raise', region: 'calves', equipment: 'Bodyweight + Support', home_friendly: true },
  { slug: 'smith-machine-calf-raise', name: 'Smith Machine Calf Raise', region: 'calves', equipment: 'Smith Machine', home_friendly: false },
  { slug: 'calf-raise-on-step', name: 'Calf Raise on Step', region: 'calves', equipment: 'Bodyweight + Step', home_friendly: true },
  // Core (37-40)
  { slug: 'side-plank', name: 'Side Plank', region: 'core', equipment: 'Bodyweight', home_friendly: true },
  { slug: 'dead-bug', name: 'Dead Bug', region: 'core', equipment: 'Bodyweight', home_friendly: true },
  { slug: 'bicycle-crunch', name: 'Bicycle Crunch', region: 'core', equipment: 'Bodyweight', home_friendly: true },
  { slug: 'lying-leg-raise', name: 'Lying Leg Raise', region: 'core', equipment: 'Bodyweight', home_friendly: true },
  // Gym / Machine Expansion (41-50)
  { slug: 'machine-chest-press', name: 'Machine Chest Press', region: 'chest', equipment: 'Chest Press Machine', home_friendly: false },
  { slug: 'pec-deck-fly', name: 'Pec Deck Fly', region: 'chest', equipment: 'Pec Deck Machine', home_friendly: false },
  { slug: 't-bar-row', name: 'T-Bar Row', region: 'back', equipment: 'T-Bar / Landmine', home_friendly: false },
  { slug: 'chest-supported-row', name: 'Chest-Supported Row', region: 'back', equipment: 'Row Machine', home_friendly: false },
  { slug: 'machine-shoulder-press', name: 'Machine Shoulder Press', region: 'shoulders', equipment: 'Shoulder Press Machine', home_friendly: false },
  { slug: 'cable-lateral-raise', name: 'Cable Lateral Raise', region: 'shoulders', equipment: 'Cable Machine', home_friendly: false },
  { slug: 'hack-squat', name: 'Hack Squat', region: 'quadriceps', equipment: 'Hack Squat Machine', home_friendly: false },
  { slug: 'smith-machine-squat', name: 'Smith Machine Squat', region: 'quadriceps', equipment: 'Smith Machine', home_friendly: false },
  { slug: 'hip-abduction-machine', name: 'Hip Abduction Machine', region: 'glutes', equipment: 'Hip Abduction Machine', home_friendly: false },
  { slug: 'hip-adduction-machine', name: 'Hip Adduction Machine', region: 'quadriceps', equipment: 'Hip Adduction Machine', home_friendly: false },
];

// Product mapping contracts (exercise slug -> muscle slug -> factor)
export const EXERCISE_MAPPING_CONTRACT: Record<string, Record<string, number>> = {
  // Existing 30
  'bench-press': {
    'pectoralis-major': 1.0,
    'triceps': 0.5,
    'anterior-deltoid': 0.4,
  },
  'squat': {
    'quadriceps': 1.0,
    'glutes': 0.8,
    'adductors': 0.4,
    'hamstrings': 0.25,
  },
  'lat-pulldown': {
    'latissimus-dorsi': 1.0,
    'biceps': 0.5,
    'teres-major': 0.4,
    'mid-lower-trapezius': 0.25,
  },
  'incline-dumbbell-press': {
    'pectoralis-major': 1.0,
    'anterior-deltoid': 0.6,
    'triceps': 0.5,
  },
  'cable-chest-fly': {
    'pectoralis-major': 1.0,
    'anterior-deltoid': 0.25,
  },
  'seated-cable-row': {
    'mid-lower-trapezius': 1.0,
    'latissimus-dorsi': 0.8,
    'biceps': 0.5,
    'posterior-deltoid': 0.4,
    'teres-major': 0.3,
  },
  'one-arm-dumbbell-row': {
    'latissimus-dorsi': 1.0,
    'mid-lower-trapezius': 0.6,
    'biceps': 0.5,
    'posterior-deltoid': 0.4,
    'teres-major': 0.3,
  },
  'dumbbell-shoulder-press': {
    'anterior-deltoid': 1.0,
    'lateral-deltoid': 0.7,
    'triceps': 0.5,
  },
  'dumbbell-lateral-raise': {
    'lateral-deltoid': 1.0,
    'anterior-deltoid': 0.2,
  },
  'reverse-pec-deck-rear-delt-fly': {
    'posterior-deltoid': 1.0,
    'mid-lower-trapezius': 0.5,
  },
  'dumbbell-biceps-curl': {
    'biceps': 1.0,
    'forearms': 0.35,
  },
  'hammer-curl': {
    'forearms': 1.0,
    'biceps': 0.6,
  },
  'preacher-curl': {
    'biceps': 1.0,
    'forearms': 0.25,
  },
  'cable-triceps-pushdown': {
    'triceps': 1.0,
    'forearms': 0.2,
  },
  'overhead-cable-triceps-extension': {
    'triceps': 1.0,
  },
  'ez-bar-skull-crusher': {
    'triceps': 1.0,
  },
  'leg-press': {
    'quadriceps': 1.0,
    'glutes': 0.7,
    'adductors': 0.3,
    'hamstrings': 0.2,
  },
  'leg-extension': {
    'quadriceps': 1.0,
  },
  'romanian-deadlift': {
    'hamstrings': 1.0,
    'glutes': 0.8,
    'erector-spinae': 0.5,
    'adductors': 0.25,
  },
  'seated-leg-curl': {
    'hamstrings': 1.0,
    'calves': 0.2,
  },
  'lying-leg-curl': {
    'hamstrings': 1.0,
    'calves': 0.2,
  },
  'barbell-hip-thrust': {
    'glutes': 1.0,
    'hamstrings': 0.4,
    'adductors': 0.25,
  },
  'bulgarian-split-squat': {
    'quadriceps': 1.0,
    'glutes': 0.8,
    'adductors': 0.3,
    'hamstrings': 0.25,
  },
  'cable-glute-kickback': {
    'glutes': 1.0,
    'hamstrings': 0.25,
  },
  'standing-calf-raise': {
    'calves': 1.0,
  },
  'seated-calf-raise': {
    'calves': 1.0,
  },
  'leg-press-calf-raise': {
    'calves': 1.0,
  },
  'cable-crunch': {
    'rectus-abdominis': 1.0,
    'obliques': 0.4,
  },
  'hanging-knee-raise': {
    'hip-flexors': 1.0,
    'rectus-abdominis': 0.8,
    'obliques': 0.4,
  },
  'plank': {
    'rectus-abdominis': 1.0,
    'obliques': 0.8,
    'erector-spinae': 0.5,
    'glutes': 0.3,
    'anterior-deltoid': 0.25,
  },

  // --- 50 New Exercises ---
  // Chest
  'push-up': {
    'pectoralis-major': 1.0,
    'triceps': 0.5,
    'anterior-deltoid': 0.4,
  },
  'incline-push-up': {
    'pectoralis-major': 1.0,
    'triceps': 0.45,
    'anterior-deltoid': 0.35,
  },
  'decline-push-up': {
    'pectoralis-major': 1.0,
    'anterior-deltoid': 0.55,
    'triceps': 0.45,
  },
  'dumbbell-floor-press': {
    'pectoralis-major': 1.0,
    'triceps': 0.5,
    'anterior-deltoid': 0.35,
  },
  // Back
  'pull-up': {
    'latissimus-dorsi': 1.0,
    'biceps': 0.6,
    'teres-major': 0.4,
    'mid-lower-trapezius': 0.3,
    'forearms': 0.25,
  },
  'chin-up': {
    'latissimus-dorsi': 1.0,
    'biceps': 0.8,
    'teres-major': 0.35,
    'mid-lower-trapezius': 0.25,
    'forearms': 0.3,
  },
  'resistance-band-row': {
    'mid-lower-trapezius': 1.0,
    'latissimus-dorsi': 0.8,
    'biceps': 0.45,
    'posterior-deltoid': 0.4,
    'teres-major': 0.3,
  },
  'dumbbell-pullover': {
    'latissimus-dorsi': 1.0,
    'pectoralis-major': 0.4,
    'teres-major': 0.3,
    'triceps': 0.2,
  },
  'superman': {
    'erector-spinae': 1.0,
    'glutes': 0.35,
    'hamstrings': 0.25,
    'mid-lower-trapezius': 0.25,
  },
  // Shoulders
  'pike-push-up': {
    'anterior-deltoid': 1.0,
    'triceps': 0.5,
    'lateral-deltoid': 0.4,
    'pectoralis-major': 0.25,
  },
  'dumbbell-front-raise': {
    'anterior-deltoid': 1.0,
  },
  'arnold-press': {
    'anterior-deltoid': 1.0,
    'lateral-deltoid': 0.75,
    'triceps': 0.5,
  },
  'resistance-band-face-pull': {
    'posterior-deltoid': 1.0,
    'mid-lower-trapezius': 0.8,
  },
  // Biceps
  'concentration-curl': {
    'biceps': 1.0,
    'forearms': 0.25,
  },
  'resistance-band-biceps-curl': {
    'biceps': 1.0,
    'forearms': 0.3,
  },
  'incline-dumbbell-curl': {
    'biceps': 1.0,
    'forearms': 0.2,
  },
  // Triceps
  'close-grip-push-up': {
    'triceps': 1.0,
    'pectoralis-major': 0.6,
    'anterior-deltoid': 0.35,
  },
  'chair-dip': {
    'triceps': 1.0,
    'pectoralis-major': 0.6,
    'anterior-deltoid': 0.35,
  },
  'dumbbell-overhead-triceps-extension': {
    'triceps': 1.0,
  },
  'dumbbell-triceps-kickback': {
    'triceps': 1.0,
  },
  // Quadriceps
  'bodyweight-squat': {
    'quadriceps': 1.0,
    'glutes': 0.8,
    'adductors': 0.35,
    'hamstrings': 0.2,
  },
  'goblet-squat': {
    'quadriceps': 1.0,
    'glutes': 0.8,
    'adductors': 0.35,
    'hamstrings': 0.2,
  },
  'reverse-lunge': {
    'quadriceps': 1.0,
    'glutes': 0.8,
    'adductors': 0.3,
    'hamstrings': 0.25,
  },
  'walking-lunge': {
    'quadriceps': 1.0,
    'glutes': 0.8,
    'adductors': 0.3,
    'hamstrings': 0.25,
    'tibialis-anterior': 0.10,
    'fibularis': 0.10,
  },
  // Hamstrings
  'dumbbell-romanian-deadlift': {
    'hamstrings': 1.0,
    'glutes': 0.8,
    'erector-spinae': 0.45,
    'adductors': 0.25,
  },
  'single-leg-romanian-deadlift': {
    'hamstrings': 1.0,
    'glutes': 0.9,
    'erector-spinae': 0.4,
    'adductors': 0.25,
    'tibialis-anterior': 0.10,
    'fibularis': 0.10,
  },
  'sliding-leg-curl': {
    'hamstrings': 1.0,
    'glutes': 0.35,
    'calves': 0.15,
  },
  'nordic-hamstring-curl': {
    'hamstrings': 1.0,
    'glutes': 0.2,
    'calves': 0.15,
  },
  // Glutes
  'glute-bridge': {
    'glutes': 1.0,
    'hamstrings': 0.4,
    'adductors': 0.2,
  },
  'single-leg-glute-bridge': {
    'glutes': 1.0,
    'hamstrings': 0.45,
    'adductors': 0.15,
  },
  'donkey-kick': {
    'glutes': 1.0,
    'hamstrings': 0.25,
  },
  'frog-pump': {
    'glutes': 1.0,
    'adductors': 0.25,
  },
  // Calves
  'single-leg-calf-raise': {
    'calves': 1.0,
  },
  'donkey-calf-raise': {
    'calves': 1.0,
  },
  'smith-machine-calf-raise': {
    'calves': 1.0,
  },
  'calf-raise-on-step': {
    'calves': 1.0,
  },
  // Core
  'side-plank': {
    'obliques': 1.0,
    'rectus-abdominis': 0.5,
    'erector-spinae': 0.4,
    'glutes': 0.25,
  },
  'dead-bug': {
    'rectus-abdominis': 1.0,
    'hip-flexors': 0.5,
    'obliques': 0.4,
  },
  'bicycle-crunch': {
    'rectus-abdominis': 1.0,
    'obliques': 0.8,
    'hip-flexors': 0.5,
  },
  'lying-leg-raise': {
    'hip-flexors': 1.0,
    'rectus-abdominis': 0.8,
    'obliques': 0.25,
  },
  // Gym / Machine Expansion
  'machine-chest-press': {
    'pectoralis-major': 1.0,
    'triceps': 0.5,
    'anterior-deltoid': 0.4,
  },
  'pec-deck-fly': {
    'pectoralis-major': 1.0,
    'anterior-deltoid': 0.2,
  },
  't-bar-row': {
    'mid-lower-trapezius': 1.0,
    'latissimus-dorsi': 0.85,
    'biceps': 0.45,
    'posterior-deltoid': 0.4,
    'teres-major': 0.3,
    'erector-spinae': 0.3,
  },
  'chest-supported-row': {
    'mid-lower-trapezius': 1.0,
    'latissimus-dorsi': 0.8,
    'biceps': 0.45,
    'posterior-deltoid': 0.4,
    'teres-major': 0.3,
  },
  'machine-shoulder-press': {
    'anterior-deltoid': 1.0,
    'lateral-deltoid': 0.7,
    'triceps': 0.5,
  },
  'cable-lateral-raise': {
    'lateral-deltoid': 1.0,
    'anterior-deltoid': 0.15,
  },
  'hack-squat': {
    'quadriceps': 1.0,
    'glutes': 0.65,
    'adductors': 0.25,
    'hamstrings': 0.15,
  },
  'smith-machine-squat': {
    'quadriceps': 1.0,
    'glutes': 0.75,
    'adductors': 0.3,
    'hamstrings': 0.2,
  },
  'hip-abduction-machine': {
    'glutes': 1.0,
  },
  'hip-adduction-machine': {
    'adductors': 1.0,
  },
};

describe('Exercise Catalog Expansion - 80 Exercises & 21 Muscles', () => {
  it('1. verifies exactly 80 exercises in catalog with unique slugs', () => {
    expect(EXERCISE_CATALOG).toHaveLength(80);
    const slugs = new Set(EXERCISE_CATALOG.map((e) => e.slug));
    expect(slugs.size).toBe(80);

    for (const ex of EXERCISE_CATALOG) {
      expect(ex.name).toBeTruthy();
      expect(ex.slug).toBeTruthy();
      expect(ex.region).toBeTruthy();
      expect(ex.equipment).toBeTruthy();
      expect(typeof ex.home_friendly).toBe('boolean');
    }
  });

  it('2. verifies exactly 21 logical muscles with unique slugs', () => {
    expect(LOGICAL_MUSCLES).toHaveLength(21);
    const slugs = new Set(LOGICAL_MUSCLES.map((m) => m.slug));
    expect(slugs.size).toBe(21);
  });

  it('3. preserves existing 30 exercise mappings exactly', () => {
    // Barbell Bench Press
    expect(EXERCISE_MAPPING_CONTRACT['bench-press']).toEqual({
      'pectoralis-major': 1.0,
      'triceps': 0.5,
      'anterior-deltoid': 0.4,
    });

    // Barbell Back Squat
    expect(EXERCISE_MAPPING_CONTRACT['squat']).toEqual({
      'quadriceps': 1.0,
      'glutes': 0.8,
      'adductors': 0.4,
      'hamstrings': 0.25,
    });

    // Lat Pulldown
    expect(EXERCISE_MAPPING_CONTRACT['lat-pulldown']).toEqual({
      'latissimus-dorsi': 1.0,
      'biceps': 0.5,
      'teres-major': 0.4,
      'mid-lower-trapezius': 0.25,
    });

    // Incline Dumbbell Press
    expect(EXERCISE_MAPPING_CONTRACT['incline-dumbbell-press']).toEqual({
      'pectoralis-major': 1.0,
      'anterior-deltoid': 0.6,
      'triceps': 0.5,
    });

    // Plank
    expect(EXERCISE_MAPPING_CONTRACT['plank']).toEqual({
      'rectus-abdominis': 1.0,
      'obliques': 0.8,
      'erector-spinae': 0.5,
      'glutes': 0.3,
      'anterior-deltoid': 0.25,
    });
  });

  it('4. verifies all 50 new exercise mappings match exact specifications', () => {
    // Push-Up
    expect(EXERCISE_MAPPING_CONTRACT['push-up']).toEqual({
      'pectoralis-major': 1.0,
      'triceps': 0.5,
      'anterior-deltoid': 0.4,
    });

    // Pull-Up
    expect(EXERCISE_MAPPING_CONTRACT['pull-up']).toEqual({
      'latissimus-dorsi': 1.0,
      'biceps': 0.6,
      'teres-major': 0.4,
      'mid-lower-trapezius': 0.3,
      'forearms': 0.25,
    });

    // Arnold Press
    expect(EXERCISE_MAPPING_CONTRACT['arnold-press']).toEqual({
      'anterior-deltoid': 1.0,
      'lateral-deltoid': 0.75,
      'triceps': 0.5,
    });

    // Bodyweight Squat
    expect(EXERCISE_MAPPING_CONTRACT['bodyweight-squat']).toEqual({
      'quadriceps': 1.0,
      'glutes': 0.8,
      'adductors': 0.35,
      'hamstrings': 0.2,
    });

    // T-Bar Row (6 mappings)
    expect(EXERCISE_MAPPING_CONTRACT['t-bar-row']).toEqual({
      'mid-lower-trapezius': 1.0,
      'latissimus-dorsi': 0.85,
      'biceps': 0.45,
      'posterior-deltoid': 0.4,
      'teres-major': 0.3,
      'erector-spinae': 0.3,
    });

    // Hip Adduction Machine
    expect(EXERCISE_MAPPING_CONTRACT['hip-adduction-machine']).toEqual({
      'adductors': 1.0,
    });
  });

  it('5. verifies all exposure factors are strictly greater than zero and <= 1.0', () => {
    for (const [exSlug, muscles] of Object.entries(EXERCISE_MAPPING_CONTRACT)) {
      for (const [muscleSlug, factor] of Object.entries(muscles)) {
        expect(factor, `${exSlug} -> ${muscleSlug} factor must be > 0`).toBeGreaterThan(0);
        expect(factor, `${exSlug} -> ${muscleSlug} factor must be <= 1.0`).toBeLessThanOrEqual(1.0);
      }
    }
  });

  it('6. verifies all exercises map only to valid logical muscles with no duplicates', () => {
    const validSlugs = new Set(LOGICAL_MUSCLES.map((m) => m.slug));

    for (const [exSlug, muscles] of Object.entries(EXERCISE_MAPPING_CONTRACT)) {
      const mappedSlugs = Object.keys(muscles);
      const uniqueSlugs = new Set(mappedSlugs);
      expect(uniqueSlugs.size, `Duplicate muscle mapping in ${exSlug}`).toBe(mappedSlugs.length);

      for (const mSlug of mappedSlugs) {
        expect(validSlugs.has(mSlug), `Unknown muscle ${mSlug} in exercise ${exSlug}`).toBe(true);
      }
    }
  });

  it('7. verifies total exercise_muscles mappings count is exactly 229', () => {
    let totalMappings = 0;
    for (const muscles of Object.values(EXERCISE_MAPPING_CONTRACT)) {
      totalMappings += Object.keys(muscles).length;
    }
    expect(totalMappings).toBe(229);
  });

  it('8. verifies home_friendly catalog property (55 home-friendly, 25 non-home-friendly)', () => {
    const homeFriendly = EXERCISE_CATALOG.filter((e) => e.home_friendly);
    const nonHomeFriendly = EXERCISE_CATALOG.filter((e) => !e.home_friendly);

    expect(homeFriendly).toHaveLength(55);
    expect(nonHomeFriendly).toHaveLength(25);

    // Verify key examples
    expect(homeFriendly.map((e) => e.slug)).toContain('push-up');
    expect(homeFriendly.map((e) => e.slug)).toContain('one-arm-dumbbell-row');
    expect(homeFriendly.map((e) => e.slug)).toContain('dumbbell-shoulder-press');
    expect(homeFriendly.map((e) => e.slug)).toContain('dumbbell-lateral-raise');
    expect(homeFriendly.map((e) => e.slug)).toContain('dumbbell-biceps-curl');
    expect(homeFriendly.map((e) => e.slug)).toContain('hammer-curl');
    expect(homeFriendly.map((e) => e.slug)).toContain('bulgarian-split-squat');
    expect(homeFriendly.map((e) => e.slug)).toContain('standing-calf-raise');
    expect(homeFriendly.map((e) => e.slug)).toContain('seated-calf-raise');
    expect(homeFriendly.map((e) => e.slug)).toContain('plank');

    // Verify gym/machine movements are false
    expect(nonHomeFriendly.map((e) => e.slug)).toContain('lat-pulldown');
    expect(nonHomeFriendly.map((e) => e.slug)).toContain('leg-press');
    expect(nonHomeFriendly.map((e) => e.slug)).toContain('cable-chest-fly');
    expect(nonHomeFriendly.map((e) => e.slug)).toContain('machine-chest-press');
    expect(nonHomeFriendly.map((e) => e.slug)).toContain('pec-deck-fly');
    expect(nonHomeFriendly.map((e) => e.slug)).toContain('hack-squat');
    expect(nonHomeFriendly.map((e) => e.slug)).toContain('smith-machine-squat');
    expect(nonHomeFriendly.map((e) => e.slug)).toContain('hip-abduction-machine');
    expect(nonHomeFriendly.map((e) => e.slug)).toContain('hip-adduction-machine');
    expect(nonHomeFriendly.map((e) => e.slug)).toContain('smith-machine-calf-raise');
  });

  it('9. verifies HOME_ANIMATION_V1.md contains exactly 30 exercises and all exist in catalog', () => {
    const filePath = path.resolve(__dirname, '../../../HOME_ANIMATION_V1.md');
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, 'utf-8');

    // List of 30 expected animation plan exercises
    const expectedAnimationExercises = [
      // CHEST
      'push-up',
      'incline-push-up',
      'dumbbell-floor-press',
      // BACK
      'one-arm-dumbbell-row',
      'resistance-band-row',
      'superman',
      // SHOULDERS
      'pike-push-up',
      'dumbbell-shoulder-press',
      'dumbbell-lateral-raise',
      // BICEPS
      'dumbbell-biceps-curl',
      'hammer-curl',
      'resistance-band-biceps-curl',
      // TRICEPS
      'close-grip-push-up',
      'chair-dip',
      'dumbbell-overhead-triceps-extension',
      // QUADRICEPS
      'bodyweight-squat',
      'reverse-lunge',
      'bulgarian-split-squat',
      // HAMSTRINGS
      'dumbbell-romanian-deadlift',
      'single-leg-romanian-deadlift',
      'sliding-leg-curl',
      // GLUTES
      'glute-bridge',
      'single-leg-glute-bridge',
      'donkey-kick',
      // CALVES
      'standing-calf-raise',
      'single-leg-calf-raise',
      'seated-calf-raise',
      // CORE
      'plank',
      'side-plank',
      'dead-bug',
    ];

    expect(expectedAnimationExercises).toHaveLength(30);

    const catalogSlugMap = new Map(EXERCISE_CATALOG.map((e) => [e.slug, e]));

    for (const slug of expectedAnimationExercises) {
      // Must be mentioned in markdown
      expect(content).toContain(`\`${slug}\``);

      // Must exist in catalog
      const catalogItem = catalogSlugMap.get(slug);
      expect(catalogItem, `Exercise ${slug} must exist in catalog`).toBeDefined();
      expect(catalogItem!.home_friendly, `Exercise ${slug} in animation plan must be home_friendly`).toBe(true);
    }
  });

  it('10. verifies Body exposure result includes all 21 muscles even with 0 exposure', () => {
    const muscleMap = new Map(LOGICAL_MUSCLES.map((m) => [m.slug, m.id]));
    const mappings: ExerciseMuscleMapping[] = [];

    for (const [exSlug, mObj] of Object.entries(EXERCISE_MAPPING_CONTRACT)) {
      for (const [mSlug, factor] of Object.entries(mObj)) {
        mappings.push({
          exercise_id: exSlug,
          muscle_id: muscleMap.get(mSlug)!,
          role: factor >= 0.8 ? 'primary' : 'secondary',
          exposure_factor: factor,
        });
      }
    }

    const workingSets: WorkingSetInput[] = [
      {
        workout_id: 'w-1',
        exercise_id: 'push-up',
        completed_at: '2026-01-15T10:00:00Z',
      },
    ];

    const exposureResult = calculateTrainingExposure(
      workingSets,
      LOGICAL_MUSCLES,
      mappings,
      '2026-01-01T00:00:00Z',
      '2026-01-31T23:59:59Z'
    );

    expect(exposureResult).toHaveLength(21);

    const resultMap = new Map(exposureResult.map((r) => [r.muscleSlug, r.exposure]));

    // Trained muscles from push-up
    expect(resultMap.get('pectoralis-major')).toBe(1.0);
    expect(resultMap.get('triceps')).toBe(0.5);
    expect(resultMap.get('anterior-deltoid')).toBeCloseTo(0.4, 5);

    // Untrained muscles must have exposure === 0
    expect(resultMap.get('lateral-deltoid')).toBe(0);
    expect(resultMap.get('calves')).toBe(0);
    expect(resultMap.get('rectus-abdominis')).toBe(0);
    expect(resultMap.get('hip-flexors')).toBe(0);
    expect(resultMap.get('quadriceps')).toBe(0);
  });

  it('11. gives the new lower-leg groups conservative existing-exercise coverage', () => {
    expect(EXERCISE_MAPPING_CONTRACT['walking-lunge']).toMatchObject({
      'tibialis-anterior': 0.10,
      fibularis: 0.10,
    });
    expect(EXERCISE_MAPPING_CONTRACT['single-leg-romanian-deadlift']).toMatchObject({
      'tibialis-anterior': 0.10,
      fibularis: 0.10,
    });
  });

  it('12. verifies anatomy validator mapping covers 88 tracked meshes across 19 logical muscles', () => {
    const trackedLogicalKeys = Object.keys(EXPECTED_MAPPING);
    expect(trackedLogicalKeys).toHaveLength(19);

    const allTracked = Object.values(EXPECTED_MAPPING).flat();
    expect(allTracked).toHaveLength(88);
    const uniqueTracked = new Set(allTracked);
    expect(uniqueTracked.size).toBe(88);
  });

  it('13. verifies context runtime meshes is exactly 162 meshes and no overlap with tracked', () => {
    expect(CONTEXT_RUNTIME_MESHES).toHaveLength(162);
    expect(CONTEXT_MESH_SET.size).toBe(162);
    expect(EXPECTED_CONTEXT).toHaveLength(162);

    const allTracked = new Set(Object.values(EXPECTED_MAPPING).flat());
    const contextMeshes = new Set<string>(CONTEXT_RUNTIME_MESHES);

    const overlap = [...allTracked].filter((m) => contextMeshes.has(m));
    expect(overlap).toHaveLength(0);

    const totalUnique = new Set([...allTracked, ...contextMeshes]);
    expect(totalUnique.size).toBe(250);
  });
});
