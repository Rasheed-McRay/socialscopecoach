-- Create table to track daily scope completions
CREATE TABLE public.daily_scope_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  prompt_date DATE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 100),
  analysis_result JSONB NOT NULL,
  transcript TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_scope_completions ENABLE ROW LEVEL SECURITY;

-- Create unique constraint to prevent multiple completions per day
CREATE UNIQUE INDEX daily_scope_completions_user_date_idx ON public.daily_scope_completions(user_id, prompt_date);

-- RLS policies
CREATE POLICY "Users can view their own daily scope completions"
ON public.daily_scope_completions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily scope completions"
ON public.daily_scope_completions
FOR INSERT
WITH CHECK (auth.uid() = user_id);