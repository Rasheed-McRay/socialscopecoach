-- Add DELETE policy to user_roles table for GDPR compliance
CREATE POLICY "Users can delete their own role"
ON public.user_roles
FOR DELETE
USING (auth.uid() = user_id);