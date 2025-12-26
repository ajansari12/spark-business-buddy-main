// ============================================================================
// ENHANCED TYPE DEFINITIONS FOR FASTRACK
// Includes new types for viability breakdown, progressive profiling, etc.
// ============================================================================

// ============================================================================
// CHAT & INTAKE TYPES
// ============================================================================

// Selected trending business from chat (full object for Results page)
export interface SelectedTrendingBusiness {
  business_type: string;
  trend_reason: string;
  estimated_cost_min: number;
  estimated_cost_max: number;
  growth_potential: "High" | "Medium" | "Moderate";
  time_to_launch: string;
  why_trending?: string;
}

export interface FTExtractedData {
  // Required fields
  city: string | null;
  province: string | null;
  skills_background: string | null;
  interests: string | null;
  time_commitment_hours: number | null;
  budget_min: number | null;
  budget_max: number | null;
  income_goal: string | null;
  
  // Optional fields
  constraints: string | null;
  preferred_industries: string[];
  
  // User's selected trending business from chat intake (name only for legacy)
  business_idea?: string | null;
  // Full trending business object with all details
  selected_trending_business?: SelectedTrendingBusiness | null;
  
  // Eligibility fields (for grant matching)
  age_range?: string | null;
  residency_status?: string | null;
  years_in_canada?: string | null;
  
  // Confirmation flag
  user_confirmed?: boolean;
  
  // Legacy fields for backwards compatibility
  skills?: string[];
  budget?: string | null;
  time_commitment?: string | null;
  goals?: string[];
}

export interface FTNextQuestion {
  type: "text" | "select" | "slider" | "multi" | "quick_reply" | "confirm";
  field?: string;
  placeholder?: string;
  prompt?: string;
  options?: Array<{ value: string; label: string } | string>;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  minLabel?: string;
  maxLabel?: string;
}

export type FTSignal =
  | "CONTINUE"
  | "SHOW_TRENDING"
  | "SHOW_QUICK_PREVIEW"
  | "READY_TO_PAY"
  | "READY_TO_GENERATE"
  | "DONE";

export interface FTMeta {
  extracted: Partial<FTExtractedData>;
  progress: number;
  next_question: FTNextQuestion;
  signal: FTSignal;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  ftMeta?: FTMeta;
  error?: boolean;
  pending?: boolean;
}

// ============================================================================
// VIABILITY BREAKDOWN TYPES (NEW)
// ============================================================================

export type ViabilityFactorIcon =
  | "demand"
  | "skills"
  | "budget"
  | "competition"
  | "time";

export interface ViabilityFactor {
  name: string;
  score: number; // 1-10
  reason: string;
  icon: ViabilityFactorIcon;
}

export interface ViabilityBreakdown {
  overall_score: number;
  factors: ViabilityFactor[];
}

// ============================================================================
// BUSINESS IDEA TYPES (ENHANCED)
// ============================================================================

export interface Competitor {
  name: string;
  description?: string;
  price_range?: string;
  weakness?: string;
  website?: string;
  google_rating?: string;
  strengths?: string[];
  weaknesses?: string[];
  is_verified?: boolean;
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
}

export interface MarketSignals {
  demand_indicator: "High" | "Medium" | "Low";
  job_postings?: {
    title: string;
    company: string;
    location: string;
    url: string;
  }[];
  job_posting_count?: number;
  news_sentiment?: "positive" | "neutral" | "negative";
  news_highlights?: string[];
  regulatory_notes?: string;
  recent_closures?: string[];
  recent_openings?: string[];
  citations?: string[];
  last_updated?: string;
}

export interface MarketAnalysis {
  why_fit: string;
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

// Tier 2+ content types
export interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface RiskMitigationItem {
  challenge: string;
  severity: "high" | "medium" | "low";
  mitigations: string[];
  early_warning_signs: string;
}

export interface PricingStrategy {
  recommended_model: "hourly" | "project" | "subscription" | "product";
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
    roi: "high" | "medium" | "low";
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

// Complete enhanced business idea
export interface EnhancedBusinessIdea {
  id: string;
  session_id: string;
  user_id: string;
  
  // Core fields
  title: string;
  tagline: string;
  description: string;
  category: "Service" | "Product" | "Digital" | "Hybrid";
  risk_level: "Low" | "Medium" | "High";
  
  // Viability (enhanced)
  viability_score: number;
  viability_breakdown?: ViabilityBreakdown;
  confidence_factors: string[];
  
  // Investment & Time
  investment_min: number;
  investment_max: number;
  time_to_revenue: string;
  time_to_launch: string;
  
  // Market analysis
  market_analysis: MarketAnalysis;
  market_signals?: MarketSignals;
  
  // Financials
  financials: FinancialProjection;
  
  // Resources
  canadian_resources: CanadianResource[];
  quick_win: string;
  
  // Tier 2+ content
  swot_analysis?: SWOTAnalysis;
  risk_mitigation?: RiskMitigationItem[];
  pricing_strategy?: PricingStrategy;
  customer_acquisition?: CustomerAcquisitionPlan;
  ninety_day_roadmap?: NinetyDayRoadmap;
  
  // Business names (VIP tier)
  business_names?: {
    name: string;
    domain_available?: boolean;
    social_handles?: Record<string, boolean>;
  }[];
  
  // Metadata
  created_at: string;
}

// Display type for frontend
export interface BusinessIdeaDisplay extends Omit<EnhancedBusinessIdea, "id" | "session_id" | "user_id" | "created_at"> {
  id: string;
  name: string; // alias for title
  startupCost: string; // formatted
  monthlyRevenuePotential: string; // formatted
  yearOneProfit: string; // formatted
  breakEvenTimeline: string; // formatted
  whyItFits: string; // alias for market_analysis.why_fit
  localOpportunity: string; // alias
  targetCustomer: string; // alias
  firstSteps: string[]; // alias
  thirtyDayPlan: string[]; // alias
  isFavorite: boolean;
  sessionId: string;
  
  // Compatibility aliases
  potentialRevenue: string;
  localAdvantage: string;
}

// ============================================================================
// PROFILE SUMMARY TYPES (NEW)
// ============================================================================

export interface ProfileSummary {
  location: {
    city: string | null;
    province: string | null;
    formatted: string;
  };
  background: {
    skills: string | null;
    interests: string | null;
  };
  resources: {
    time_hours: number | null;
    budget_min: number | null;
    budget_max: number | null;
    formatted_time: string;
    formatted_budget: string;
  };
  goals: {
    income_goal: string | null;
    constraints: string | null;
  };
  eligibility: {
    age_range: string | null;
    residency_status: string | null;
    years_in_canada: string | null;
  };
  completeness: {
    filled_count: number;
    total_required: number;
    percent: number;
    missing_fields: string[];
  };
}

// Helper to convert FTExtractedData to ProfileSummary
export function toProfileSummary(data: Partial<FTExtractedData>): ProfileSummary {
  const requiredFields = [
    "province",
    "city",
    "skills_background",
    "interests",
    "time_commitment_hours",
    "budget_min",
    "income_goal",
  ];

  const filledFields = requiredFields.filter((field) => {
    const value = data[field as keyof FTExtractedData];
    return value !== null && value !== undefined && value !== "";
  });

  const missingFields = requiredFields.filter(
    (field) => !filledFields.includes(field)
  );

  const formatLocation = () => {
    if (data.city && data.province) return `${data.city}, ${data.province}`;
    return data.city || data.province || "Not specified";
  };

  const formatBudget = () => {
    if (data.budget_min && data.budget_max) {
      return `$${data.budget_min.toLocaleString()} - $${data.budget_max.toLocaleString()} CAD`;
    }
    if (data.budget_min) return `$${data.budget_min.toLocaleString()}+ CAD`;
    if (data.budget_max) return `Up to $${data.budget_max.toLocaleString()} CAD`;
    return "Not specified";
  };

  const formatTime = () => {
    if (data.time_commitment_hours) {
      return `${data.time_commitment_hours} hours/week`;
    }
    return "Not specified";
  };

  return {
    location: {
      city: data.city || null,
      province: data.province || null,
      formatted: formatLocation(),
    },
    background: {
      skills: data.skills_background || null,
      interests: data.interests || null,
    },
    resources: {
      time_hours: data.time_commitment_hours || null,
      budget_min: data.budget_min || null,
      budget_max: data.budget_max || null,
      formatted_time: formatTime(),
      formatted_budget: formatBudget(),
    },
    goals: {
      income_goal: data.income_goal || null,
      constraints: data.constraints || null,
    },
    eligibility: {
      age_range: data.age_range || null,
      residency_status: data.residency_status || null,
      years_in_canada: data.years_in_canada || null,
    },
    completeness: {
      filled_count: filledFields.length,
      total_required: requiredFields.length,
      percent: Math.round((filledFields.length / requiredFields.length) * 100),
      missing_fields: missingFields,
    },
  };
}

// ============================================================================
// PROGRESS SECTION TYPES (NEW)
// ============================================================================

export interface ProgressSection {
  id: string;
  label: string;
  fields: string[];
  startPercent: number;
  endPercent: number;
}

export const PROGRESS_SECTIONS: ProgressSection[] = [
  {
    id: "location",
    label: "Location",
    fields: ["province", "city"],
    startPercent: 0,
    endPercent: 20,
  },
  {
    id: "background",
    label: "Background",
    fields: ["skills_background", "interests"],
    startPercent: 20,
    endPercent: 45,
  },
  {
    id: "commitment",
    label: "Resources",
    fields: ["time_commitment_hours", "budget_min", "budget_max"],
    startPercent: 45,
    endPercent: 75,
  },
  {
    id: "goals",
    label: "Goals",
    fields: ["income_goal"],
    startPercent: 75,
    endPercent: 90,
  },
  {
    id: "confirm",
    label: "Confirm",
    fields: ["user_confirmed"],
    startPercent: 90,
    endPercent: 100,
  },
];

// Calculate progress from collected data
export function calculateProgress(data: Partial<FTExtractedData>): number {
  let progress = 0;

  // Location (0-20%)
  if (data.province) progress += 8;
  if (data.city) progress += 12;

  // Background (20-45%)
  if (data.skills_background) progress += 15;
  if (data.interests) progress += 10;

  // Commitment (45-75%)
  if (data.time_commitment_hours) progress += 10;
  if (data.budget_min) progress += 10;
  if (data.budget_max) progress += 10;

  // Goals (75-90%)
  if (data.income_goal) progress += 15;

  // Confirmation (90-100%)
  if (data.user_confirmed) progress += 10;

  return Math.min(100, progress);
}
