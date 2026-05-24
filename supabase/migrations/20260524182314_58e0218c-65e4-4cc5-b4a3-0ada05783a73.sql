-- Remove client-side write access to usage counter tables.
-- Edge functions use the service role and bypass RLS, so they still work.

DROP POLICY IF EXISTS "Users can insert their own usage" ON public.daily_analysis_usage;
DROP POLICY IF EXISTS "Users can update their own usage" ON public.daily_analysis_usage;

DROP POLICY IF EXISTS "Users can insert their own monthly usage" ON public.monthly_analysis_usage;
DROP POLICY IF EXISTS "Users can update their own monthly usage" ON public.monthly_analysis_usage;