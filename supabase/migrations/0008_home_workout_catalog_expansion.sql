-- Migration: 0008_home_workout_catalog_expansion.sql
-- Description: Add home_friendly column, backfill existing 30 exercises, insert 50 new exercises, and insert 147 new exercise_muscles mappings.

-- 1. Add home_friendly column to exercises
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS home_friendly BOOLEAN NOT NULL DEFAULT false;

-- 2. Backfill existing 30 exercises
UPDATE public.exercises
SET home_friendly = true
WHERE slug IN (
  'squat',
  'bench-press',
  'barbell-hip-thrust',
  'bulgarian-split-squat',
  'dumbbell-biceps-curl',
  'dumbbell-lateral-raise',
  'dumbbell-shoulder-press',
  'ez-bar-skull-crusher',
  'hammer-curl',
  'hanging-knee-raise',
  'incline-dumbbell-press',
  'one-arm-dumbbell-row',
  'plank',
  'romanian-deadlift',
  'seated-calf-raise',
  'standing-calf-raise'
);

UPDATE public.exercises
SET home_friendly = false
WHERE slug IN (
  'cable-chest-fly',
  'cable-crunch',
  'cable-glute-kickback',
  'cable-triceps-pushdown',
  'lat-pulldown',
  'leg-extension',
  'leg-press',
  'leg-press-calf-raise',
  'lying-leg-curl',
  'overhead-cable-triceps-extension',
  'preacher-curl',
  'reverse-pec-deck-rear-delt-fly',
  'seated-cable-row',
  'seated-leg-curl'
);

-- 3. Insert 50 new exercises
INSERT INTO public.exercises (name, slug, equipment, movement_type, body_region, home_friendly, description)
VALUES
  -- Chest (1-4)
  ('Push-Up', 'push-up', 'Bodyweight', 'Horizontal Push', 'chest', true, 'A foundational bodyweight pressing exercise targeting the chest, shoulders, and triceps.'),
  ('Incline Push-Up', 'incline-push-up', 'Bodyweight + Bench/Chair', 'Incline Push', 'chest', true, 'An elevated push-up variation with hands raised, reducing load and targeting the lower chest and pushing mechanics.'),
  ('Decline Push-Up', 'decline-push-up', 'Bodyweight + Bench/Chair', 'Decline Push', 'chest', true, 'A push-up variation with feet elevated on a bench or chair, placing greater emphasis on the upper chest and anterior deltoids.'),
  ('Dumbbell Floor Press', 'dumbbell-floor-press', 'Dumbbells', 'Horizontal Push', 'chest', true, 'A dumbbell pressing movement performed lying on the floor, protecting the shoulders while building pressing power.'),

  -- Back (5-9)
  ('Pull-Up', 'pull-up', 'Pull-Up Bar', 'Vertical Pull', 'back', true, 'A classic bodyweight vertical pull with an overhand grip, heavily engaging the latissimus dorsi and upper back.'),
  ('Chin-Up', 'chin-up', 'Pull-Up Bar', 'Vertical Pull', 'back', true, 'A bodyweight vertical pull with a supinated (underhand) grip, emphasizing the lats and biceps.'),
  ('Resistance Band Row', 'resistance-band-row', 'Resistance Band', 'Horizontal Pull', 'back', true, 'A versatile horizontal pulling exercise using elastic resistance to target the mid-back, rhomboids, and lats.'),
  ('Dumbbell Pullover', 'dumbbell-pullover', 'Dumbbell + Bench/Floor', 'Shoulder Extension', 'back', true, 'A pullover movement targeting the lats and serratus through shoulder extension in a stretched position.'),
  ('Superman', 'superman', 'Bodyweight', 'Back Extension', 'back', true, 'A prone bodyweight extension movement targeting the spinal erectors, glutes, and upper back stability.'),

  -- Shoulders (10-13)
  ('Pike Push-Up', 'pike-push-up', 'Bodyweight', 'Vertical Push', 'shoulders', true, 'An inverted bodyweight push targeting the anterior and lateral deltoids through vertical pressing mechanics.'),
  ('Dumbbell Front Raise', 'dumbbell-front-raise', 'Dumbbells', 'Shoulder Flexion', 'shoulders', true, 'An isolation exercise that isolates the anterior deltoid through shoulder flexion in the sagittal plane.'),
  ('Arnold Press', 'arnold-press', 'Dumbbells', 'Vertical Push', 'shoulders', true, 'A rotational dumbbell overhead press that targets both anterior and lateral deltoids through an extended range of motion.'),
  ('Resistance Band Face Pull', 'resistance-band-face-pull', 'Resistance Band + Anchor', 'Horizontal Pull', 'shoulders', true, 'A banded posterior chain movement targeting the rear deltoids, rhomboids, and external rotators.'),

  -- Biceps (14-16)
  ('Concentration Curl', 'concentration-curl', 'Dumbbell + Chair', 'Elbow Flexion', 'biceps', true, 'A seated dumbbell curl with the elbow braced against the inner thigh, strictly isolating the biceps brachii.'),
  ('Resistance Band Biceps Curl', 'resistance-band-biceps-curl', 'Resistance Band', 'Elbow Flexion', 'biceps', true, 'A standing biceps curl utilizing continuous elastic resistance throughout the elbow flexion range.'),
  ('Incline Dumbbell Curl', 'incline-dumbbell-curl', 'Dumbbells + Incline Bench', 'Elbow Flexion', 'biceps', true, 'A dumbbell curl performed on an incline bench, placing the long head of the biceps into maximum stretch.'),

  -- Triceps (17-20)
  ('Close-Grip Push-Up', 'close-grip-push-up', 'Bodyweight', 'Horizontal Push', 'triceps', true, 'A push-up performed with hands placed closer together, shifting load significantly to the triceps.'),
  ('Chair Dip', 'chair-dip', 'Bodyweight + Chair/Bench', 'Vertical Push', 'triceps', true, 'A bodyweight dipping movement using a chair or bench to isolate the triceps through elbow extension.'),
  ('Dumbbell Overhead Triceps Extension', 'dumbbell-overhead-triceps-extension', 'Dumbbell', 'Elbow Extension', 'triceps', true, 'An overhead triceps extension using a dumbbell, emphasizing the long head under stretch.'),
  ('Dumbbell Triceps Kickback', 'dumbbell-triceps-kickback', 'Dumbbell', 'Elbow Extension', 'triceps', true, 'A hinged triceps movement focusing on peak contraction at full elbow extension.'),

  -- Quadriceps (21-24)
  ('Bodyweight Squat', 'bodyweight-squat', 'Bodyweight', 'Squat', 'quadriceps', true, 'A foundational lower-body squat using bodyweight to build quadriceps, glute, and hip mobility.'),
  ('Goblet Squat', 'goblet-squat', 'Dumbbell/Kettlebell', 'Squat', 'quadriceps', true, 'A front-loaded squat holding a single dumbbell or kettlebell, reinforcing upright posture and quadriceps loading.'),
  ('Reverse Lunge', 'reverse-lunge', 'Bodyweight / Dumbbells', 'Lunge', 'quadriceps', true, 'A stepping backward lunge that protects the knees while developing unilateral quadriceps and glute strength.'),
  ('Walking Lunge', 'walking-lunge', 'Bodyweight / Dumbbells', 'Lunge', 'quadriceps', true, 'A dynamic unilateral movement developing leg drive, quadriceps strength, and hip stability.'),

  -- Hamstrings (25-28)
  ('Dumbbell Romanian Deadlift', 'dumbbell-romanian-deadlift', 'Dumbbells', 'Hip Hinge', 'hamstrings', true, 'A dumbbell hip hinge focusing on eccentric hamstring loading and glute extension.'),
  ('Single-Leg Romanian Deadlift', 'single-leg-romanian-deadlift', 'Dumbbell / Bodyweight', 'Hip Hinge', 'hamstrings', true, 'A unilateral hip-hinge movement that challenges hamstring strength, glute stability, and balance.'),
  ('Sliding Leg Curl', 'sliding-leg-curl', 'Sliders/Towel', 'Knee Flexion', 'hamstrings', true, 'A bodyweight knee flexion movement using sliders or a towel on a smooth floor to isolate the hamstrings.'),
  ('Nordic Hamstring Curl', 'nordic-hamstring-curl', 'Bodyweight + Foot Anchor', 'Knee Flexion', 'hamstrings', true, 'An intense eccentric knee flexion exercise that builds elite hamstring strength and injury resilience.'),

  -- Glutes (29-32)
  ('Glute Bridge', 'glute-bridge', 'Bodyweight', 'Hip Extension', 'glutes', true, 'A supine hip extension exercise that activates and builds the gluteus maximus.'),
  ('Single-Leg Glute Bridge', 'single-leg-glute-bridge', 'Bodyweight', 'Hip Extension', 'glutes', true, 'A unilateral glute bridge variation correcting side-to-side imbalances and increasing glute activation.'),
  ('Donkey Kick', 'donkey-kick', 'Bodyweight', 'Hip Extension', 'glutes', true, 'A quadruped hip extension movement targeting the gluteus maximus with bent-knee isolation.'),
  ('Frog Pump', 'frog-pump', 'Bodyweight', 'Hip Extension', 'glutes', true, 'A bridge variation with soles together, targeting glute activation with reduced hamstring assistance.'),

  -- Calves (33-36)
  ('Single-Leg Calf Raise', 'single-leg-calf-raise', 'Bodyweight', 'Plantarflexion', 'calves', true, 'A unilateral bodyweight calf raise targeting full plantarflexion strength and ankle stability.'),
  ('Donkey Calf Raise', 'donkey-calf-raise', 'Bodyweight + Support', 'Plantarflexion', 'calves', true, 'A bent-over calf raise placing the gastrocnemius under stretch with hips flexed.'),
  ('Smith Machine Calf Raise', 'smith-machine-calf-raise', 'Smith Machine', 'Plantarflexion', 'calves', false, 'A heavy calf raise performed inside a fixed Smith machine track.'),
  ('Calf Raise on Step', 'calf-raise-on-step', 'Bodyweight + Step', 'Plantarflexion', 'calves', true, 'A calf raise performed on the edge of a step to allow a full deficit stretch and contraction.'),

  -- Core (37-40)
  ('Side Plank', 'side-plank', 'Bodyweight', 'Isometric Anti-Lateral Flexion', 'core', true, 'An isometric lateral core hold that develops oblique and lateral trunk stability.'),
  ('Dead Bug', 'dead-bug', 'Bodyweight', 'Isometric Anti-Extension', 'core', true, 'A supine core stability exercise emphasizing anterior core anti-extension with contralateral limb movement.'),
  ('Bicycle Crunch', 'bicycle-crunch', 'Bodyweight', 'Spinal Flexion / Rotation', 'core', true, 'A dynamic core exercise combining spinal flexion with rotational recruitment of the obliques.'),
  ('Lying Leg Raise', 'lying-leg-raise', 'Bodyweight', 'Hip / Spinal Flexion', 'core', true, 'A supine movement lifting straight legs to target the lower rectus abdominis and hip flexors.'),

  -- Gym / Machine Expansion (41-50)
  ('Machine Chest Press', 'machine-chest-press', 'Chest Press Machine', 'Horizontal Push', 'chest', false, 'A guided machine press providing stable horizontal pressing for chest development.'),
  ('Pec Deck Fly', 'pec-deck-fly', 'Pec Deck Machine', 'Chest Isolation', 'chest', false, 'A machine fly that provides constant tension across the chest through horizontal adduction.'),
  ('T-Bar Row', 't-bar-row', 'T-Bar / Landmine', 'Horizontal Pull', 'back', false, 'A heavy compound row utilizing a landmine or fixed T-bar to develop back thickness.'),
  ('Chest-Supported Row', 'chest-supported-row', 'Row Machine', 'Horizontal Pull', 'back', false, 'A supported row that removes lower-back fatigue to isolate the lats and mid-back.'),
  ('Machine Shoulder Press', 'machine-shoulder-press', 'Shoulder Press Machine', 'Vertical Push', 'shoulders', false, 'A guided overhead press that stabilizes the path for deltoid overload.'),
  ('Cable Lateral Raise', 'cable-lateral-raise', 'Cable Machine', 'Shoulder Isolation', 'shoulders', false, 'A cable movement providing continuous tension throughout the lateral deltoid range of motion.'),
  ('Hack Squat', 'hack-squat', 'Hack Squat Machine', 'Squat', 'quadriceps', false, 'A fixed-track machine squat that places intense load on the quadriceps with back support.'),
  ('Smith Machine Squat', 'smith-machine-squat', 'Smith Machine', 'Squat', 'quadriceps', false, 'A squat performed on a fixed vertical or angled barbell track.'),
  ('Hip Abduction Machine', 'hip-abduction-machine', 'Hip Abduction Machine', 'Hip Abduction', 'glutes', false, 'A seated machine isolating the gluteus medius and minimus through hip abduction.'),
  ('Hip Adduction Machine', 'hip-adduction-machine', 'Hip Adduction Machine', 'Hip Adduction', 'quadriceps', false, 'A seated machine isolating the inner thigh adductor complex.')
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  equipment = EXCLUDED.equipment,
  movement_type = EXCLUDED.movement_type,
  body_region = EXCLUDED.body_region,
  home_friendly = EXCLUDED.home_friendly,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 4. Insert 147 new exercise_muscles mappings
DO $$
DECLARE
  -- Exercises
  ex_push_up UUID;
  ex_incline_push_up UUID;
  ex_decline_push_up UUID;
  ex_db_floor_press UUID;
  ex_pull_up UUID;
  ex_chin_up UUID;
  ex_band_row UUID;
  ex_db_pullover UUID;
  ex_superman UUID;
  ex_pike_push_up UUID;
  ex_db_front_raise UUID;
  ex_arnold_press UUID;
  ex_band_face_pull UUID;
  ex_conc_curl UUID;
  ex_band_curl UUID;
  ex_incline_curl UUID;
  ex_close_grip_push_up UUID;
  ex_chair_dip UUID;
  ex_db_oh_ext UUID;
  ex_db_kickback UUID;
  ex_bw_squat UUID;
  ex_goblet_squat UUID;
  ex_rev_lunge UUID;
  ex_walk_lunge UUID;
  ex_db_rdl UUID;
  ex_sl_rdl UUID;
  ex_slide_curl UUID;
  ex_nordic_curl UUID;
  ex_glute_bridge UUID;
  ex_sl_glute_bridge UUID;
  ex_donkey_kick UUID;
  ex_frog_pump UUID;
  ex_sl_calf_raise UUID;
  ex_donkey_calf_raise UUID;
  ex_smith_calf_raise UUID;
  ex_step_calf_raise UUID;
  ex_side_plank UUID;
  ex_dead_bug UUID;
  ex_bicycle_crunch UUID;
  ex_lying_leg_raise UUID;
  ex_mach_chest_press UUID;
  ex_pec_deck_fly UUID;
  ex_t_bar_row UUID;
  ex_chest_supp_row UUID;
  ex_mach_sh_press UUID;
  ex_cable_lat_raise UUID;
  ex_hack_squat UUID;
  ex_smith_squat UUID;
  ex_hip_abduction UUID;
  ex_hip_adduction UUID;

  -- Muscles (19)
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
  -- Lookup 50 exercises
  SELECT id INTO ex_push_up FROM public.exercises WHERE slug = 'push-up';
  SELECT id INTO ex_incline_push_up FROM public.exercises WHERE slug = 'incline-push-up';
  SELECT id INTO ex_decline_push_up FROM public.exercises WHERE slug = 'decline-push-up';
  SELECT id INTO ex_db_floor_press FROM public.exercises WHERE slug = 'dumbbell-floor-press';
  SELECT id INTO ex_pull_up FROM public.exercises WHERE slug = 'pull-up';
  SELECT id INTO ex_chin_up FROM public.exercises WHERE slug = 'chin-up';
  SELECT id INTO ex_band_row FROM public.exercises WHERE slug = 'resistance-band-row';
  SELECT id INTO ex_db_pullover FROM public.exercises WHERE slug = 'dumbbell-pullover';
  SELECT id INTO ex_superman FROM public.exercises WHERE slug = 'superman';
  SELECT id INTO ex_pike_push_up FROM public.exercises WHERE slug = 'pike-push-up';
  SELECT id INTO ex_db_front_raise FROM public.exercises WHERE slug = 'dumbbell-front-raise';
  SELECT id INTO ex_arnold_press FROM public.exercises WHERE slug = 'arnold-press';
  SELECT id INTO ex_band_face_pull FROM public.exercises WHERE slug = 'resistance-band-face-pull';
  SELECT id INTO ex_conc_curl FROM public.exercises WHERE slug = 'concentration-curl';
  SELECT id INTO ex_band_curl FROM public.exercises WHERE slug = 'resistance-band-biceps-curl';
  SELECT id INTO ex_incline_curl FROM public.exercises WHERE slug = 'incline-dumbbell-curl';
  SELECT id INTO ex_close_grip_push_up FROM public.exercises WHERE slug = 'close-grip-push-up';
  SELECT id INTO ex_chair_dip FROM public.exercises WHERE slug = 'chair-dip';
  SELECT id INTO ex_db_oh_ext FROM public.exercises WHERE slug = 'dumbbell-overhead-triceps-extension';
  SELECT id INTO ex_db_kickback FROM public.exercises WHERE slug = 'dumbbell-triceps-kickback';
  SELECT id INTO ex_bw_squat FROM public.exercises WHERE slug = 'bodyweight-squat';
  SELECT id INTO ex_goblet_squat FROM public.exercises WHERE slug = 'goblet-squat';
  SELECT id INTO ex_rev_lunge FROM public.exercises WHERE slug = 'reverse-lunge';
  SELECT id INTO ex_walk_lunge FROM public.exercises WHERE slug = 'walking-lunge';
  SELECT id INTO ex_db_rdl FROM public.exercises WHERE slug = 'dumbbell-romanian-deadlift';
  SELECT id INTO ex_sl_rdl FROM public.exercises WHERE slug = 'single-leg-romanian-deadlift';
  SELECT id INTO ex_slide_curl FROM public.exercises WHERE slug = 'sliding-leg-curl';
  SELECT id INTO ex_nordic_curl FROM public.exercises WHERE slug = 'nordic-hamstring-curl';
  SELECT id INTO ex_glute_bridge FROM public.exercises WHERE slug = 'glute-bridge';
  SELECT id INTO ex_sl_glute_bridge FROM public.exercises WHERE slug = 'single-leg-glute-bridge';
  SELECT id INTO ex_donkey_kick FROM public.exercises WHERE slug = 'donkey-kick';
  SELECT id INTO ex_frog_pump FROM public.exercises WHERE slug = 'frog-pump';
  SELECT id INTO ex_sl_calf_raise FROM public.exercises WHERE slug = 'single-leg-calf-raise';
  SELECT id INTO ex_donkey_calf_raise FROM public.exercises WHERE slug = 'donkey-calf-raise';
  SELECT id INTO ex_smith_calf_raise FROM public.exercises WHERE slug = 'smith-machine-calf-raise';
  SELECT id INTO ex_step_calf_raise FROM public.exercises WHERE slug = 'calf-raise-on-step';
  SELECT id INTO ex_side_plank FROM public.exercises WHERE slug = 'side-plank';
  SELECT id INTO ex_dead_bug FROM public.exercises WHERE slug = 'dead-bug';
  SELECT id INTO ex_bicycle_crunch FROM public.exercises WHERE slug = 'bicycle-crunch';
  SELECT id INTO ex_lying_leg_raise FROM public.exercises WHERE slug = 'lying-leg-raise';
  SELECT id INTO ex_mach_chest_press FROM public.exercises WHERE slug = 'machine-chest-press';
  SELECT id INTO ex_pec_deck_fly FROM public.exercises WHERE slug = 'pec-deck-fly';
  SELECT id INTO ex_t_bar_row FROM public.exercises WHERE slug = 't-bar-row';
  SELECT id INTO ex_chest_supp_row FROM public.exercises WHERE slug = 'chest-supported-row';
  SELECT id INTO ex_mach_sh_press FROM public.exercises WHERE slug = 'machine-shoulder-press';
  SELECT id INTO ex_cable_lat_raise FROM public.exercises WHERE slug = 'cable-lateral-raise';
  SELECT id INTO ex_hack_squat FROM public.exercises WHERE slug = 'hack-squat';
  SELECT id INTO ex_smith_squat FROM public.exercises WHERE slug = 'smith-machine-squat';
  SELECT id INTO ex_hip_abduction FROM public.exercises WHERE slug = 'hip-abduction-machine';
  SELECT id INTO ex_hip_adduction FROM public.exercises WHERE slug = 'hip-adduction-machine';

  -- Lookup 19 muscles
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

  -- Insert 147 mappings
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  -- 1. Push-Up (3)
  (ex_push_up, m_pec_major, 'primary', 1.0),
  (ex_push_up, m_triceps, 'secondary', 0.5),
  (ex_push_up, m_ant_delt, 'secondary', 0.4),

  -- 2. Incline Push-Up (3)
  (ex_incline_push_up, m_pec_major, 'primary', 1.0),
  (ex_incline_push_up, m_triceps, 'secondary', 0.45),
  (ex_incline_push_up, m_ant_delt, 'secondary', 0.35),

  -- 3. Decline Push-Up (3)
  (ex_decline_push_up, m_pec_major, 'primary', 1.0),
  (ex_decline_push_up, m_ant_delt, 'secondary', 0.55),
  (ex_decline_push_up, m_triceps, 'secondary', 0.45),

  -- 4. Dumbbell Floor Press (3)
  (ex_db_floor_press, m_pec_major, 'primary', 1.0),
  (ex_db_floor_press, m_triceps, 'secondary', 0.5),
  (ex_db_floor_press, m_ant_delt, 'secondary', 0.35),

  -- 5. Pull-Up (5)
  (ex_pull_up, m_lats, 'primary', 1.0),
  (ex_pull_up, m_biceps, 'secondary', 0.6),
  (ex_pull_up, m_teres_major, 'secondary', 0.4),
  (ex_pull_up, m_traps, 'secondary', 0.3),
  (ex_pull_up, m_forearms, 'secondary', 0.25),

  -- 6. Chin-Up (5)
  (ex_chin_up, m_lats, 'primary', 1.0),
  (ex_chin_up, m_biceps, 'secondary', 0.8),
  (ex_chin_up, m_teres_major, 'secondary', 0.35),
  (ex_chin_up, m_traps, 'secondary', 0.25),
  (ex_chin_up, m_forearms, 'secondary', 0.3),

  -- 7. Resistance Band Row (5)
  (ex_band_row, m_traps, 'primary', 1.0),
  (ex_band_row, m_lats, 'secondary', 0.8),
  (ex_band_row, m_biceps, 'secondary', 0.45),
  (ex_band_row, m_post_delt, 'secondary', 0.4),
  (ex_band_row, m_teres_major, 'secondary', 0.3),

  -- 8. Dumbbell Pullover (4)
  (ex_db_pullover, m_lats, 'primary', 1.0),
  (ex_db_pullover, m_pec_major, 'secondary', 0.4),
  (ex_db_pullover, m_teres_major, 'secondary', 0.3),
  (ex_db_pullover, m_triceps, 'secondary', 0.2),

  -- 9. Superman (4)
  (ex_superman, m_erector, 'primary', 1.0),
  (ex_superman, m_glutes, 'secondary', 0.35),
  (ex_superman, m_hamstrings, 'secondary', 0.25),
  (ex_superman, m_traps, 'secondary', 0.25),

  -- 10. Pike Push-Up (4)
  (ex_pike_push_up, m_ant_delt, 'primary', 1.0),
  (ex_pike_push_up, m_triceps, 'secondary', 0.5),
  (ex_pike_push_up, m_lat_delt, 'secondary', 0.4),
  (ex_pike_push_up, m_pec_major, 'secondary', 0.25),

  -- 11. Dumbbell Front Raise (1)
  (ex_db_front_raise, m_ant_delt, 'primary', 1.0),

  -- 12. Arnold Press (3)
  (ex_arnold_press, m_ant_delt, 'primary', 1.0),
  (ex_arnold_press, m_lat_delt, 'secondary', 0.75),
  (ex_arnold_press, m_triceps, 'secondary', 0.5),

  -- 13. Resistance Band Face Pull (2)
  (ex_band_face_pull, m_post_delt, 'primary', 1.0),
  (ex_band_face_pull, m_traps, 'secondary', 0.8),

  -- 14. Concentration Curl (2)
  (ex_conc_curl, m_biceps, 'primary', 1.0),
  (ex_conc_curl, m_forearms, 'secondary', 0.25),

  -- 15. Resistance Band Biceps Curl (2)
  (ex_band_curl, m_biceps, 'primary', 1.0),
  (ex_band_curl, m_forearms, 'secondary', 0.3),

  -- 16. Incline Dumbbell Curl (2)
  (ex_incline_curl, m_biceps, 'primary', 1.0),
  (ex_incline_curl, m_forearms, 'secondary', 0.2),

  -- 17. Close-Grip Push-Up (3)
  (ex_close_grip_push_up, m_triceps, 'primary', 1.0),
  (ex_close_grip_push_up, m_pec_major, 'secondary', 0.6),
  (ex_close_grip_push_up, m_ant_delt, 'secondary', 0.35),

  -- 18. Chair Dip (3)
  (ex_chair_dip, m_triceps, 'primary', 1.0),
  (ex_chair_dip, m_pec_major, 'secondary', 0.6),
  (ex_chair_dip, m_ant_delt, 'secondary', 0.35),

  -- 19. Dumbbell Overhead Triceps Extension (1)
  (ex_db_oh_ext, m_triceps, 'primary', 1.0),

  -- 20. Dumbbell Triceps Kickback (1)
  (ex_db_kickback, m_triceps, 'primary', 1.0),

  -- 21. Bodyweight Squat (4)
  (ex_bw_squat, m_quads, 'primary', 1.0),
  (ex_bw_squat, m_glutes, 'secondary', 0.8),
  (ex_bw_squat, m_adductors, 'secondary', 0.35),
  (ex_bw_squat, m_hamstrings, 'secondary', 0.2),

  -- 22. Goblet Squat (4)
  (ex_goblet_squat, m_quads, 'primary', 1.0),
  (ex_goblet_squat, m_glutes, 'secondary', 0.8),
  (ex_goblet_squat, m_adductors, 'secondary', 0.35),
  (ex_goblet_squat, m_hamstrings, 'secondary', 0.2),

  -- 23. Reverse Lunge (4)
  (ex_rev_lunge, m_quads, 'primary', 1.0),
  (ex_rev_lunge, m_glutes, 'secondary', 0.8),
  (ex_rev_lunge, m_adductors, 'secondary', 0.3),
  (ex_rev_lunge, m_hamstrings, 'secondary', 0.25),

  -- 24. Walking Lunge (4)
  (ex_walk_lunge, m_quads, 'primary', 1.0),
  (ex_walk_lunge, m_glutes, 'secondary', 0.8),
  (ex_walk_lunge, m_adductors, 'secondary', 0.3),
  (ex_walk_lunge, m_hamstrings, 'secondary', 0.25),

  -- 25. Dumbbell Romanian Deadlift (4)
  (ex_db_rdl, m_hamstrings, 'primary', 1.0),
  (ex_db_rdl, m_glutes, 'secondary', 0.8),
  (ex_db_rdl, m_erector, 'secondary', 0.45),
  (ex_db_rdl, m_adductors, 'secondary', 0.25),

  -- 26. Single-Leg Romanian Deadlift (4)
  (ex_sl_rdl, m_hamstrings, 'primary', 1.0),
  (ex_sl_rdl, m_glutes, 'secondary', 0.9),
  (ex_sl_rdl, m_erector, 'secondary', 0.4),
  (ex_sl_rdl, m_adductors, 'secondary', 0.25),

  -- 27. Sliding Leg Curl (3)
  (ex_slide_curl, m_hamstrings, 'primary', 1.0),
  (ex_slide_curl, m_glutes, 'secondary', 0.35),
  (ex_slide_curl, m_calves, 'secondary', 0.15),

  -- 28. Nordic Hamstring Curl (3)
  (ex_nordic_curl, m_hamstrings, 'primary', 1.0),
  (ex_nordic_curl, m_glutes, 'secondary', 0.2),
  (ex_nordic_curl, m_calves, 'secondary', 0.15),

  -- 29. Glute Bridge (3)
  (ex_glute_bridge, m_glutes, 'primary', 1.0),
  (ex_glute_bridge, m_hamstrings, 'secondary', 0.4),
  (ex_glute_bridge, m_adductors, 'secondary', 0.2),

  -- 30. Single-Leg Glute Bridge (3)
  (ex_sl_glute_bridge, m_glutes, 'primary', 1.0),
  (ex_sl_glute_bridge, m_hamstrings, 'secondary', 0.45),
  (ex_sl_glute_bridge, m_adductors, 'secondary', 0.15),

  -- 31. Donkey Kick (2)
  (ex_donkey_kick, m_glutes, 'primary', 1.0),
  (ex_donkey_kick, m_hamstrings, 'secondary', 0.25),

  -- 32. Frog Pump (2)
  (ex_frog_pump, m_glutes, 'primary', 1.0),
  (ex_frog_pump, m_adductors, 'secondary', 0.25),

  -- 33. Single-Leg Calf Raise (1)
  (ex_sl_calf_raise, m_calves, 'primary', 1.0),

  -- 34. Donkey Calf Raise (1)
  (ex_donkey_calf_raise, m_calves, 'primary', 1.0),

  -- 35. Smith Machine Calf Raise (1)
  (ex_smith_calf_raise, m_calves, 'primary', 1.0),

  -- 36. Calf Raise on Step (1)
  (ex_step_calf_raise, m_calves, 'primary', 1.0),

  -- 37. Side Plank (4)
  (ex_side_plank, m_obliques, 'primary', 1.0),
  (ex_side_plank, m_rectus_abd, 'secondary', 0.5),
  (ex_side_plank, m_erector, 'secondary', 0.4),
  (ex_side_plank, m_glutes, 'secondary', 0.25),

  -- 38. Dead Bug (3)
  (ex_dead_bug, m_rectus_abd, 'primary', 1.0),
  (ex_dead_bug, m_hip_flexors, 'secondary', 0.5),
  (ex_dead_bug, m_obliques, 'secondary', 0.4),

  -- 39. Bicycle Crunch (3)
  (ex_bicycle_crunch, m_rectus_abd, 'primary', 1.0),
  (ex_bicycle_crunch, m_obliques, 'secondary', 0.8),
  (ex_bicycle_crunch, m_hip_flexors, 'secondary', 0.5),

  -- 40. Lying Leg Raise (3)
  (ex_lying_leg_raise, m_hip_flexors, 'primary', 1.0),
  (ex_lying_leg_raise, m_rectus_abd, 'secondary', 0.8),
  (ex_lying_leg_raise, m_obliques, 'secondary', 0.25),

  -- 41. Machine Chest Press (3)
  (ex_mach_chest_press, m_pec_major, 'primary', 1.0),
  (ex_mach_chest_press, m_triceps, 'secondary', 0.5),
  (ex_mach_chest_press, m_ant_delt, 'secondary', 0.4),

  -- 42. Pec Deck Fly (2)
  (ex_pec_deck_fly, m_pec_major, 'primary', 1.0),
  (ex_pec_deck_fly, m_ant_delt, 'secondary', 0.2),

  -- 43. T-Bar Row (6)
  (ex_t_bar_row, m_traps, 'primary', 1.0),
  (ex_t_bar_row, m_lats, 'secondary', 0.85),
  (ex_t_bar_row, m_biceps, 'secondary', 0.45),
  (ex_t_bar_row, m_post_delt, 'secondary', 0.4),
  (ex_t_bar_row, m_teres_major, 'secondary', 0.3),
  (ex_t_bar_row, m_erector, 'secondary', 0.3),

  -- 44. Chest-Supported Row (5)
  (ex_chest_supp_row, m_traps, 'primary', 1.0),
  (ex_chest_supp_row, m_lats, 'secondary', 0.8),
  (ex_chest_supp_row, m_biceps, 'secondary', 0.45),
  (ex_chest_supp_row, m_post_delt, 'secondary', 0.4),
  (ex_chest_supp_row, m_teres_major, 'secondary', 0.3),

  -- 45. Machine Shoulder Press (3)
  (ex_mach_sh_press, m_ant_delt, 'primary', 1.0),
  (ex_mach_sh_press, m_lat_delt, 'secondary', 0.7),
  (ex_mach_sh_press, m_triceps, 'secondary', 0.5),

  -- 46. Cable Lateral Raise (2)
  (ex_cable_lat_raise, m_lat_delt, 'primary', 1.0),
  (ex_cable_lat_raise, m_ant_delt, 'secondary', 0.15),

  -- 47. Hack Squat (4)
  (ex_hack_squat, m_quads, 'primary', 1.0),
  (ex_hack_squat, m_glutes, 'secondary', 0.65),
  (ex_hack_squat, m_adductors, 'secondary', 0.25),
  (ex_hack_squat, m_hamstrings, 'secondary', 0.15),

  -- 48. Smith Machine Squat (4)
  (ex_smith_squat, m_quads, 'primary', 1.0),
  (ex_smith_squat, m_glutes, 'secondary', 0.75),
  (ex_smith_squat, m_adductors, 'secondary', 0.3),
  (ex_smith_squat, m_hamstrings, 'secondary', 0.2),

  -- 49. Hip Abduction Machine (1)
  (ex_hip_abduction, m_glutes, 'primary', 1.0),

  -- 50. Hip Adduction Machine (1)
  (ex_hip_adduction, m_adductors, 'primary', 1.0)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET
    role = EXCLUDED.role,
    exposure_factor = EXCLUDED.exposure_factor;
END $$;
