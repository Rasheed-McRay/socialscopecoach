-- Add column to track voice registration bonus analyses
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS voice_bonus_remaining integer NOT NULL DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.voice_bonus_remaining IS 'Number of bonus analyses remaining from voice registration reward';