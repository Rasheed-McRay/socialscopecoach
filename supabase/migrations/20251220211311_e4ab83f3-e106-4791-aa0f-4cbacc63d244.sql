-- Add INSERT policy for user_roles table
-- Users should be able to create their own initial role (via signup trigger or first login)
-- This prevents any direct manipulation while allowing the system to work properly

CREATE POLICY "Users can insert their own role"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id AND role = 'user' AND tier = 'free' AND access_level = 'restricted');

-- This policy ensures:
-- 1. Users can only insert a role for themselves (user_id must match auth.uid())
-- 2. They can only insert with the default 'user' role (not admin/owner)
-- 3. They can only insert with 'free' tier (not premium/developer)
-- 4. They can only insert with 'restricted' access (not standard/unlimited)
-- This prevents privilege escalation while allowing initial role creation