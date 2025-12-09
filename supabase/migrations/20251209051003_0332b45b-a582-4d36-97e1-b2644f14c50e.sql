-- Create table for saved analysis reports
CREATE TABLE public.saved_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  transcript TEXT,
  analysis_result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own reports" 
ON public.saved_reports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports" 
ON public.saved_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports" 
ON public.saved_reports 
FOR DELETE 
USING (auth.uid() = user_id);