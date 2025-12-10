
-- Create enum types for roles, tiers, and access levels
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'moderator', 'user');
CREATE TYPE public.subscription_tier_v2 AS ENUM ('free', 'premium', 'developer');
CREATE TYPE public.access_level AS ENUM ('restricted', 'standard', 'unlimited');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  role app_role NOT NULL DEFAULT 'user',
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  tier subscription_tier_v2 NOT NULL DEFAULT 'free',
  access_level access_level NOT NULL DEFAULT 'restricted',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create security definer function to check if user is owner
CREATE OR REPLACE FUNCTION public.is_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'owner'
  )
$$;

-- Create security definer function to get user's access level
CREATE OR REPLACE FUNCTION public.get_access_level(_user_id UUID)
RETURNS access_level
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT access_level FROM public.user_roles WHERE user_id = _user_id),
    'restricted'::access_level
  )
$$;

-- Create security definer function to get user's tier
CREATE OR REPLACE FUNCTION public.get_user_tier(_user_id UUID)
RETURNS subscription_tier_v2
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT tier FROM public.user_roles WHERE user_id = _user_id),
    'free'::subscription_tier_v2
  )
$$;

-- Create function to check if user should be visible (not hidden)
CREATE OR REPLACE FUNCTION public.is_user_visible(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT COALESCE(
    (SELECT is_hidden FROM public.user_roles WHERE user_id = _user_id),
    false
  )
$$;

-- RLS Policies for user_roles table
-- Users can view their own role (but not sensitive fields for non-owners)
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Only owners can view all roles
CREATE POLICY "Owners can view all roles"
ON public.user_roles
FOR SELECT
USING (public.is_owner(auth.uid()));

-- Only owners can update roles
CREATE POLICY "Owners can update roles"
ON public.user_roles
FOR UPDATE
USING (public.is_owner(auth.uid()));

-- System can insert roles (via trigger)
CREATE POLICY "System can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger to create user_role entry on new user
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_email TEXT := 'rmcclaryraynor@gmail.com';
  user_email TEXT;
BEGIN
  -- Get the user's email
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
  
  -- Check if this is the owner account
  IF user_email = owner_email THEN
    INSERT INTO public.user_roles (user_id, role, is_hidden, tier, access_level)
    VALUES (NEW.id, 'owner', true, 'developer', 'unlimited');
  ELSE
    INSERT INTO public.user_roles (user_id, role, is_hidden, tier, access_level)
    VALUES (NEW.id, 'user', false, 'free', 'restricted');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Add updated_at trigger
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update profiles table RLS to filter hidden users from public view
CREATE OR REPLACE FUNCTION public.can_view_profile(_profile_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- User can always view their own profile
    auth.uid() = _profile_user_id
    -- Owner can view all profiles
    OR public.is_owner(auth.uid())
    -- Others can only view non-hidden profiles
    OR public.is_user_visible(_profile_user_id)
$$;
