-- Phase 1: Fix Admin Role Security

-- 1. Create app_role enum type
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create has_role() security definer function (prevents RLS recursion)
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

-- 5. RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Migrate existing admins from profiles.is_admin to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM public.profiles
WHERE is_admin = true
ON CONFLICT (user_id, role) DO NOTHING;

-- 7. Add the specific user as admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('7c13721c-033a-4fa0-91b9-b6e071026085', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 8. Update canadian_grants RLS policies to use has_role()
DROP POLICY IF EXISTS "Admins can delete grants" ON public.canadian_grants;
DROP POLICY IF EXISTS "Admins can insert grants" ON public.canadian_grants;
DROP POLICY IF EXISTS "Admins can update grants" ON public.canadian_grants;

CREATE POLICY "Admins can delete grants"
ON public.canadian_grants
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert grants"
ON public.canadian_grants
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update grants"
ON public.canadian_grants
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9. Add market_signals column to ft_ideas for Phase 2
ALTER TABLE public.ft_ideas ADD COLUMN IF NOT EXISTS market_signals JSONB DEFAULT NULL;