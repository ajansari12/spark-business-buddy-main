-- Add onboarding columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS province text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;