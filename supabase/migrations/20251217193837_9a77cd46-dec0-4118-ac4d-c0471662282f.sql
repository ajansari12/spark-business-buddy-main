-- Add RLS policies to protect ft_orders from direct client manipulation
-- Orders should only be created/modified by backend Edge Functions using service role

-- Deny all client-side inserts (only service role can insert)
CREATE POLICY "No direct order inserts"
ON public.ft_orders FOR INSERT
WITH CHECK (false);

-- Deny all client-side updates (only service role can update)
CREATE POLICY "No direct order updates"
ON public.ft_orders FOR UPDATE
USING (false)
WITH CHECK (false);

-- Deny all client-side deletes (only service role can delete)
CREATE POLICY "No direct order deletes"
ON public.ft_orders FOR DELETE
USING (false);