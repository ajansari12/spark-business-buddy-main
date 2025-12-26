-- Add business_names JSONB column to ft_ideas for VIP tier
ALTER TABLE public.ft_ideas 
ADD COLUMN IF NOT EXISTS business_names JSONB DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN public.ft_ideas.business_names IS 'AI-generated business name suggestions for VIP tier users';