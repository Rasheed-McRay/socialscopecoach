-- Add onboarding preference columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS primary_goal text,
ADD COLUMN IF NOT EXISTS improvement_context text,
ADD COLUMN IF NOT EXISTS skill_level text,
ADD COLUMN IF NOT EXISTS practice_frequency text;