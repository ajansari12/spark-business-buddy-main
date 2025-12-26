// Enhanced Business Idea Types for FastTrack.Business
// Version 2.0 - Includes competitors, financials, and Canadian resources

export interface Competitor {
  name: string;
  description: string;
  price_range?: string;
  weakness?: string;
  website?: string;
  google_rating?: string;
  review_count?: number;
  strengths?: string[];
  weaknesses?: string[];
  is_verified?: boolean;  // true = found via web search, false = AI-generated
}

export interface MarketAnalysisCompetitorData {
  competitors: Competitor[];
  competitive_gap?: string;
  market_saturation?: string;
}

export interface StartupCostBreakdown {
  equipment?: number;
  licensing?: number;
  marketing?: number;
  inventory?: number;
  software?: number;
  insurance?: number;
  workspace?: number;
  other?: number;
  total: number;
}

export interface FinancialProjection {
  startup_cost_breakdown: StartupCostBreakdown;
  monthly_expenses: number;
  monthly_revenue_low: number;
  monthly_revenue_high: number;
  break_even_months: number;
  year_one_profit_low: number;
  year_one_profit_high: number;
}

export interface CanadianResource {
  name: string;
  type: "grant" | "loan" | "program" | "guide";
  description: string;
  url?: string;
  funding_amount?: string;
  is_eligible?: boolean;
  eligibility_reason?: string;
  // Grant verification fields (populated from canadian_grants table)
  status?: string | null;
  deadline?: string | null;
  lastVerified?: string | null;
}

// Helper to split resources by eligibility
export function splitResourcesByEligibility(resources: CanadianResource[]): {
  eligible: CanadianResource[];
  ineligible: CanadianResource[];
} {
  const eligible: CanadianResource[] = [];
  const ineligible: CanadianResource[] = [];
  
  resources.forEach(r => {
    if (r.is_eligible === false) {
      ineligible.push(r);
    } else {
      // Default to eligible if not explicitly marked ineligible
      eligible.push(r);
    }
  });
  
  return { eligible, ineligible };
}

export interface JobPosting {
  title: string;
  company?: string;
  location?: string;
  salary_range?: string;
  url?: string;
}

export interface MarketSignals {
  demand_indicator?: "High" | "Medium" | "Low";
  job_postings?: JobPosting[];
  job_posting_count?: number;
  news_sentiment?: "positive" | "neutral" | "negative";
  news_highlights?: string[];
  regulatory_notes?: string;
  recent_closures?: string[];
  recent_openings?: string[];
  citations?: string[];
  last_updated?: string;
}

// Structured "Why This Fits" with specific data references
export interface WhyFitStructured {
  skill_reference?: string;
  budget_reference?: string;
  time_reference?: string;
  location_reference?: string;
}

export interface MarketAnalysisEnhanced {
  why_fit: string;
  why_fit_structured?: WhyFitStructured;
  local_opportunity: string;
  target_customer: string;
  market_size_local?: string;
  competitors: Competitor[];
  competitive_gap?: string;
  market_saturation?: string;
  challenges: string[];
  first_steps: string[];
  thirty_day_action_plan: string[];
}

// Tier 2+ Enhanced Types
export interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface RiskMitigationItem {
  challenge: string;
  severity: 'high' | 'medium' | 'low';
  mitigations: string[];
  early_warning_signs: string;
}

export interface PricingStrategy {
  recommended_model: 'hourly' | 'project' | 'subscription' | 'product';
  price_range: { low: string; mid: string; premium: string };
  rationale: string;
  competitor_comparison: string;
  discounting_strategy: string;
}

export interface CustomerAcquisitionPlan {
  first_10_strategy: {
    week_1: string[];
    week_2: string[];
    week_3: string[];
    week_4: string[];
  };
  marketing_channels: {
    channel: string;
    roi: 'high' | 'medium' | 'low';
    cost: string;
    time_investment: string;
  }[];
  outreach_scripts?: {
    cold_email?: string;
    linkedin?: string;
  };
  referral_strategy: string;
}

export interface NinetyDayRoadmapWeek {
  week: number;
  theme: string;
  tasks: string[];
  milestone: string;
  kpi: string;
  decision_point?: string;
}

export interface NinetyDayRoadmap {
  weeks: NinetyDayRoadmapWeek[];
  monthly_kpis: {
    month_1: { metric: string; target: string }[];
    month_2: { metric: string; target: string }[];
    month_3: { metric: string; target: string }[];
  };
  go_no_go_checkpoints: {
    week: number;
    question: string;
    green_light: string;
    red_flag: string;
  }[];
}

// Viability Score Breakdown - explains how the score was calculated
export interface ViabilityFactor {
  score: number;
  reason: string;
}

export interface ViabilityBreakdown {
  market_demand: ViabilityFactor;
  skill_match: ViabilityFactor;
  budget_fit: ViabilityFactor;
  competition: ViabilityFactor;
  time_realistic: ViabilityFactor;
  regulatory_ease?: ViabilityFactor;
}

export interface EnhancedBusinessIdea {
  title: string;
  tagline: string;
  description: string;
  category: "Service" | "Product" | "Digital" | "Hybrid";
  viability_score: number;
  viability_breakdown?: ViabilityBreakdown;
  confidence_factors: string[];
  investment_min: number;
  investment_max: number;
  time_to_revenue: string;
  time_to_launch: string;
  market_analysis: MarketAnalysisEnhanced;
  financials: FinancialProjection;
  canadian_resources: CanadianResource[];
  quick_win: string;
  risk_level: "Low" | "Medium" | "High";
  // Tier 2+ fields
  swot_analysis?: SWOTAnalysis;
  risk_mitigation?: RiskMitigationItem[];
  pricing_strategy?: PricingStrategy;
  customer_acquisition?: CustomerAcquisitionPlan;
  ninety_day_roadmap?: NinetyDayRoadmap;
}

// Database types (snake_case for Postgres)
export interface DbMarketAnalysisEnhanced {
  why_fit: string;
  local_opportunity: string;
  target_customer: string;
  market_size_local?: string;
  competitors: Competitor[];
  challenges: string[];
  first_steps: string[];
  thirty_day_action_plan: string[];
}

export interface DbEnhancedBusinessIdea {
  id: string;
  session_id: string;
  user_id: string;
  title: string;
  tagline: string;
  description: string;
  category: "Service" | "Product" | "Digital" | "Hybrid";
  viability_score: number;
  confidence_factors: string[];
  investment_min: number;
  investment_max: number;
  time_to_revenue: string;
  time_to_launch: string;
  market_analysis: DbMarketAnalysisEnhanced;
  financials: FinancialProjection;
  canadian_resources: CanadianResource[];
  quick_win: string;
  risk_level: "Low" | "Medium" | "High";
  created_at: string;
  // Tier 2+ fields
  swot_analysis?: SWOTAnalysis;
  risk_mitigation?: RiskMitigationItem[];
  pricing_strategy?: PricingStrategy;
  customer_acquisition?: CustomerAcquisitionPlan;
  ninety_day_roadmap?: NinetyDayRoadmap;
}

// Frontend display type
export interface BusinessIdeaDisplay {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: "Service" | "Product" | "Digital" | "Hybrid";
  viabilityScore: number;
  viabilityBreakdown?: ViabilityBreakdown;
  confidenceFactors: string[];
  startupCost: string;
  startupCostBreakdown: StartupCostBreakdown;
  monthlyRevenuePotential: string;
  yearOneProfit: string;
  breakEvenTimeline: string;
  timeToLaunch: string;
  timeToRevenue: string;
  whyItFits: string;
  whyItFitsStructured?: WhyFitStructured;
  localOpportunity: string;
  targetCustomer: string;
  competitors: Competitor[];
  competitiveGap?: string;
  marketSaturation?: string;
  challenges: string[];
  firstSteps: string[];
  thirtyDayPlan: string[];
  canadianResources: CanadianResource[];
  quickWin: string;
  riskLevel: "Low" | "Medium" | "High";
  isFavorite: boolean;
  sessionId: string;
  province?: string;
  marketSignals?: MarketSignals;
  // Tier 2+ fields
  swotAnalysis?: SWOTAnalysis;
  riskMitigation?: RiskMitigationItem[];
  pricingStrategy?: PricingStrategy;
  customerAcquisition?: CustomerAcquisitionPlan;
  ninetyDayRoadmap?: NinetyDayRoadmap;
  // Compatibility with BusinessIdea interface
  potentialRevenue: string;
  localAdvantage: string;
}

import type { Tables } from "@/integrations/supabase/types";

// Database row type from Supabase
export type FtIdeaRow = Tables<'ft_ideas'>;

// Extended market analysis with optional fields
interface ExtendedMarketAnalysis extends DbMarketAnalysisEnhanced {
  why_fit_structured?: WhyFitStructured;
  competitive_gap?: string;
  market_saturation?: string;
}

// Mapper function for enhanced ideas
export function mapDbToDisplay(db: DbEnhancedBusinessIdea | FtIdeaRow, city?: string): BusinessIdeaDisplay {
  const ma = db.market_analysis as ExtendedMarketAnalysis | null;
  const fin = (db as DbEnhancedBusinessIdea).financials;
  const row = db as FtIdeaRow;
  
  const monthlyRevenue = fin 
    ? `$${fin.monthly_revenue_low.toLocaleString()} - $${fin.monthly_revenue_high.toLocaleString()}/month`
    : "Varies based on execution";
  
  return {
    id: db.id,
    name: db.title,
    tagline: db.tagline || `${db.category} business${city ? ` in ${city}` : ""}`,
    description: db.description || "",
    category: (db.category || "Service") as "Service" | "Product" | "Digital" | "Hybrid",
    viabilityScore: db.viability_score || 0,
    viabilityBreakdown: (db as FtIdeaRow & { viability_breakdown?: ViabilityBreakdown }).viability_breakdown,
    confidenceFactors: (db.confidence_factors as string[]) || [],
    startupCost: `$${(db.investment_min || 0).toLocaleString()} - $${(db.investment_max || 0).toLocaleString()} CAD`,
    startupCostBreakdown: fin?.startup_cost_breakdown || { total: db.investment_min || 0 },
    monthlyRevenuePotential: monthlyRevenue,
    yearOneProfit: fin
      ? `$${fin.year_one_profit_low.toLocaleString()} - $${fin.year_one_profit_high.toLocaleString()}`
      : "Depends on execution",
    breakEvenTimeline: fin ? `${fin.break_even_months} months` : "3-6 months typical",
    timeToLaunch: db.time_to_launch || "2-4 weeks",
    timeToRevenue: db.time_to_revenue || "1-3 months",
    whyItFits: ma?.why_fit || "",
    whyItFitsStructured: ma?.why_fit_structured,
    localOpportunity: ma?.local_opportunity || "",
    targetCustomer: ma?.target_customer || "",
    competitors: ma?.competitors || [],
    competitiveGap: ma?.competitive_gap,
    marketSaturation: ma?.market_saturation,
    challenges: ma?.challenges || [],
    firstSteps: ma?.first_steps || [],
    thirtyDayPlan: ma?.thirty_day_action_plan || [],
    canadianResources: (db.canadian_resources as CanadianResource[]) || [],
    quickWin: db.quick_win || "",
    riskLevel: (db.risk_level || "Medium") as "Low" | "Medium" | "High",
    isFavorite: false,
    sessionId: db.session_id,
    marketSignals: row.market_signals as unknown as MarketSignals | undefined,
    // Tier 2+ fields
    swotAnalysis: row.swot_analysis as unknown as SWOTAnalysis | undefined,
    riskMitigation: row.risk_mitigation as unknown as RiskMitigationItem[] | undefined,
    pricingStrategy: row.pricing_strategy as unknown as PricingStrategy | undefined,
    customerAcquisition: row.customer_acquisition as unknown as CustomerAcquisitionPlan | undefined,
    ninetyDayRoadmap: row.ninety_day_roadmap as unknown as NinetyDayRoadmap | undefined,
    // Compatibility fields
    potentialRevenue: monthlyRevenue,
    localAdvantage: ma?.local_opportunity || "",
  };
}

// Legacy market analysis structure
interface LegacyMarketAnalysis {
  why_fit?: string;
  local_notes?: string;
  challenges?: string[];
  first_steps?: string[];
}

// Backwards compatibility mapper for existing ideas (legacy format)
export function mapLegacyIdea(legacy: FtIdeaRow, city?: string): BusinessIdeaDisplay {
  const legacyMa = legacy.market_analysis as LegacyMarketAnalysis | null;
  const localOpp = legacyMa?.local_notes || "";
  return {
    id: legacy.id,
    name: legacy.title,
    tagline: `${legacy.category} business${city ? ` in ${city}` : ""}`,
    description: legacy.description || "",
    category: (legacy.category || "Service") as "Service" | "Product" | "Digital" | "Hybrid",
    viabilityScore: legacy.viability_score || 0,
    confidenceFactors: [],
    startupCost: `$${(legacy.investment_min || 0).toLocaleString()} - $${(legacy.investment_max || 0).toLocaleString()} CAD`,
    startupCostBreakdown: { total: legacy.investment_min || 0 },
    monthlyRevenuePotential: "Varies based on execution",
    yearOneProfit: "Depends on execution",
    breakEvenTimeline: "3-6 months typical",
    timeToLaunch: "2-4 weeks",
    timeToRevenue: legacy.time_to_revenue || "1-3 months",
    whyItFits: legacyMa?.why_fit || "",
    localOpportunity: localOpp,
    targetCustomer: "",
    competitors: [],
    challenges: legacyMa?.challenges || [],
    firstSteps: legacyMa?.first_steps || [],
    thirtyDayPlan: [],
    canadianResources: [],
    quickWin: "",
    riskLevel: "Medium",
    isFavorite: false,
    sessionId: legacy.session_id,
    marketSignals: legacy.market_signals as MarketSignals | undefined,
    // Compatibility fields
    potentialRevenue: "Varies based on execution",
    localAdvantage: localOpp,
  };
}

// Helper to detect if an idea is enhanced (v2) or legacy
export function isEnhancedIdea(idea: FtIdeaRow): boolean {
  return !!idea.tagline || !!idea.confidence_factors || !!idea.financials || !!idea.canadian_resources;
}