-- SEED MUSCLE MESHES MAPPINGS
-- Using DO block to look up UUIDs safely and reproducibly
DO $$
DECLARE
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
BEGIN
  -- Get Muscle UUIDs
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

  -- Insert Pectoralis Major
  INSERT INTO public.muscle_meshes (muscle_id, mesh_name, side) VALUES
  (m_pec_major, 'abdominal part of left pectoralis major', 'L'),
  (m_pec_major, 'clavicular part of left pectoralis major', 'L'),
  (m_pec_major, 'sternocostal part of left pectoralis major', 'L'),
  (m_pec_major, 'abdominal part of right pectoralis major', 'R'),
  (m_pec_major, 'clavicular part of right pectoralis major', 'R'),
  (m_pec_major, 'sternocostal part of right pectoralis major', 'R');

  -- Insert Triceps
  INSERT INTO public.muscle_meshes (muscle_id, mesh_name, side) VALUES
  (m_triceps, 'lateral head of left triceps brachii', 'L'),
  (m_triceps, 'long head of left triceps brachii', 'L'),
  (m_triceps, 'medial head of left triceps brachii', 'L'),
  (m_triceps, 'lateral head of right triceps brachii', 'R'),
  (m_triceps, 'long head of right triceps brachii', 'R'),
  (m_triceps, 'medial head of right triceps brachii', 'R');

  -- Insert Anterior Deltoid
  INSERT INTO public.muscle_meshes (muscle_id, mesh_name, side) VALUES
  (m_ant_delt, 'clavicular part of left deltoid', 'L'),
  (m_ant_delt, 'clavicular part of right deltoid', 'R');

  -- Insert Quadriceps
  INSERT INTO public.muscle_meshes (muscle_id, mesh_name, side) VALUES
  (m_quads, 'left rectus femoris', 'L'),
  (m_quads, 'left vastus intermedius', 'L'),
  (m_quads, 'left vastus lateralis', 'L'),
  (m_quads, 'left vastus medialis', 'L'),
  (m_quads, 'right rectus femoris', 'R'),
  (m_quads, 'right vastus intermedius', 'R'),
  (m_quads, 'right vastus lateralis', 'R'),
  (m_quads, 'right vastus medialis', 'R');

  -- Insert Glutes
  INSERT INTO public.muscle_meshes (muscle_id, mesh_name, side) VALUES
  (m_glutes, 'left gluteus maximus', 'L'),
  (m_glutes, 'left gluteus medius', 'L'),
  (m_glutes, 'left gluteus minimus', 'L'),
  (m_glutes, 'right gluteus maximus', 'R'),
  (m_glutes, 'right gluteus medius', 'R'),
  (m_glutes, 'right gluteus minimus', 'R');

  -- Insert Adductors
  INSERT INTO public.muscle_meshes (muscle_id, mesh_name, side) VALUES
  (m_adductors, 'left adductor brevis', 'L'),
  (m_adductors, 'left adductor longus', 'L'),
  (m_adductors, 'left adductor magnus', 'L'),
  (m_adductors, 'left gracilis', 'L'),
  (m_adductors, 'left pectineus', 'L'),
  (m_adductors, 'right adductor brevis', 'R'),
  (m_adductors, 'right adductor longus', 'R'),
  (m_adductors, 'right adductor magnus', 'R'),
  (m_adductors, 'right gracilis', 'R'),
  (m_adductors, 'right pectineus', 'R');

  -- Insert Hamstrings
  INSERT INTO public.muscle_meshes (muscle_id, mesh_name, side) VALUES
  (m_hamstrings, 'left semimembranosus', 'L'),
  (m_hamstrings, 'left semitendinosus', 'L'),
  (m_hamstrings, 'long head of left biceps femoris', 'L'),
  (m_hamstrings, 'short head of left biceps femoris', 'L'),
  (m_hamstrings, 'long head of right biceps femoris', 'R'),
  (m_hamstrings, 'right semimembranosus', 'R'),
  (m_hamstrings, 'right semitendinosus', 'R'),
  (m_hamstrings, 'short head of right biceps femoris', 'R');

  -- Insert Latissimus Dorsi
  INSERT INTO public.muscle_meshes (muscle_id, mesh_name, side) VALUES
  (m_lats, 'left latissimus dorsi', 'L'),
  (m_lats, 'right latissimus dorsi', 'R');

  -- Insert Biceps
  INSERT INTO public.muscle_meshes (muscle_id, mesh_name, side) VALUES
  (m_biceps, 'long head of left biceps brachii', 'L'),
  (m_biceps, 'short head of left biceps brachii', 'L'),
  (m_biceps, 'long head of right biceps brachii', 'R'),
  (m_biceps, 'short head of right biceps brachii', 'R');

  -- Insert Teres Major
  INSERT INTO public.muscle_meshes (muscle_id, mesh_name, side) VALUES
  (m_teres_major, 'left teres major', 'L'),
  (m_teres_major, 'right teres major', 'R');

  -- Insert Mid / Lower Trapezius
  INSERT INTO public.muscle_meshes (muscle_id, mesh_name, side) VALUES
  (m_traps, 'ascending part of left trapezius', 'L'),
  (m_traps, 'transverse part of left trapezius', 'L'),
  (m_traps, 'ascending part of right trapezius', 'R'),
  (m_traps, 'transverse part of right trapezius', 'R');

END $$;
