-- Create ft_grant_kits table for storing generated grant application kits
CREATE TABLE public.ft_grant_kits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  idea_id UUID NOT NULL REFERENCES public.ft_ideas(id) ON DELETE CASCADE,
  grant_id UUID NOT NULL REFERENCES public.canadian_grants(id) ON DELETE CASCADE,
  cover_letter TEXT,
  budget_template JSONB,
  business_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ft_grant_kits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own grant kits"
ON public.ft_grant_kits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own grant kits"
ON public.ft_grant_kits FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own grant kits"
ON public.ft_grant_kits FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own grant kits"
ON public.ft_grant_kits FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_ft_grant_kits_updated_at
BEFORE UPDATE ON public.ft_grant_kits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();