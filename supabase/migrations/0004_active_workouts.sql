-- 0004_active_workouts.sql

-- Create enums
CREATE TYPE workout_status AS ENUM ('active', 'completed');
CREATE TYPE set_type AS ENUM ('warmup', 'working');

-- Create workouts table
CREATE TABLE public.workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id uuid REFERENCES public.routines(id) ON DELETE SET NULL,
  routine_name_snapshot text NOT NULL,
  status workout_status NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure only ONE active workout per user
CREATE UNIQUE INDEX one_active_workout_per_user ON public.workouts (user_id) WHERE status = 'active';

-- Create workout_exercises table
CREATE TABLE public.workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  position integer NOT NULL,
  planned_sets_snapshot integer NOT NULL,
  target_reps_min_snapshot integer,
  target_reps_max_snapshot integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create workout_sets table
CREATE TABLE public.workout_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id uuid NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  set_number integer NOT NULL CHECK (set_number > 0),
  set_type set_type NOT NULL DEFAULT 'working',
  weight_kg numeric(6, 2) NOT NULL CHECK (weight_kg >= 0 AND weight_kg <= 2000),
  reps integer NOT NULL CHECK (reps > 0 AND reps <= 100),
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workout_exercise_id, set_number)
);

-- Enable RLS
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;

-- Workouts Policies
CREATE POLICY "Users can view their own workouts" 
ON public.workouts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts" 
ON public.workouts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own active workouts" 
ON public.workouts FOR DELETE 
USING (auth.uid() = user_id AND status = 'active');

-- Workout Exercises Policies
CREATE POLICY "Users can view exercises of their own workouts" 
ON public.workout_exercises FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.workouts 
    WHERE workouts.id = workout_exercises.workout_id 
    AND workouts.user_id = auth.uid()
  )
);

-- Workout Sets Policies
CREATE POLICY "Users can view sets of their own workouts" 
ON public.workout_sets FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.workout_exercises 
    JOIN public.workouts ON workouts.id = workout_exercises.workout_id 
    WHERE workout_exercises.id = workout_sets.workout_exercise_id 
    AND workouts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert sets into their own active workouts" 
ON public.workout_sets FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workout_exercises 
    JOIN public.workouts ON workouts.id = workout_exercises.workout_id 
    WHERE workout_exercises.id = workout_sets.workout_exercise_id 
    AND workouts.user_id = auth.uid()
    AND workouts.status = 'active'
  )
);

CREATE POLICY "Users can update sets in their own active workouts" 
ON public.workout_sets FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.workout_exercises 
    JOIN public.workouts ON workouts.id = workout_exercises.workout_id 
    WHERE workout_exercises.id = workout_sets.workout_exercise_id 
    AND workouts.user_id = auth.uid()
    AND workouts.status = 'active'
  )
);

CREATE POLICY "Users can delete sets from their own active workouts" 
ON public.workout_sets FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.workout_exercises 
    JOIN public.workouts ON workouts.id = workout_exercises.workout_id 
    WHERE workout_exercises.id = workout_sets.workout_exercise_id 
    AND workouts.user_id = auth.uid()
    AND workouts.status = 'active'
  )
);

-- RPC for Starting a Workout
CREATE OR REPLACE FUNCTION public.start_workout_from_routine(p_routine_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_routine_name text;
  v_workout_id uuid;
  v_active_exists boolean;
BEGIN
  -- 1. Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Verify routine ownership and get name
  SELECT name INTO v_routine_name
  FROM public.routines
  WHERE id = p_routine_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Routine not found or not owned by user';
  END IF;

  -- 3. Check for existing active workout
  SELECT EXISTS (
    SELECT 1 FROM public.workouts 
    WHERE user_id = v_user_id AND status = 'active'
  ) INTO v_active_exists;

  IF v_active_exists THEN
    RAISE EXCEPTION 'An active workout already exists';
  END IF;

  -- 4. Create workout
  INSERT INTO public.workouts (user_id, routine_id, routine_name_snapshot, status)
  VALUES (v_user_id, p_routine_id, v_routine_name, 'active')
  RETURNING id INTO v_workout_id;

  -- 5. Copy exercises
  INSERT INTO public.workout_exercises (
    workout_id, 
    exercise_id, 
    position, 
    planned_sets_snapshot, 
    target_reps_min_snapshot, 
    target_reps_max_snapshot
  )
  SELECT 
    v_workout_id,
    re.exercise_id,
    re.position,
    re.planned_sets,
    re.target_reps_min,
    re.target_reps_max
  FROM public.routine_exercises re
  WHERE re.routine_id = p_routine_id;

  RETURN v_workout_id;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_workouts_updated_at
  BEFORE UPDATE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_workout_sets_updated_at
  BEFORE UPDATE ON public.workout_sets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
