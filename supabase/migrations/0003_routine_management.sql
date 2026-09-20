-- Create ROUTINES table
CREATE TABLE public.routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create ROUTINE_EXERCISES table
CREATE TABLE public.routine_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL,
  planned_sets INTEGER NOT NULL CHECK (planned_sets > 0 AND planned_sets <= 20),
  target_reps_min INTEGER CHECK (target_reps_min > 0 AND target_reps_min <= 100),
  target_reps_max INTEGER CHECK (target_reps_max > 0 AND target_reps_max <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (routine_id, exercise_id),
  CHECK (
    (target_reps_min IS NULL AND target_reps_max IS NULL) OR
    (target_reps_min IS NOT NULL AND target_reps_max IS NOT NULL AND target_reps_min <= target_reps_max)
  )
);

-- Add updated_at trigger for routines
CREATE TRIGGER on_routines_updated
  BEFORE UPDATE ON public.routines
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ENABLE RLS
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES for routines
CREATE POLICY "Users can view own routines"
  ON public.routines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own routines"
  ON public.routines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routines"
  ON public.routines FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own routines"
  ON public.routines FOR DELETE
  USING (auth.uid() = user_id);

-- RLS POLICIES for routine_exercises
-- We determine ownership by joining with the routines table (subselect).
CREATE POLICY "Users can view own routine exercises"
  ON public.routine_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.routines 
      WHERE routines.id = routine_exercises.routine_id 
      AND routines.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own routine exercises"
  ON public.routine_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.routines 
      WHERE routines.id = routine_exercises.routine_id 
      AND routines.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own routine exercises"
  ON public.routine_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.routines 
      WHERE routines.id = routine_exercises.routine_id 
      AND routines.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own routine exercises"
  ON public.routine_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.routines 
      WHERE routines.id = routine_exercises.routine_id 
      AND routines.user_id = auth.uid()
    )
  );
