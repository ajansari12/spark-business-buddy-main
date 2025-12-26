export interface BusinessIdea {
  id: string;
  name: string;
  tagline: string;
  description: string;
  whyItFits: string;
  startupCost: string;
  potentialRevenue: string;
  timeToLaunch: string;
  firstSteps: string[];
  localAdvantage: string;
  isFavorite?: boolean;
  // New fields
  category: "Service" | "Product" | "Digital" | "Hybrid";
  viabilityScore: number;
  challenges: string[];
  sessionId: string;
}

export interface DbMarketAnalysis {
  why_fit: string;
  local_notes: string;
  challenges: string[];
  first_steps: string[];
}

export interface DbBusinessIdea {
  id: string;
  title: string;
  description: string;
  category: "Service" | "Product" | "Digital" | "Hybrid";
  viability_score: number;
  investment_min: number;
  investment_max: number;
  time_to_revenue: string;
  market_analysis: DbMarketAnalysis;
  session_id: string;
  user_id: string;
  created_at: string;
}

export function mapDbIdeaToBusinessIdea(dbIdea: DbBusinessIdea, city?: string): BusinessIdea {
  return {
    id: dbIdea.id,
    name: dbIdea.title,
    tagline: `${dbIdea.category} business${city ? ` in ${city}` : ""}`,
    description: dbIdea.description,
    whyItFits: dbIdea.market_analysis?.why_fit || "",
    startupCost: `$${dbIdea.investment_min.toLocaleString()} - $${dbIdea.investment_max.toLocaleString()} CAD`,
    potentialRevenue: "Varies based on execution",
    timeToLaunch: dbIdea.time_to_revenue,
    firstSteps: dbIdea.market_analysis?.first_steps || [],
    localAdvantage: dbIdea.market_analysis?.local_notes || "",
    isFavorite: false,
    // New fields
    category: dbIdea.category,
    viabilityScore: dbIdea.viability_score,
    challenges: dbIdea.market_analysis?.challenges || [],
    sessionId: dbIdea.session_id,
  };
}
