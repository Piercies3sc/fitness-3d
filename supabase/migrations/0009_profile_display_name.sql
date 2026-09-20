-- Migration: 0009_profile_display_name.sql
-- Description: Add display_name column to public.profiles

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
