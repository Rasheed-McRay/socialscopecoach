-- Create table to track monthly analysis usage for pro users
CREATE TABLE public.monthly_analysis_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  analysis_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, billing_period_start)
);

-- Enable Row Level Security
ALTER TABLE public.monthly_analysis_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view their own monthly usage"
ON public.monthly_analysis_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own usage
CREATE POLICY "Users can insert their own monthly usage"
ON public.monthly_analysis_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own usage
CREATE POLICY "Users can update their own monthly usage"
ON public.monthly_analysis_usage
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_monthly_analysis_usage_updated_at
BEFORE UPDATE ON public.monthly_analysis_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add subscription_started_at to user_roles for billing period tracking
ALTER TABLE public.user_roles 
ADD COLUMN subscription_started_at TIMESTAMP WITH TIME ZONE;