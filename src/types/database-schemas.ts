// ============================================================================
// ZOD SCHEMAS FOR DATABASE JSONB COLUMNS & AI RESPONSES
// Runtime validation for type safety on JSONB columns
// ============================================================================

import { z } from "zod";

// ============================================================================
// SESSION COLLECTED DATA (ft_sessions.collected_data)
// ============================================================================

export const SelectedTrendingBusinessSchema = z.object({
  business_type: z.string(),
  trend_reason: z.string(),
  estimated_cost_min: z.number(),
  estimated_cost_max: z.number(),
  growth_potential: z.enum(["High", "Medium", "Moderate"]),
  time_to_launch: z.string(),
  why_trending: z.string().optional(),
});

export const SessionCollectedDataSchema = z.object({
  city: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  skills_background: z.string().nullable().optional(),
  interests: z.string().nullable().optional(),
  time_commitment_hours: z.number().nullable().optional(),
  budget_min: z.number().nullable().optional(),
  budget_max: z.number().nullable().optional(),
  income_goal: z.string().nullable().optional(),
  constraints: z.string().nullable().optional(),
  preferred_industries: z.array(z.string()).optional().default([]),
  business_idea: z.string().nullable().optional(),
  selected_trending_business: SelectedTrendingBusinessSchema.nullable().optional(),
  age_range: z.string().nullable().optional(),
  residency_status: z.string().nullable().optional(),
  years_in_canada: z.string().nullable().optional(),
  user_confirmed: z.boolean().optional(),
  // Legacy compatibility
  skills: z.array(z.string()).optional(),
  budget: z.string().nullable().optional(),
  time_commitment: z.string().nullable().optional(),
  goals: z.array(z.string()).optional(),
});

export type SessionCollectedData = z.infer<typeof SessionCollectedDataSchema>;

// ============================================================================
// IDEA COMPETITORS (ft_ideas.market_analysis.competitors)
// ============================================================================

export const CompetitorSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price_range: z.string().optional(),
  weakness: z.string().optional(),
  website: z.string().optional(),
  google_rating: z.string().optional(),
  review_count: z.number().optional(),
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  is_verified: z.boolean().optional(),
});

export type IdeaCompetitor = z.infer<typeof CompetitorSchema>;

// ============================================================================
// IDEA FINANCIALS (ft_ideas.financials)
// ============================================================================

export const StartupCostBreakdownSchema = z.object({
  equipment: z.number().optional(),
  licensing: z.number().optional(),
  marketing: z.number().optional(),
  inventory: z.number().optional(),
  software: z.number().optional(),
  insurance: z.number().optional(),
  workspace: z.number().optional(),
  other: z.number().optional(),
  total: z.number(),
});

export const IdeaFinancialsSchema = z.object({
  startup_cost_breakdown: StartupCostBreakdownSchema,
  monthly_expenses: z.number(),
  monthly_revenue_low: z.number(),
  monthly_revenue_high: z.number(),
  break_even_months: z.number(),
  year_one_profit_low: z.number().optional(),
  year_one_profit_high: z.number().optional(),
});

export type IdeaFinancials = z.infer<typeof IdeaFinancialsSchema>;

// ============================================================================
// IDEA MARKET SIGNALS (ft_ideas.market_signals)
// ============================================================================

export const JobPostingSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string(),
  url: z.string().optional(),
});

export const IdeaMarketSignalsSchema = z.object({
  demand_indicator: z.enum(["High", "Medium", "Low"]),
  job_postings: z.array(JobPostingSchema).optional(),
  job_posting_count: z.number().optional(),
  news_sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
  news_highlights: z.array(z.string()).optional(),
  regulatory_notes: z.union([z.string(), z.array(z.string())]).optional(),
  recent_closures: z.array(z.string()).optional(),
  recent_openings: z.array(z.string()).optional(),
  citations: z.array(z.string()).optional(),
  last_updated: z.string().optional(),
});

export type IdeaMarketSignals = z.infer<typeof IdeaMarketSignalsSchema>;

// ============================================================================
// IDEA MARKET ANALYSIS (ft_ideas.market_analysis)
// ============================================================================

export const IdeaMarketAnalysisSchema = z.object({
  why_fit: z.string(),
  local_opportunity: z.string().optional(),
  local_notes: z.string().optional(), // Legacy field
  target_customer: z.string().optional(),
  market_size_local: z.string().optional(),
  competitors: z.array(CompetitorSchema).optional(),
  competitive_gap: z.string().optional(),
  market_saturation: z.string().optional(),
  challenges: z.array(z.string()).optional(),
  first_steps: z.array(z.string()).optional(),
  thirty_day_action_plan: z.array(z.string()).optional(),
});

export type IdeaMarketAnalysis = z.infer<typeof IdeaMarketAnalysisSchema>;

// ============================================================================
// SWOT ANALYSIS (ft_ideas.swot_analysis)
// ============================================================================

export const SWOTAnalysisSchema = z.object({
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  opportunities: z.array(z.string()),
  threats: z.array(z.string()),
});

export type SWOTAnalysis = z.infer<typeof SWOTAnalysisSchema>;

// ============================================================================
// RISK MITIGATION (ft_ideas.risk_mitigation)
// ============================================================================

export const RiskMitigationItemSchema = z.object({
  challenge: z.string(),
  severity: z.enum(["high", "medium", "low"]),
  mitigations: z.array(z.string()),
  early_warning_signs: z.string().optional(),
});

export const RiskMitigationSchema = z.array(RiskMitigationItemSchema);

export type RiskMitigationItem = z.infer<typeof RiskMitigationItemSchema>;

// ============================================================================
// PRICING STRATEGY (ft_ideas.pricing_strategy)
// ============================================================================

export const PricingStrategySchema = z.object({
  recommended_model: z.enum(["hourly", "project", "subscription", "product"]),
  price_range: z.object({
    low: z.string(),
    mid: z.string(),
    premium: z.string(),
  }),
  rationale: z.string(),
  competitor_comparison: z.string().optional(),
  discounting_strategy: z.string().optional(),
});

export type PricingStrategy = z.infer<typeof PricingStrategySchema>;

// ============================================================================
// CUSTOMER ACQUISITION (ft_ideas.customer_acquisition)
// ============================================================================

export const MarketingChannelSchema = z.object({
  channel: z.string(),
  roi: z.enum(["high", "medium", "low"]),
  cost: z.string(),
  time_investment: z.string().optional(),
});

export const CustomerAcquisitionSchema = z.object({
  first_10_strategy: z.record(z.array(z.string())),
  marketing_channels: z.array(MarketingChannelSchema).optional(),
  outreach_scripts: z.object({
    cold_email: z.string().optional(),
    linkedin: z.string().optional(),
  }).optional(),
  referral_strategy: z.string().optional(),
});

export type CustomerAcquisition = z.infer<typeof CustomerAcquisitionSchema>;

// ============================================================================
// 90-DAY ROADMAP (ft_ideas.ninety_day_roadmap)
// ============================================================================

export const RoadmapWeekSchema = z.object({
  week: z.number(),
  theme: z.string(),
  tasks: z.array(z.string()).optional(),
  milestone: z.string(),
  kpi: z.string().optional(),
  decision_point: z.string().optional(),
});

export const GoNoGoCheckpointSchema = z.object({
  week: z.number(),
  question: z.string(),
  green_light: z.string(),
  red_flag: z.string(),
});

export const NinetyDayRoadmapSchema = z.object({
  weeks: z.array(RoadmapWeekSchema).optional(),
  monthly_kpis: z.object({
    month_1: z.array(z.object({ metric: z.string(), target: z.string() })).optional(),
    month_2: z.array(z.object({ metric: z.string(), target: z.string() })).optional(),
    month_3: z.array(z.object({ metric: z.string(), target: z.string() })).optional(),
  }).optional(),
  go_no_go_checkpoints: z.array(GoNoGoCheckpointSchema).optional(),
});

export type NinetyDayRoadmap = z.infer<typeof NinetyDayRoadmapSchema>;

// ============================================================================
// CANADIAN RESOURCES (ft_ideas.canadian_resources)
// ============================================================================

export const CanadianResourceSchema = z.object({
  name: z.string(),
  type: z.enum(["grant", "loan", "program", "guide"]),
  description: z.string(),
  url: z.string().optional(),
  funding_amount: z.string().optional(),
  is_eligible: z.boolean().optional(),
  eligibility_reason: z.string().optional(),
  deadline: z.string().optional(),
  status: z.string().optional(),
  lastVerified: z.string().optional(),
});

export type CanadianResource = z.infer<typeof CanadianResourceSchema>;

// ============================================================================
// CONFIDENCE FACTORS (ft_ideas.confidence_factors)
// ============================================================================

export const ConfidenceFactorsSchema = z.array(z.string());

export type ConfidenceFactors = z.infer<typeof ConfidenceFactorsSchema>;

// ============================================================================
// AI RESPONSE SCHEMAS (for runtime validation of edge function responses)
// ============================================================================

export const AIIdeaResponseSchema = z.object({
  title: z.string(),
  tagline: z.string().optional(),
  description: z.string(),
  category: z.enum(["Service", "Product", "Digital", "Hybrid"]),
  risk_level: z.enum(["Low", "Medium", "High"]),
  viability_score: z.number().min(0).max(100),
  confidence_factors: z.array(z.string()).optional(),
  investment_min: z.number(),
  investment_max: z.number(),
  time_to_revenue: z.string(),
  time_to_launch: z.string().optional(),
  quick_win: z.string().optional(),
  market_analysis: IdeaMarketAnalysisSchema,
  financials: IdeaFinancialsSchema.optional(),
  canadian_resources: z.array(CanadianResourceSchema).optional(),
  market_signals: IdeaMarketSignalsSchema.optional(),
  swot_analysis: SWOTAnalysisSchema.optional(),
  risk_mitigation: RiskMitigationSchema.optional(),
  pricing_strategy: PricingStrategySchema.optional(),
  customer_acquisition: CustomerAcquisitionSchema.optional(),
  ninety_day_roadmap: NinetyDayRoadmapSchema.optional(),
});

export type AIIdeaResponse = z.infer<typeof AIIdeaResponseSchema>;

// ============================================================================
// HELPER FUNCTIONS FOR SAFE PARSING
// ============================================================================

/**
 * Safely parse JSONB data with a Zod schema
 * Returns typed data or null if parsing fails
 */
export function safeParseJsonb<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  fallback?: T
): T | null {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.warn("JSONB parse warning:", result.error.format());
  return fallback ?? null;
}

/**
 * Parse session collected data with defaults
 */
export function parseSessionCollectedData(data: unknown): SessionCollectedData {
  return safeParseJsonb(data, SessionCollectedDataSchema) ?? {
    city: null,
    province: null,
    skills_background: null,
    interests: null,
    time_commitment_hours: null,
    budget_min: null,
    budget_max: null,
    income_goal: null,
    constraints: null,
    preferred_industries: [],
  };
}

/**
 * Parse market signals, handling both string and array for regulatory_notes
 */
export function parseMarketSignals(data: unknown): IdeaMarketSignals | null {
  const result = IdeaMarketSignalsSchema.safeParse(data);
  if (result.success) {
    // Normalize regulatory_notes to always be an array
    const signals = result.data;
    if (typeof signals.regulatory_notes === "string") {
      signals.regulatory_notes = [signals.regulatory_notes];
    }
    return signals;
  }
  return null;
}
