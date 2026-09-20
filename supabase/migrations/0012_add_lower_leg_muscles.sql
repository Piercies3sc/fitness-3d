-- Promote the visible anterior and lateral lower-leg muscles into distinct
-- training-exposure groups. They are not part of the plantarflexor Calves group.
INSERT INTO public.muscles (name, slug, region)
VALUES
  ('Tibialis Anterior', 'tibialis-anterior', 'Legs'),
  ('Fibularis', 'fibularis', 'Legs')
ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE
  m_tibialis_anterior UUID;
  m_fibularis UUID;
  ex_walking_lunge UUID;
  ex_single_leg_rdl UUID;
BEGIN
  SELECT id INTO m_tibialis_anterior FROM public.muscles WHERE slug = 'tibialis-anterior';
  SELECT id INTO m_fibularis FROM public.muscles WHERE slug = 'fibularis';
  SELECT id INTO ex_walking_lunge FROM public.exercises WHERE slug = 'walking-lunge';
  SELECT id INTO ex_single_leg_rdl FROM public.exercises WHERE slug = 'single-leg-romanian-deadlift';

  INSERT INTO public.muscle_meshes (muscle_id, mesh_name, side) VALUES
    (m_tibialis_anterior, 'left tibialis anterior', 'L'),
    (m_tibialis_anterior, 'right tibialis anterior', 'R'),
    (m_fibularis, 'left fibularis longus', 'L'),
    (m_fibularis, 'right fibularis longus', 'R'),
    (m_fibularis, 'left fibularis brevis', 'L'),
    (m_fibularis, 'right fibularis brevis', 'R'),
    (m_fibularis, 'left fibularis tertius', 'L'),
    (m_fibularis, 'right fibularis tertius', 'R')
  ON CONFLICT (muscle_id, mesh_name) DO NOTHING;

  -- Conservative stabilizer exposure only: the existing catalog has no direct
  -- dorsiflexion or eversion isolation exercise, so no primary factor is claimed.
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
    (ex_walking_lunge, m_tibialis_anterior, 'secondary', 0.10),
    (ex_walking_lunge, m_fibularis, 'secondary', 0.10),
    (ex_single_leg_rdl, m_tibialis_anterior, 'secondary', 0.10),
    (ex_single_leg_rdl, m_fibularis, 'secondary', 0.10)
  ON CONFLICT (exercise_id, muscle_id) DO UPDATE SET
    role = EXCLUDED.role,
    exposure_factor = EXCLUDED.exposure_factor;
END $$;
