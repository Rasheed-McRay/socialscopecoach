-- Add UPDATE policy to saved_reports table so users can update their own reports
CREATE POLICY "Users can update their own reports" 
ON public.saved_reports 
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);