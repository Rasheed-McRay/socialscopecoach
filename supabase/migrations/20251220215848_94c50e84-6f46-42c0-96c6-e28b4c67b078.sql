-- Add promo trial columns to profiles table for 3-day streak promotion
ALTER TABLE public.profiles 
ADD COLUMN promo_trial_claimed boolean NOT NULL DEFAULT false,
ADD COLUMN promo_trial_expires_at timestamp with time zone DEFAULT NULL;

-- Add index for efficient promo trial lookups
CREATE INDEX idx_profiles_promo_trial ON public.profiles (user_id, promo_trial_claimed, promo_trial_expires_at);