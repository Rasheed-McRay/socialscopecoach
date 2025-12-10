-- Create user_activity table to track logins and analyses
CREATE TABLE public.user_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'analysis')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Create index for efficient querying
CREATE INDEX idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_type ON public.user_activity(activity_type);
CREATE INDEX idx_user_activity_created_at ON public.user_activity(created_at DESC);

-- Policy: Users can insert their own activity
CREATE POLICY "Users can insert their own activity"
ON public.user_activity
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Owners can view all activity
CREATE POLICY "Owners can view all activity"
ON public.user_activity
FOR SELECT
USING (is_owner(auth.uid()));

-- Policy: Users can view their own activity
CREATE POLICY "Users can view own activity"
ON public.user_activity
FOR SELECT
USING (auth.uid() = user_id);