
-- Remove privilege escalation vectors on user_roles
DROP POLICY IF EXISTS "Users can delete their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

-- Remove user-side INSERT on user_subscriptions (auto-created via trigger)
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.user_subscriptions;

-- Add explicit UPDATE policy on voice-samples storage bucket, scoped to owner
CREATE POLICY "Users can update their voice samples"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'voice-samples'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'voice-samples'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
