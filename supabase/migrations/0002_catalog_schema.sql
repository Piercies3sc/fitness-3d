-- Create EXERCISES table
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  equipment TEXT,
  movement_type TEXT,
  model_path TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create MUSCLES table
CREATE TABLE public.muscles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  region TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create EXERCISE_MUSCLES table
CREATE TABLE public.exercise_muscles (
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  muscle_id UUID NOT NULL REFERENCES public.muscles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('primary', 'secondary')),
  exposure_factor NUMERIC(4, 2) NOT NULL CHECK (exposure_factor > 0),
  PRIMARY KEY (exercise_id, muscle_id)
);

-- Create MUSCLE_MESHES table
CREATE TABLE public.muscle_meshes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  muscle_id UUID NOT NULL REFERENCES public.muscles(id) ON DELETE CASCADE,
  mesh_name TEXT NOT NULL,
  side TEXT CHECK (side IN ('L', 'R')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (muscle_id, mesh_name)
);

-- Add updated_at triggers
CREATE TRIGGER on_exercises_updated
  BEFORE UPDATE ON public.exercises
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_muscles_updated
  BEFORE UPDATE ON public.muscles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ENABLE RLS
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muscles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_muscles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muscle_meshes ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES (Public read-only)
CREATE POLICY "Allow public read access on exercises" ON public.exercises FOR SELECT USING (true);
CREATE POLICY "Allow public read access on muscles" ON public.muscles FOR SELECT USING (true);
CREATE POLICY "Allow public read access on exercise_muscles" ON public.exercise_muscles FOR SELECT USING (true);
CREATE POLICY "Allow public read access on muscle_meshes" ON public.muscle_meshes FOR SELECT USING (true);

-- SEED EXERCISES
INSERT INTO public.exercises (name, slug, equipment, movement_type, description) VALUES
('Bench Press', 'bench-press', 'Barbell', 'Horizontal Push', 'A fundamental upper-body compound movement emphasizing the chest, shoulders, and triceps.'),
('Squat', 'squat', 'Barbell', 'Squat', 'A foundational lower-body compound movement focusing on the quadriceps, glutes, and overall leg strength.'),
('Lat Pulldown', 'lat-pulldown', 'Cable', 'Vertical Pull', 'A core back exercise targeting the latissimus dorsi, using a cable machine to perform a vertical pulling motion.');

-- SEED MUSCLES
INSERT INTO public.muscles (name, slug, region) VALUES
('Pectoralis Major', 'pectoralis-major', 'Chest'),
('Triceps', 'triceps', 'Arms'),
('Anterior Deltoid', 'anterior-deltoid', 'Shoulders'),
('Quadriceps', 'quadriceps', 'Legs'),
('Glutes', 'glutes', 'Legs'),
('Adductors', 'adductors', 'Legs'),
('Hamstrings', 'hamstrings', 'Legs'),
('Latissimus Dorsi', 'latissimus-dorsi', 'Back'),
('Biceps', 'biceps', 'Arms'),
('Teres Major', 'teres-major', 'Back'),
('Mid / Lower Trapezius', 'mid-lower-trapezius', 'Back');

-- SEED EXERCISE_MUSCLES MAPPINGS
-- Using DO block to look up UUIDs safely and reproducibly
DO $$
DECLARE
  ex_bench_press UUID;
  ex_squat UUID;
  ex_lat_pulldown UUID;
  
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
  -- Get Exercise UUIDs
  SELECT id INTO ex_bench_press FROM public.exercises WHERE slug = 'bench-press';
  SELECT id INTO ex_squat FROM public.exercises WHERE slug = 'squat';
  SELECT id INTO ex_lat_pulldown FROM public.exercises WHERE slug = 'lat-pulldown';
  
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

  -- Insert Bench Press Mappings
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_bench_press, m_pec_major, 'primary', 1.00),
  (ex_bench_press, m_triceps, 'secondary', 0.50),
  (ex_bench_press, m_ant_delt, 'secondary', 0.40);

  -- Insert Squat Mappings
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_squat, m_quads, 'primary', 1.00),
  (ex_squat, m_glutes, 'primary', 0.80),
  (ex_squat, m_adductors, 'secondary', 0.40),
  (ex_squat, m_hamstrings, 'secondary', 0.25);

  -- Insert Lat Pulldown Mappings
  INSERT INTO public.exercise_muscles (exercise_id, muscle_id, role, exposure_factor) VALUES
  (ex_lat_pulldown, m_lats, 'primary', 1.00),
  (ex_lat_pulldown, m_biceps, 'secondary', 0.50),
  (ex_lat_pulldown, m_teres_major, 'secondary', 0.40),
  (ex_lat_pulldown, m_traps, 'secondary', 0.25);
END $$;
