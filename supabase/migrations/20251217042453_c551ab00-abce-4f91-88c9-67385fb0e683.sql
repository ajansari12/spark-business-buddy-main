-- Create registration_requirements table for dynamically generated requirements
CREATE TABLE public.registration_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES public.ft_ideas(id) ON DELETE CASCADE,
  province TEXT NOT NULL,
  step_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cost_estimate TEXT,
  time_estimate TEXT,
  government_url TEXT,
  is_industry_specific BOOLEAN DEFAULT false,
  is_baseline BOOLEAN DEFAULT true,
  source_verified BOOLEAN DEFAULT false,
  perplexity_sources TEXT[],
  verification_notes TEXT,
  last_verified TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(idea_id, step_id)
);

-- Enable RLS
ALTER TABLE public.registration_requirements ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only see requirements for their own ideas
CREATE POLICY "Users can view their own registration requirements"
ON public.registration_requirements FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.ft_ideas 
  WHERE ft_ideas.id = registration_requirements.idea_id 
  AND ft_ideas.user_id = auth.uid()
));

CREATE POLICY "Users can insert their own registration requirements"
ON public.registration_requirements FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.ft_ideas 
  WHERE ft_ideas.id = registration_requirements.idea_id 
  AND ft_ideas.user_id = auth.uid()
));

CREATE POLICY "Users can update their own registration requirements"
ON public.registration_requirements FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.ft_ideas 
  WHERE ft_ideas.id = registration_requirements.idea_id 
  AND ft_ideas.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own registration requirements"
ON public.registration_requirements FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.ft_ideas 
  WHERE ft_ideas.id = registration_requirements.idea_id 
  AND ft_ideas.user_id = auth.uid()
));

-- Add new fields to ft_registration_progress
ALTER TABLE public.ft_registration_progress 
ADD COLUMN IF NOT EXISTS custom_steps JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS copilot_messages JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS path_generated_at TIMESTAMPTZ;

-- Create trigger for updated_at on registration_requirements
CREATE TRIGGER update_registration_requirements_updated_at
BEFORE UPDATE ON public.registration_requirements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();