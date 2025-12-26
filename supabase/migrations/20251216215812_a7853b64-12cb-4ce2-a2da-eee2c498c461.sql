-- Create registration progress table for tracking user's business registration journey
CREATE TABLE public.ft_registration_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  idea_id UUID REFERENCES public.ft_ideas(id) ON DELETE CASCADE NOT NULL,
  province TEXT NOT NULL,
  business_structure TEXT NOT NULL DEFAULT 'sole_proprietorship',
  current_step INTEGER DEFAULT 1,
  completed_steps JSONB DEFAULT '[]'::jsonb,
  step_notes JSONB DEFAULT '{}'::jsonb,
  business_name TEXT,
  business_number TEXT,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, idea_id)
);

-- Enable RLS
ALTER TABLE public.ft_registration_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own registration progress
CREATE POLICY "Users can view their own registration progress"
ON public.ft_registration_progress
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own registration progress
CREATE POLICY "Users can create their own registration progress"
ON public.ft_registration_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own registration progress
CREATE POLICY "Users can update their own registration progress"
ON public.ft_registration_progress
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own registration progress
CREATE POLICY "Users can delete their own registration progress"
ON public.ft_registration_progress
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ft_registration_progress_updated_at
BEFORE UPDATE ON public.ft_registration_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();