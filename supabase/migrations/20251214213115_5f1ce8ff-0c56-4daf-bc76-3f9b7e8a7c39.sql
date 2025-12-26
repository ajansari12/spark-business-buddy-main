-- Add DELETE RLS policy for ft_sessions
CREATE POLICY "Users can delete their own sessions"
ON public.ft_sessions
FOR DELETE TO authenticated
USING (auth.uid() = user_id);