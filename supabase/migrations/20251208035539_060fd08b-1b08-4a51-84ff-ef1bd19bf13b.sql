-- Create voice samples table
CREATE TABLE public.voice_samples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sample_number INTEGER NOT NULL CHECK (sample_number BETWEEN 1 AND 5),
  audio_url TEXT NOT NULL,
  duration_seconds NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, sample_number)
);

-- Enable RLS
ALTER TABLE public.voice_samples ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own voice samples"
ON public.voice_samples
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice samples"
ON public.voice_samples
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice samples"
ON public.voice_samples
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice samples"
ON public.voice_samples
FOR DELETE
USING (auth.uid() = user_id);

-- Add voice_registered flag to profiles
ALTER TABLE public.profiles ADD COLUMN voice_registered BOOLEAN NOT NULL DEFAULT false;

-- Create storage bucket for voice samples
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-samples', 'voice-samples', false);

-- Storage policies for voice samples
CREATE POLICY "Users can upload their own voice samples"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'voice-samples' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own voice samples"
ON storage.objects
FOR SELECT
USING (bucket_id = 'voice-samples' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own voice samples"
ON storage.objects
FOR DELETE
USING (bucket_id = 'voice-samples' AND auth.uid()::text = (storage.foldername(name))[1]);