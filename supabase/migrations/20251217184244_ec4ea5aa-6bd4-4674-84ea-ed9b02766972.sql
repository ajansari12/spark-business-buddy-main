-- Add Tier 2/3 columns to ft_ideas for enhanced content
ALTER TABLE ft_ideas ADD COLUMN IF NOT EXISTS swot_analysis JSONB;
ALTER TABLE ft_ideas ADD COLUMN IF NOT EXISTS risk_mitigation JSONB;
ALTER TABLE ft_ideas ADD COLUMN IF NOT EXISTS pricing_strategy JSONB;
ALTER TABLE ft_ideas ADD COLUMN IF NOT EXISTS customer_acquisition JSONB;
ALTER TABLE ft_ideas ADD COLUMN IF NOT EXISTS ninety_day_roadmap JSONB;

-- Add tier column to ft_orders to track which tier was purchased
ALTER TABLE ft_orders ADD COLUMN IF NOT EXISTS tier_name TEXT DEFAULT 'starter';

-- Add comments for clarity
COMMENT ON COLUMN ft_ideas.swot_analysis IS 'SWOT analysis (Tier 2+)';
COMMENT ON COLUMN ft_ideas.risk_mitigation IS 'Risk mitigation playbook (Tier 2+)';
COMMENT ON COLUMN ft_ideas.pricing_strategy IS 'Pricing strategy recommendations (Tier 2+)';
COMMENT ON COLUMN ft_ideas.customer_acquisition IS 'Customer acquisition playbook (Tier 2+)';
COMMENT ON COLUMN ft_ideas.ninety_day_roadmap IS '90-day execution roadmap (Tier 2+)';
COMMENT ON COLUMN ft_orders.tier_name IS 'Tier name: starter, complete, or vip';