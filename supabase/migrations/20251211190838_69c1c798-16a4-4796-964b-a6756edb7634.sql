-- Remove the UPDATE policy that allows users to change their own subscription tier
-- Tier modifications should only happen through the check-subscription edge function
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.user_subscriptions;

-- Create a trigger function that enforces tier to 'basic' on any INSERT
-- This prevents users from inserting themselves as 'pro' tier
CREATE OR REPLACE FUNCTION public.enforce_basic_tier_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Always set tier to 'basic' on insert, regardless of what the user tries to set
  NEW.tier = 'basic'::subscription_tier;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to enforce basic tier on insert
DROP TRIGGER IF EXISTS enforce_basic_tier ON public.user_subscriptions;
CREATE TRIGGER enforce_basic_tier
  BEFORE INSERT ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_basic_tier_on_insert();

-- Add a new UPDATE policy that only allows the service_role to update subscriptions
-- Regular users cannot update at all (handled by edge function with service_role)
-- Note: We keep the INSERT policy as-is since the trigger now enforces basic tier