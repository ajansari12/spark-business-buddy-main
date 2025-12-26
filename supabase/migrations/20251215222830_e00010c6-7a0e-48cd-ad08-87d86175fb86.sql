-- Migration: Enhance ft_ideas table with richer business data
-- Version: 2.0 - Adds competitors, financials, Canadian resources

-- Add new columns to ft_ideas table (all nullable for backwards compatibility)
ALTER TABLE public.ft_ideas 
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS confidence_factors JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS time_to_launch TEXT,
ADD COLUMN IF NOT EXISTS financials JSONB,
ADD COLUMN IF NOT EXISTS canadian_resources JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS quick_win TEXT,
ADD COLUMN IF NOT EXISTS risk_level TEXT CHECK (risk_level IN ('Low', 'Medium', 'High'));

-- Update market_analysis column comment to reflect enhanced structure
COMMENT ON COLUMN public.ft_ideas.market_analysis IS 'Enhanced market analysis including competitors, target_customer, local_opportunity, thirty_day_action_plan';

-- Create index for faster queries on risk level
CREATE INDEX IF NOT EXISTS idx_ft_ideas_risk_level ON public.ft_ideas(risk_level);