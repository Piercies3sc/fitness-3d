-- Migration: 0007_expand_exercise_catalog.sql
-- Description: Expand exercise catalog to 30 exercises and logical muscles to 19 tracked groups.

-- 1. Add body_region column to exercises if not exists
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS body_region TEXT;

-- 2. Update existing 3 exercises (preserve their IDs and slugs)
UPDATE public.exercises
SET 
  name = 'Barbell Bench Press',
  equipment = 'Barbell + Bench',
  body_region = 'chest',
  movement_type = 'Horizontal Push',
  updated_at = NOW()
WHERE slug = 'bench-press';

UPDATE public.exercises
SET 
  name = 'Barbell Back Squat',
  equipment = 'Barbell + Squat Rack',
  body_region = 'quadriceps',
  movement_type = 'Squat',
  updated_at = NOW()
WHERE slug = 'squat';

UPDATE public.exercises
SET 
  name = 'Lat Pulldown',
  equipment = 'Cable Machine',
  body_region = 'back',
  movement_type = 'Vertical Pull',
  updated_at = NOW()
WHERE slug = 'lat-pulldown';

-- 3. Insert 27 new exercises
INSERT INTO public.exercises (name, slug, equipment, movement_type, body_region, description)
VALUES
  -- Chest
  ('Incline Dumbbell Press', 'incline-dumbbell-press', 'Dumbbells + Incline Bench', 'Incline Push', 'chest', 'An upper-chest focused pressing movement performed with dumbbells on an incline bench.'),
  ('Cable Chest Fly', 'cable-chest-fly', 'Cable Machine', 'Chest Isolation', 'chest', 'An isolation exercise that provides continuous tension through horizontal adduction of the chest.'),

  -- Back
  ('Seated Cable Row', 'seated-cable-row', 'Cable Machine', 'Horizontal Pull', 'back', 'A horizontal cable pulling movement targeting the mid-back, lats, and rhomboids.'),
  ('One-Arm Dumbbell Row', 'one-arm-dumbbell-row', 'Dumbbell + Bench', 'Unilateral Pull', 'back', 'A unilateral rowing exercise that builds lat thickness and core anti-rotational stability.'),

  -- Shoulders
  ('Dumbbell Shoulder Press', 'dumbbell-shoulder-press', 'Dumbbells + Bench', 'Vertical Push', 'shoulders', 'An overhead pressing movement targeting the anterior and lateral deltoids.'),
  ('Dumbbell Lateral Raise', 'dumbbell-lateral-raise', 'Dumbbells', 'Shoulder Isolation', 'shoulders', 'An isolation movement focusing on the lateral deltoid to develop shoulder width.'),
  ('Reverse Pec Deck / Rear Delt Fly', 'reverse-pec-deck-rear-delt-fly', 'Machine', 'Shoulder Isolation', 'shoulders', 'A machine-based fly movement isolating the posterior deltoids and upper back.'),

  -- Biceps
  ('Dumbbell Biceps Curl', 'dumbbell-biceps-curl', 'Dumbbells', 'Elbow Flexion', 'biceps', 'A classic arm exercise targeting the biceps brachii with supination.'),
  ('Hammer Curl', 'hammer-curl', 'Dumbbells', 'Elbow Flexion', 'biceps', 'A neutral-grip curl emphasizing the brachioradialis, brachialis, and biceps.'),
  ('Preacher Curl', 'preacher-curl', 'EZ-Bar + Preacher Bench', 'Elbow Flexion', 'biceps', 'An isolated curl variation that eliminates momentum and emphasizes the short head of the biceps.'),

  -- Triceps
  ('Cable Triceps Pushdown', 'cable-triceps-pushdown', 'Cable Machine', 'Elbow Extension', 'triceps', 'A cable exercise isolating the triceps through elbow extension.'),
  ('Overhead Cable Triceps Extension', 'overhead-cable-triceps-extension', 'Cable Machine', 'Elbow Extension', 'triceps', 'An overhead extension that places the long head of the triceps under a full stretch.'),
  ('EZ-Bar Skull Crusher', 'ez-bar-skull-crusher', 'EZ-Bar + Bench', 'Elbow Extension', 'triceps', 'A lying triceps extension targeting the triceps with an EZ-curl bar.'),

  -- Quadriceps
  ('Leg Press', 'leg-press', 'Leg Press Machine', 'Squat', 'quadriceps', 'A machine-based closed-chain leg exercise allowing heavy loading with back support.'),
  ('Leg Extension', 'leg-extension', 'Leg Extension Machine', 'Knee Extension', 'quadriceps', 'An open-chain isolation exercise that targets all four heads of the quadriceps.'),

  -- Hamstrings
  ('Romanian Deadlift', 'romanian-deadlift', 'Barbell', 'Hip Hinge', 'hamstrings', 'A hip-hinge compound movement targeting the hamstrings, glutes, and posterior chain.'),
  ('Seated Leg Curl', 'seated-leg-curl', 'Leg Curl Machine', 'Knee Flexion', 'hamstrings', 'A machine exercise isolating the hamstrings with hips in flexion for maximum muscle stretch.'),
  ('Lying Leg Curl', 'lying-leg-curl', 'Leg Curl Machine', 'Knee Flexion', 'hamstrings', 'A prone isolation exercise focusing on hamstring knee flexion.'),

  -- Glutes
  ('Barbell Hip Thrust', 'barbell-hip-thrust', 'Barbell + Bench', 'Hip Extension', 'glutes', 'A horizontal hip extension movement that maximizes gluteus maximus tension at peak contraction.'),
  ('Bulgarian Split Squat', 'bulgarian-split-squat', 'Dumbbells + Bench', 'Unilateral Squat', 'glutes', 'A unilateral leg exercise placing heavy emphasis on the front leg glute and quadriceps.'),
  ('Cable Glute Kickback', 'cable-glute-kickback', 'Cable Machine + Ankle Strap', 'Hip Extension', 'glutes', 'An isolation exercise providing continuous resistance for the gluteal muscles.'),

  -- Calves
  ('Standing Calf Raise', 'standing-calf-raise', 'Calf Raise Machine', 'Plantarflexion', 'calves', 'A standing plantarflexion exercise targeting both the gastrocnemius and soleus.'),
  ('Seated Calf Raise', 'seated-calf-raise', 'Seated Calf Machine', 'Plantarflexion', 'calves', 'A seated calf raise with knees flexed, emphasizing the soleus muscle.'),
  ('Leg Press Calf Raise', 'leg-press-calf-raise', 'Leg Press Machine', 'Plantarflexion', 'calves', 'Calf raise performed on a leg press sled with straight legs targeting the gastrocnemius.'),

  -- Core
  ('Cable Crunch', 'cable-crunch', 'Cable Machine + Rope', 'Spinal Flexion', 'core', 'A loaded kneeling crunch using a cable rope to flex the spine against resistance.'),
  ('Hanging Knee Raise', 'hanging-knee-raise', 'Pull-Up Bar', 'Hip/Spine Flexion', 'core', 'A hanging movement targeting the hip flexors and lower rectus abdominis.'),
  ('Plank', 'plank', 'Bodyweight / Mat', 'Isometric Anti-Extension', 'core', 'An isometric core hold developing anterior core and pelvic stability.')
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  equipment = EXCLUDED.equipment,
  movement_type = EXCLUDED.movement_type,
  body_region = EXCLUDED.body_region,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 4. Seed 8 new logical muscles
INSERT INTO public.muscles (name, slug, region)
VALUES
  ('Lateral Deltoid', 'lateral-deltoid', 'Shoulders'),
  ('Posterior Deltoid', 'posterior-deltoid', 'Shoulders'),
  ('Calves', 'calves', 'Legs'),
  ('Rectus Abdominis', 'rectus-abdominis', 'Core'),
  ('Obliques', 'obliques', 'Core'),
  ('Erector Spinae', 'erector-spinae', 'Back'),
  ('Forearms', 'forearms', 'Arms'),
  ('Hip Flexors', 'hip-flexors', 'Hips')
ON CONFLICT (slug) DO NOTHING;

-- 5. Seed exercise_muscles mappings
DO $$
DECLARE
  ex_incline_db UUID;
  ex_cable_fly UUID;
  ex_seated_row UUID;
  ex_db_row UUID;
  ex_db_shoulder UUID;
  ex_db_lat_raise UUID;
  ex_reverse_pec UUID;
  ex_db_curl UUID;
  ex_hammer_curl UUID;
  ex_preacher_curl UUID;
  ex_cable_pushdown UUID;
  ex_overhead_ext UUID;
  ex_skull_crusher UUID;
  ex_leg_press UUID;
  ex_leg_ext UUID;
  ex_rdl UUID;
  ex_seated_curl UUID;
  ex_lying_curl UUID;
  ex_hip_thrust UUID;
  ex_bulgarian UUID;
  ex_cable_kickback UUID;
  ex_standing_calf UUID;
  ex_seated_calf UUID;
  ex_lp_calf UUID;
  ex_cable_crunch UUID;
  ex_hanging_knee UUID;
  ex_plank UUID;

  m_pec_major UUID;
  m_triceps UUID;
  m_ant_delt UUID;
  m_quads UUID;
  m_glutes UUID;
  m_adductors UUID;
  m_hamstrings UUID;
  m_lats UUID;
  m_biceps UUID;
  m_teres_major UUID;
  m_traps UUID;
  m_lat_delt UUID;
  m_post_delt UUID;
  m_calves UUID;
  m_rectus_abd UUID;
  m_obliques UUID;
  m_erector UUID;
  m_forearms UUID;
  m_hip_flexors UUID;
BEGIN
  -- Exercises
  SELECT id INTO ex_incline_db FROM public.exercises WHERE slug = 'incline-dumbbell-press';
  SELECT id INTO ex_cable_fly FROM public.exercises WHERE slug = 'cable-chest-fly';
  SELECT id INTO ex_seated_row FROM public.exercises WHERE slug = 'seated-cable-row';
  SELECT id INTO ex_db_row FROM public.exercises WHERE slug = 'one-arm-dumbbell-row';
  SELECT id INTO ex_db_shoulder FROM public.exercises WHERE slug = 'dumbbell-shoulder-press';
  SELECT id INTO ex_db_lat_raise FROM public.exercises WHERE slug = 'dumbbell-lateral-raise';
  SELECT id INTO ex_reverse_pec FROM public.exercises WHERE slug = 'reverse-pec-deck-rear-delt-fly';
  SELECT id INTO ex_db_curl FROM public.exercises WHERE slug = 'dumbbell-biceps-curl';
  SELECT id INTO ex_hammer_curl FROM public.exercises WHERE slug = 'hammer-curl';
  SELECT id INTO ex_preacher_curl FROM public.exercises WHERE slug = 'preacher-curl';
  SELECT id INTO ex_cable_pushdown FROM public.exercises WHERE slug = 'cable-triceps-pushdown';
  SELECT id INTO ex_overhead_ext FROM public.exercises WHERE slug = 'overhead-cable-triceps-extension';
  SELECT id INTO ex_skull_crusher FROM public.exercises WHERE slug = 'ez-bar-skull-crusher';
  SELECT id INTO ex_leg_press FROM public.exercises WHERE slug = 'leg-press';
  SELECT id INTO ex_leg_ext FROM public.exercises WHERE slug = 'leg-extension';
  SELECT id INTO ex_rdl FROM public.exercises WHERE slug = 'romanian-deadlift';
  SELECT id INTO ex_seated_curl FROM public.exercises WHERE slug = 'seated-leg-curl';
  SELECT id INTO ex_lying_curl FROM public.exercises WHERE slug = 'lying-leg-curl';
  SELECT id INTO ex_hip_thrust FROM public.exercises WHERE slug = 'barbell-hip-thrust';
  SELECT id INTO ex_bulgarian FROM public.exercises WHERE slug = 'bulgarian-split-squat';
  SELECT id INTO ex_cable_kickback FROM public.exercises WHERE slug = 'cable-glute-kickback';
  SELECT id INTO ex_standing_calf FROM public.exercises WHERE slug = 'standing-calf-raise';
  SELECT id INTO ex_seated_calf FROM public.exercises WHERE slug = 'seated-calf-raise';
  SELECT id INTO ex_lp_calf FROM public.exercises WHERE slug = 'leg-press-calf-raise';
  SELECT id INTO ex_cable_crunch FROM public.exercises WHERE slug = 'cable-crunch';
  SELECT id INTO ex_hanging_knee FROM public.exercises WHERE slug = 'hanging-knee-raise';
  SELECT id INTO ex_plank FROM public.exercises WHERE slug = 'plank';

  -- Muscles
  SELECT id INTO m_pec_major FROM public.muscles WHERE slug = 'pectoralis-major';
  SELECT id INTO m_triceps FROM public.muscles WHERE slug = 'triceps';
  SELECT id INTO m_ant_delt FROM public.muscles WHERE slug = 'anterior-deltoid';
  SELECT id INTO m_quads FROM public.muscles WHERE slug = 'quadriceps';
  SELECT id INTO m_glutes FROM public.muscles WHERE slug = 'glutes';
  SELECT id INTO m_adductors FROM public.muscles WHERE slug = 'adductors';
  SELECT id INTO m_hamstrings FROM public.muscles WHERE slug = 'hamstrings';
  SELECT id INTO m_lats FROM public.muscles WHERE slug = 'latissimus-dorsi';
  SELECT id INTO m_biceps FROM public.muscles WHERE slug = 'biceps';
  SELECT id INTO m_teres_major FROM public.muscles WHERE slug = 'teres-major';
  SELECT id INTO m_traps FROM public.muscles WHERE slug = 'mid-lower-trapezius';
  SELECT id INTO m_lat_delt FROM public.muscles WHERE slug = 'lateral-deltoid';
  SELECT id INTO m_post_delt FROM public.muscles WHERE slug = 'posterior-deltoid';
  SELECT id INTO m_calves FROM public.muscles WHERE slug = 'calves';
  SELECT id INTO m_rectus_abd FROM public.muscles WHERE slug = 'rectus-abdominis';
  SELECT id INTO m_obliques FROM public.muscles WHERE slug = 'obliques';
  SELECT id INTO m_erector FROM public.muscles WHERE slug = 'erector-spinae';
  SELECT id INTO m_forearms FROM public.muscles WHERE slug = 'forearms';
  SELECT id INTO m_hip_flexors FROM public.muscles WHERE slug = 'hip-flexors';

  -- Incline Dumbbell Press
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_incline_db, m_pec_major, 'primary', 1.00),
  (ex_incline_db, m_ant_delt, 'secondary', 0.60),
  (ex_incline_db, m_triceps, 'secondary', 0.50)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;

  -- Cable Chest Fly
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_cable_fly, m_pec_major, 'primary', 1.00),
  (ex_cable_fly, m_ant_delt, 'secondary', 0.25)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;

  -- Seated Cable Row
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_seated_row, m_traps, 'primary', 1.00),
  (ex_seated_row, m_lats, 'secondary', 0.80),
  (ex_seated_row, m_biceps, 'secondary', 0.50),
  (ex_seated_row, m_post_delt, 'secondary', 0.40),
  (ex_seated_row, m_teres_major, 'secondary', 0.30)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;

  -- One-Arm Dumbbell Row
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_db_row, m_lats, 'primary', 1.00),
  (ex_db_row, m_traps, 'secondary', 0.60),
  (ex_db_row, m_biceps, 'secondary', 0.50),
  (ex_db_row, m_post_delt, 'secondary', 0.40),
  (ex_db_row, m_teres_major, 'secondary', 0.30)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;

  -- Dumbbell Shoulder Press
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_db_shoulder, m_ant_delt, 'primary', 1.00),
  (ex_db_shoulder, m_lat_delt, 'secondary', 0.70),
  (ex_db_shoulder, m_triceps, 'secondary', 0.50)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;

  -- Dumbbell Lateral Raise
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_db_lat_raise, m_lat_delt, 'primary', 1.00),
  (ex_db_lat_raise, m_ant_delt, 'secondary', 0.20)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;

  -- Reverse Pec Deck / Rear Delt Fly
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_reverse_pec, m_post_delt, 'primary', 1.00),
  (ex_reverse_pec, m_traps, 'secondary', 0.50)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;

  -- Dumbbell Biceps Curl
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_db_curl, m_biceps, 'primary', 1.00),
  (ex_db_curl, m_forearms, 'secondary', 0.35)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;

  -- Hammer Curl
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_hammer_curl, m_forearms, 'primary', 1.00),
  (ex_hammer_curl, m_biceps, 'secondary', 0.60)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;

  -- Preacher Curl
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_preacher_curl, m_biceps, 'primary', 1.00),
  (ex_preacher_curl, m_forearms, 'secondary', 0.25)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;

  -- Cable Triceps Pushdown
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_cable_pushdown, m_triceps, 'primary', 1.00),
  (ex_cable_pushdown, m_forearms, 'secondary', 0.20)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;

  -- Overhead Cable Triceps Extension
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_overhead_ext, m_triceps, 'primary', 1.00)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;

  -- EZ-Bar Skull Crusher
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_skull_crusher, m_triceps, 'primary', 1.00)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;

  -- Leg Press
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_leg_press, m_quads, 'primary', 1.00),
  (ex_leg_press, m_glutes, 'secondary', 0.70),
  (ex_leg_press, m_adductors, 'secondary', 0.30),
  (ex_leg_press, m_hamstrings, 'secondary', 0.20)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;

  -- Leg Extension
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_leg_ext, m_quads, 'primary', 1.00)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;

  -- Romanian Deadlift
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_rdl, m_hamstrings, 'primary', 1.00),
  (ex_rdl, m_glutes, 'secondary', 0.80),
  (ex_rdl, m_erector, 'secondary', 0.50),
  (ex_rdl, m_adductors, 'secondary', 0.25)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;

  -- Seated Leg Curl
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_seated_curl, m_hamstrings, 'primary', 1.00),
  (ex_seated_curl, m_calves, 'secondary', 0.20)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;

  -- Lying Leg Curl
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_lying_curl, m_hamstrings, 'primary', 1.00),
  (ex_lying_curl, m_calves, 'secondary', 0.20)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;

  -- Barbell Hip Thrust
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_hip_thrust, m_glutes, 'primary', 1.00),
  (ex_hip_thrust, m_hamstrings, 'secondary', 0.40),
  (ex_hip_thrust, m_adductors, 'secondary', 0.25)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;

  -- Bulgarian Split Squat
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_bulgarian, m_quads, 'primary', 1.00),
  (ex_bulgarian, m_glutes, 'secondary', 0.80),
  (ex_bulgarian, m_adductors, 'secondary', 0.30),
  (ex_bulgarian, m_hamstrings, 'secondary', 0.25)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;

  -- Cable Glute Kickback
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_cable_kickback, m_glutes, 'primary', 1.00),
  (ex_cable_kickback, m_hamstrings, 'secondary', 0.25)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;

  -- Standing Calf Raise
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_standing_calf, m_calves, 'primary', 1.00)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;

  -- Seated Calf Raise
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_seated_calf, m_calves, 'primary', 1.00)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;

  -- Leg Press Calf Raise
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_lp_calf, m_calves, 'primary', 1.00)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;

  -- Cable Crunch
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_cable_crunch, m_rectus_abd, 'primary', 1.00),
  (ex_cable_crunch, m_obliques, 'secondary', 0.40)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;

  -- Hanging Knee Raise
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_hanging_knee, m_hip_flexors, 'primary', 1.00),
  (ex_hanging_knee, m_rectus_abd, 'secondary', 0.80),
  (ex_hanging_knee, m_obliques, 'secondary', 0.40)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;

  -- Plank
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_plank, m_rectus_abd, 'primary', 1.00),
  (ex_plank, m_obliques, 'secondary', 0.80),
  (ex_plank, m_erector, 'secondary', 0.50),
  (ex_plank, m_glutes, 'secondary', 0.30),
  (ex_plank, m_ant_delt, 'secondary', 0.25)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET role = EXCLUDED.role, exposure_factor = EXCLUDED.exposure_factor;
END $$;

-- 6. Seed 36 promoted muscle_meshes for the 8 new logical muscles
DO $$
DECLARE
  m_lat_delt UUID;
  m_post_delt UUID;
  m_calves UUID;
  m_rectus_abd UUID;
  m_obliques UUID;
  m_erector UUID;
  m_forearms UUID;
  m_hip_flexors UUID;
BEGIN
  SELECT id INTO m_lat_delt FROM public.muscles WHERE slug = 'lateral-deltoid';
  SELECT id INTO m_post_delt FROM public.muscles WHERE slug = 'posterior-deltoid';
  SELECT id INTO m_calves FROM public.muscles WHERE slug = 'calves';
  SELECT id INTO m_rectus_abd FROM public.muscles WHERE slug = 'rectus-abdominis';
  SELECT id INTO m_obliques FROM public.muscles WHERE slug = 'obliques';
  SELECT id INTO m_erector FROM public.muscles WHERE slug = 'erector-spinae';
  SELECT id INTO m_forearms FROM public.muscles WHERE slug = 'forearms';
  SELECT id INTO m_hip_flexors FROM public.muscles WHERE slug = 'hip-flexors';

  -- Lateral Deltoid (2)
  INSERT INTO public.muscle_meshes (muscle_id, mesh_name, side) VALUES
  (m_lat_delt, 'acromial part of left deltoid', 'L'),
  (m_lat_delt, 'acromial part of right deltoid', 'R')
  ON CONFLICT (muscle_id, mesh_name) DO NOTHING;

  -- Posterior Deltoid (2)
  INSERT INTO public.muscle_meshes (muscle_id, mesh_name, side) VALUES
  (m_post_delt, 'spinal part of left deltoid', 'L'),
  (m_post_delt, 'spinal part of right deltoid', 'R')
  ON CONFLICT (muscle_id, mesh_name) DO NOTHING;

  -- Calves (6)
  INSERT INTO public.muscle_meshes (muscle_id, mesh_name, side) VALUES
  (m_calves, 'lateral head of left gastrocnemius', 'L'),
  (m_calves, 'lateral head of right gastrocnemius', 'R'),
  (m_calves, 'medial head of left gastrocnemius', 'L'),
  (m_calves, 'medial head of right gastrocnemius', 'R'),
  (m_calves, 'left soleus', 'L'),
  (m_calves, 'right soleus', 'R')
  ON CONFLICT (muscle_id, mesh_name) DO NOTHING;

  -- Rectus Abdominis (2)
  INSERT INTO public.muscle_meshes (muscle_id, mesh_name, side) VALUES
  (m_rectus_abd, 'left rectus abdominis', 'L'),
  (m_rectus_abd, 'right rectus abdominis', 'R')
  ON CONFLICT (muscle_id, mesh_name) DO NOTHING;

  -- Obliques (4)
  INSERT INTO public.muscle_meshes (muscle_id, mesh_name, side) VALUES
  (m_obliques, 'left external oblique', 'L'),
  (m_obliques, 'right external oblique', 'R'),
  (m_obliques, 'left internal oblique', 'L'),
  (m_obliques, 'right internal oblique', 'R')
  ON CONFLICT (muscle_id, mesh_name) DO NOTHING;

  -- Erector Spinae (4)
  INSERT INTO public.muscle_meshes (muscle_id, mesh_name, side) VALUES
  (m_erector, 'left iliocostalis lumborum', 'L'),
  (m_erector, 'right iliocostalis lumborum', 'R'),
  (m_erector, 'left longissimus thoracis', 'L'),
  (m_erector, 'right longissimus thoracis', 'R')
  ON CONFLICT (muscle_id, mesh_name) DO NOTHING;

  -- Forearms (12)
  INSERT INTO public.muscle_meshes (muscle_id, mesh_name, side) VALUES
  (m_forearms, 'left brachioradialis', 'L'),
  (m_forearms, 'right brachioradialis', 'R'),
  (m_forearms, 'left flexor carpi radialis', 'L'),
  (m_forearms, 'right flexor carpi radialis', 'R'),
  (m_forearms, 'left extensor carpi radialis longus', 'L'),
  (m_forearms, 'right extensor carpi radialis longus', 'R'),
  (m_forearms, 'left extensor carpi ulnaris', 'L'),
  (m_forearms, 'right extensor carpi ulnaris', 'R'),
  (m_forearms, 'humeral head of left flexor carpi ulnaris', 'L'),
  (m_forearms, 'humeral head of right flexor carpi ulnaris', 'R'),
  (m_forearms, 'humeral head of left pronator teres', 'L'),
  (m_forearms, 'humeral head of right pronator teres', 'R')
  ON CONFLICT (muscle_id, mesh_name) DO NOTHING;

  -- Hip Flexors (4)
  INSERT INTO public.muscle_meshes (muscle_id, mesh_name, side) VALUES
  (m_hip_flexors, 'left iliacus', 'L'),
  (m_hip_flexors, 'right iliacus', 'R'),
  (m_hip_flexors, 'left psoas major', 'L'),
  (m_hip_flexors, 'right psoas major', 'R')
  ON CONFLICT (muscle_id, mesh_name) DO NOTHING;
END $$;
