-- Drop restrictive policies and recreate as permissive for voice_samples table
DROP POLICY IF EXISTS "Users can view their own voice samples" ON public.voice_samples;
DROP POLICY IF EXISTS "Users can insert their own voice samples" ON public.voice_samples;
DROP POLICY IF EXISTS "Users can update their own voice samples" ON public.voice_samples;
DROP POLICY IF EXISTS "Users can delete their own voice samples" ON public.voice_samples;

CREATE POLICY "Users can view their own voice samples" 
ON public.voice_samples 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice samples" 
ON public.voice_samples 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice samples" 
ON public.voice_samples 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice samples" 
ON public.voice_samples 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Drop and recreate storage policies
DROP POLICY IF EXISTS "Users can upload their own voice samples" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own voice samples" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own voice samples" ON storage.objects;

CREATE POLICY "Users can upload voice samples"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'voice-samples' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view voice samples"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'voice-samples' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete voice samples"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'voice-samples' AND auth.uid()::text = (storage.foldername(name))[1]);