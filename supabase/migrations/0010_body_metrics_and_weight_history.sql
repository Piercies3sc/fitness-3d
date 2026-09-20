-- Migration: 0010_body_metrics_and_weight_history.sql
-- Description: Add body metrics to profiles and create weight_entries table with RLS

-- 1. Extend profiles table with body metrics columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS height_cm numeric CHECK (height_cm IS NULL OR (height_cm > 0 AND height_cm <= 300)),
ADD COLUMN IF NOT EXISTS date_of_birth date CHECK (date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE),
ADD COLUMN IF NOT EXISTS bmr_sex text CHECK (bmr_sex IS NULL OR bmr_sex IN ('male', 'female'));

COMMENT ON COLUMN public.profiles.height_cm IS 'User height in centimeters (positive, <= 300).';
COMMENT ON COLUMN public.profiles.date_of_birth IS 'User date of birth (must not be in the future).';
COMMENT ON COLUMN public.profiles.bmr_sex IS 'Sex used strictly for Mifflin–St Jeor BMR equation (male | female).';

-- 2. Create weight_entries table
CREATE TABLE IF NOT EXISTS public.weight_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg numeric NOT NULL CHECK (weight_kg > 0 AND weight_kg <= 500),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.weight_entries IS 'Historical user bodyweight entries stored canonically in kg.';

-- 3. Create index for fast user and chronological queries
CREATE INDEX IF NOT EXISTS weight_entries_user_recorded_idx
  ON public.weight_entries (user_id, recorded_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.weight_entries ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: User ownership
CREATE POLICY "Users can select own weight entries"
  ON public.weight_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight entries"
  ON public.weight_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weight entries"
  ON public.weight_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight entries"
  ON public.weight_entries FOR DELETE
  USING (auth.uid() = user_id);
