-- Create table for generated content from Idea Builder Toolkit
CREATE TABLE public.ft_generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  idea_id UUID NOT NULL REFERENCES public.ft_ideas(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('pitch', 'social', 'emails')),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_ft_generated_content_user_idea ON public.ft_generated_content(user_id, idea_id);
CREATE INDEX idx_ft_generated_content_type ON public.ft_generated_content(idea_id, content_type);

-- Enable RLS
ALTER TABLE public.ft_generated_content ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own generated content"
ON public.ft_generated_content FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own generated content"
ON public.ft_generated_content FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generated content"
ON public.ft_generated_content FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generated content"
ON public.ft_generated_content FOR DELETE
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_ft_generated_content_updated_at
  BEFORE UPDATE ON public.ft_generated_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();