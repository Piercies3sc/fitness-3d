-- 0005_history_indexes.sql

-- Index for history queries: users will query their completed workouts sorted by completion time
CREATE INDEX IF NOT EXISTS idx_workouts_history ON public.workouts (user_id, status, completed_at DESC);

-- Foreign key indexes for efficient relational selects and joins
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON public.workout_exercises (workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise_id ON public.workout_sets (workout_exercise_id);
