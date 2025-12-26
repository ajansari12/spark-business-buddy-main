import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

// Sanitize user input to prevent prompt injection and XSS
function sanitizeUserInput(input: string): string {
  if (typeof input !== 'string') return String(input || '');
  
  // Remove HTML/script tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove common prompt injection patterns
  const suspiciousPatterns = [
    /ignore\s+(all\s+)?(previous|above|prior)\s+instructions?/gi,
    /disregard\s+(all\s+)?(previous|above|prior)\s+instructions?/gi,
    /forget\s+(all\s+)?(previous|above|prior)\s+instructions?/gi,
    /you\s+are\s+now\s+/gi,
    /new\s+instructions?:/gi,
    /system\s*:\s*/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
    /<<SYS>>/gi,
    /<\/SYS>/gi,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      console.warn("[SECURITY] Suspicious input pattern detected:", input.substring(0, 100));
      sanitized = sanitized.replace(pattern, '[FILTERED]');
    }
  }
  
  return sanitized.trim();
}

// Sanitize all string values in collected data
function sanitizeCollectedData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeUserInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(v => typeof v === 'string' ? sanitizeUserInput(v) : v);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

// Input validation
const inputSchema = z.object({
  session_id: z.string().uuid("Invalid session ID"),
  force_regenerate: z.boolean().optional().default(false),
});

// Enhanced validation schemas
const competitorSchema = z.object({
  name: z.string(),
  description: z.string(),
  price_range: z.string().optional(),
  weakness: z.string().optional(),
  website: z.string().optional(),
  google_rating: z.string().optional(),
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  is_verified: z.boolean().optional(),
});

// Verified competitor from Perplexity search
interface VerifiedCompetitor {
  name: string;
  description: string;
  website?: string;
  google_rating?: string;
  price_range?: string;
  strengths: string[];
  weaknesses: string[];
  is_verified: boolean;
}

interface CompetitorSearchResult {
  competitors: VerifiedCompetitor[];
  competitive_gap: string;
  market_saturation: string;
  citations: string[];
}

// Market signals from ft_market_validation
interface MarketSignals {
  job_posting_count: number;
  job_posting_examples: string[];
  recent_business_activity: {
    openings: string[];
    closures: string[];
  };
  regulatory_notes: string;
  news_sentiment: "positive" | "neutral" | "negative";
  news_highlights: string[];
  demand_indicator: "high" | "moderate" | "low";
  citations: string[];
}

const startupCostBreakdownSchema = z.object({
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

const financialProjectionSchema = z.object({
  startup_cost_breakdown: startupCostBreakdownSchema,
  monthly_expenses: z.number(),
  monthly_revenue_low: z.number(),
  monthly_revenue_high: z.number(),
  break_even_months: z.number(),
  year_one_profit_low: z.number(),
  year_one_profit_high: z.number(),
});

const canadianResourceSchema = z.object({
  name: z.string(),
  type: z.string().transform(val => {
    // Handle combined types like "loan|mentorship" by taking first valid type
    const validTypes = ["grant", "loan", "program", "guide"];
    const parts = val.split(/[|,\/]/);
    for (const part of parts) {
      const cleaned = part.trim().toLowerCase();
      if (validTypes.includes(cleaned)) return cleaned as "grant" | "loan" | "program" | "guide";
    }
    return "program" as const; // default fallback
  }),
  description: z.string(),
  url: z.string().optional(),
  funding_amount: z.string().optional(),
});

const marketAnalysisSchema = z.object({
  why_fit: z.string(),
  local_opportunity: z.string(),
  target_customer: z.string(),
  market_size_local: z.string().optional(),
  competitors: z.array(competitorSchema).min(1).max(5), // relaxed min
  challenges: z.array(z.string()).min(1).max(5), // relaxed min
  first_steps: z.array(z.string()).min(1).max(8), // relaxed min
  thirty_day_action_plan: z.array(z.string()).min(1).max(10), // relaxed min
});

// Viability breakdown schema - explains how the viability score was calculated
const viabilityFactorSchema = z.object({
  score: z.number().min(1).max(10),
  reason: z.string(),
});

const viabilityBreakdownSchema = z.object({
  market_demand: viabilityFactorSchema,
  skill_match: viabilityFactorSchema,
  budget_fit: viabilityFactorSchema,
  competition: viabilityFactorSchema,
  time_realistic: viabilityFactorSchema,
}).optional();

const enhancedIdeaSchema = z.object({
  title: z.string().min(3).max(150), // increased max
  tagline: z.string().min(5).max(200), // increased max, reduced min
  description: z.string().min(20).max(600), // increased max, reduced min
  category: z.enum(["Service", "Product", "Digital", "Hybrid"]),
  viability_score: z.number().min(1).max(10),
  viability_breakdown: viabilityBreakdownSchema,
  confidence_factors: z.array(z.string()).min(1).max(6), // relaxed
  investment_min: z.number().int().min(0),
  investment_max: z.number().int().min(0),
  time_to_revenue: z.string(),
  time_to_launch: z.string(),
  market_analysis: marketAnalysisSchema,
  financials: financialProjectionSchema,
  canadian_resources: z.array(canadianResourceSchema).min(1).max(6), // relaxed
  quick_win: z.string().min(10).max(400), // increased max, reduced min
  risk_level: z.enum(["Low", "Medium", "High"]),
});

const ideasArraySchema = z.array(enhancedIdeaSchema).min(3).max(7); // allow 3-7 ideas instead of exactly 5

// Eligibility helper functions
function getAgeFromRange(ageRange: string | undefined): number {
  if (!ageRange) return 40; // default middle age
  const rangeMap: Record<string, number> = {
    "18-29": 25,
    "30-39": 35,
    "40-49": 45,
    "50-59": 55,
    "60+": 65,
  };
  return rangeMap[ageRange] || 40;
}

function getYearsFromStatus(yearsInCanada: string | undefined): number {
  if (!yearsInCanada) return 99; // default to long-time resident
  const yearsMap: Record<string, number> = {
    "born_here": 99,
    "less_than_1": 0.5,
    "1_to_3": 2,
    "3_to_5": 4,
    "more_than_5": 99, // Changed from 10 to 99 - "more than 5" could mean 6 or 60 years
  };
  return yearsMap[yearsInCanada] || 99;
}

function normalizeResidencyStatus(status: string | undefined): string {
  if (!status) return "citizen";
  const statusMap: Record<string, string> = {
    "Canadian Citizen": "citizen",
    "citizen": "citizen",
    "Permanent Resident": "pr",
    "pr": "pr",
    "Work Permit": "work_permit",
    "work_permit": "work_permit",
    "Student Visa": "student",
    "student": "student",
    "Other": "other",
    "other": "other",
  };
  return statusMap[status] || "citizen";
}

interface Grant {
  id: string;
  name: string;
  organization: string;
  province: string | null;
  type: string;
  amount_min: number | null;
  amount_max: number | null;
  funding_description: string | null;
  eligibility_age_min: number;
  eligibility_age_max: number;
  eligibility_citizen_required: boolean;
  eligibility_pr_eligible: boolean;
  eligibility_newcomer_max_years: number | null;
  eligibility_indigenous_only: boolean;
  eligibility_notes: string | null;
  application_url: string;
  status: string;
  description: string | null;
  why_apply: string | null;
}

interface EligibilityResult {
  eligible: Grant[];
  ineligible: Array<Grant & { ineligibility_reason: string }>;
}

function filterGrantsByEligibility(
  grants: Grant[],
  userAge: number,
  isCitizenOrPR: boolean,
  yearsInCanada: number,
  isIndigenous: boolean
): EligibilityResult {
  const eligible: Grant[] = [];
  const ineligible: Array<Grant & { ineligibility_reason: string }> = [];

  for (const grant of grants) {
    const reasons: string[] = [];

    // Age check
    if (userAge < grant.eligibility_age_min || userAge > grant.eligibility_age_max) {
      reasons.push(`Ages ${grant.eligibility_age_min}-${grant.eligibility_age_max} only`);
    }

    // Citizenship check
    if (grant.eligibility_citizen_required && !isCitizenOrPR) {
      reasons.push("Canadian citizen or PR required");
    }
    if (!grant.eligibility_pr_eligible && !isCitizenOrPR) {
      reasons.push("Citizen only (PR not eligible)");
    }

    // NEW: Exclude citizens from foreigner-only programs (like Startup Visa)
    // Programs where both citizen_required=false AND pr_eligible=false are for non-residents only
    if (!grant.eligibility_citizen_required && !grant.eligibility_pr_eligible && isCitizenOrPR) {
      reasons.push("For non-Canadian entrepreneurs only");
    }

    // Newcomer check - use >= instead of > to correctly exclude at the boundary
    if (grant.eligibility_newcomer_max_years !== null && yearsInCanada >= grant.eligibility_newcomer_max_years) {
      reasons.push(`For newcomers (within ${grant.eligibility_newcomer_max_years} years)`);
    }

    // Indigenous check
    if (grant.eligibility_indigenous_only && !isIndigenous) {
      reasons.push("Indigenous entrepreneurs only");
    }

    if (reasons.length === 0) {
      eligible.push(grant);
    } else {
      ineligible.push({ ...grant, ineligibility_reason: reasons.join("; ") });
    }
  }

  return { eligible, ineligible };
}

function buildEnhancedPrompt(
  collectedData: Record<string, unknown>, 
  profile: any,
  eligibleGrants: Grant[],
  ineligibleGrants: Array<Grant & { ineligibility_reason: string }>
): string {
  const city = collectedData.city || profile?.city || "their city";
  const province = collectedData.province || profile?.province || "their province";
  const skillsArray = collectedData.skills as string[] | undefined;
  const skills = collectedData.skills_background || skillsArray?.join(", ") || "Not specified";
  const interests = collectedData.interests || "Not specified";
  const timeCommitment = collectedData.time_commitment_hours || collectedData.time_commitment || "20";
  const budgetMin = collectedData.budget_min || 1000;
  const budgetMax = collectedData.budget_max || collectedData.budget || 25000;
  const goalsArray = collectedData.goals as string[] | undefined;
  const incomeGoal = collectedData.income_goal || goalsArray?.join(", ") || "$3,000-5,000/month";
  const constraints = collectedData.constraints || "None specified";
  const industriesArray = collectedData.preferred_industries as string[] | undefined;
  const preferredIndustries = industriesArray?.join(", ") || "Open to suggestions";

  // Format eligible grants for prompt
  const eligibleGrantsText = eligibleGrants.length > 0
    ? eligibleGrants.map(g => 
        `- ${g.name} (${g.type}): ${g.funding_description || g.description || ''} | URL: ${g.application_url}`
      ).join('\n')
    : "- BDC Small Business Loan: General financing for Canadian businesses | URL: https://www.bdc.ca/";

  return `You are a Canadian small business consultant with deep knowledge of local markets, regulations, and funding opportunities. Generate exactly 5 HIGHLY SPECIFIC and ACTIONABLE business ideas for this person.

## USER PROFILE
- **Location:** ${city}, ${province}, Canada
- **Skills & Background:** ${skills}
- **Interests (stated):** ${interests}
- **Time Available:** ${timeCommitment} hours/week
- **Startup Budget:** $${budgetMin} - $${budgetMax} CAD
- **Income Goal:** ${incomeGoal}
- **Constraints:** ${constraints}
- **Industry Preferences:** ${preferredIndustries}

## ELIGIBLE CANADIAN RESOURCES (user qualifies for these - USE THESE)
${eligibleGrantsText}

${ineligibleGrants.length > 0 ? `
## NOT ELIGIBLE (do not recommend these):
${ineligibleGrants.slice(0, 5).map(g => `- ${g.name}: ${g.ineligibility_reason}`).join('\n')}
` : ''}

## YOUR TASK
Generate 5 business ideas that are:
1. **Hyper-specific** - Not "consulting" but "HR compliance consulting for dental practices"
2. **Validated** - Reference real businesses doing this successfully
3. **Achievable** - Within their budget and time constraints
4. **Local-aware** - Consider ${city}, ${province} market conditions
5. **Actionable** - Include concrete next steps they can take THIS WEEK

## CRITICAL REQUIREMENTS

### For Each Idea, You MUST Include:

**1. Competitors (2-3 real or realistic examples)**
- Name actual businesses or describe the typical competitor
- Include their approximate pricing if known
- Identify a weakness your user could exploit

**2. Financial Projections (be specific, not vague)**
- Break down startup costs by category
- Estimate realistic monthly revenue range (low/high)
- Calculate months to break even
- Project first-year profit potential

**3. Canadian Resources (2-3 from the ELIGIBLE list above)**
- ONLY use resources from the ELIGIBLE list above
- Include the exact URL provided
- These are pre-filtered for the user's eligibility

**4. 30-Day Action Plan (5-7 specific tasks)**
- Week 1: Research and validation tasks
- Week 2: Legal/setup tasks
- Week 3: Build/prepare tasks
- Week 4: Launch/marketing tasks

**5. Quick Win**
- One specific action they can take TODAY to start generating revenue or validating the idea

## OUTPUT FORMAT
Return ONLY a valid JSON array with exactly 5 objects. No markdown, no explanations, just the JSON.

Each object must follow this exact structure:
{
  "title": "Specific Business Name/Concept",
  "tagline": "One compelling sentence (max 120 chars)",
  "description": "2-3 sentences explaining the business model and value proposition",
  "category": "Service|Product|Digital|Hybrid",
  "viability_score": 7.5,
  "viability_breakdown": {
    "market_demand": {"score": 8, "reason": "High demand shown by 45 job postings in ${city}"},
    "skill_match": {"score": 9, "reason": "User's ${skills} directly applies"},
    "budget_fit": {"score": 7, "reason": "$8k startup uses 53% of $15k budget"},
    "competition": {"score": 6, "reason": "12 competitors but clear gaps exist"},
    "time_realistic": {"score": 8, "reason": "18 hrs/week matches user's ${timeCommitment} hours"}
  },
  "confidence_factors": ["Must reference ONLY explicitly stated skills/interests - no inferred traits"],
  "investment_min": 5000,
  "investment_max": 15000,
  "time_to_revenue": "2-4 weeks",
  "time_to_launch": "1-2 weeks",
  "market_analysis": {
    "why_fit": "MUST quote or closely reference ONLY the user's explicitly stated skills (${skills}) and interests (${interests}) - do NOT infer additional traits",
    "why_fit_structured": {
      "skill_reference": "Your 10 years in ${skills} → supplier negotiation skills",
      "budget_reference": "$8.5k startup uses 57% of your $${budgetMax} budget",
      "time_reference": "${timeCommitment} hrs/week matches your availability",
      "location_reference": "340k households in ${city} within 30km"
    },
    "local_opportunity": "Specific opportunity in ${city}, ${province}",
    "target_customer": "Exact customer avatar with demographics",
    "market_size_local": "Estimated number of potential customers locally",
    "competitors": [
      {"name": "Competitor Name", "description": "What they do", "price_range": "$X-$Y", "weakness": "Gap you can fill"},
      {"name": "Another Competitor", "description": "Brief description", "weakness": "Their weakness"}
    ],
    "challenges": ["Specific challenge 1", "Specific challenge 2"],
    "first_steps": ["Step 1 with details", "Step 2 with details", "Step 3", "Step 4"],
    "thirty_day_action_plan": [
      "Day 1-3: Specific task",
      "Day 4-7: Next task",
      "Week 2: Task description",
      "Week 3: Task description",
      "Week 4: Launch task"
    ]
  },
  "financials": {
    "startup_cost_breakdown": {
      "equipment": 2000,
      "licensing": 500,
      "marketing": 1000,
      "insurance": 800,
      "total": 4300
    },
    "monthly_expenses": 500,
    "monthly_revenue_low": 3000,
    "monthly_revenue_high": 6000,
    "break_even_months": 2,
    "year_one_profit_low": 20000,
    "year_one_profit_high": 50000
  },
  "canadian_resources": [
    {"name": "Program Name", "type": "grant|loan|program|guide", "description": "Brief description", "url": "https://example.ca/program", "funding_amount": "$X", "is_eligible": true},
    {"name": "Another Resource", "type": "program", "description": "Description", "url": "https://example.ca/resource", "is_eligible": true}
  ],
  "quick_win": "Specific action they can take TODAY to start (e.g., 'Post in 3 local Facebook groups offering a free consultation')",
  "risk_level": "Low|Medium|High"
}

IMPORTANT: 
- Every canadian_resource MUST include a "url" field with a real URL from the ELIGIBLE list above
- Set "is_eligible": true for all resources since they're pre-filtered

## IMPORTANT RULES
1. All currency in CAD
2. Be realistic - don't promise unrealistic returns
3. investment_min and investment_max must be integers
4. viability_score must be a decimal between 1.0 and 10.0
5. Include at least ONE low-risk/low-investment option
6. Include at least ONE higher-potential option
7. Include at least ONE digital/remote option
8. Make competitor examples realistic for ${province}
9. Return ONLY the JSON array - no other text

## DATA INTEGRITY REQUIREMENTS (CRITICAL - READ CAREFULLY)

YOU MUST ONLY REFERENCE DATA THE USER EXPLICITLY STATED:

**User's Stated Skills:** ${skills}
**User's Stated Interests:** ${interests}
**User's Stated Industry Preferences:** ${preferredIndustries}

### DO NOT (these are hallucinations):
- Infer, assume, or extrapolate additional interests beyond what is listed above
- Add descriptors like "creative", "artistic", "entrepreneurial", "passionate" unless the user explicitly used those words
- Connect the user to customer segments (artisans, artists, seniors, etc.) they never mentioned wanting to serve
- Claim the user has "experience" or "background" in areas they didn't specifically state
- Say things like "given your creative interests" when they only said "web designing"

### DO (these are accurate):
- Quote or closely paraphrase the user's exact words when explaining why_fit
- Use phrases like "Based on your stated skill in web designing..." NOT "Given your creative passion..."
- If an idea doesn't directly relate to stated skills/interests, be honest: "This complements your budget and location" 
- Keep confidence_factors focused on explicitly stated data only`;
}

const RETRY_PROMPT = `Your previous response was not valid JSON or didn't meet all requirements.

Return ONLY a raw JSON array with exactly 5 objects.
- No markdown code blocks
- No explanations
- Every field must be present
- All numbers must be valid (no NaN, no strings where numbers expected)
- competitors array must have 2-3 items
- canadian_resources array must have 2-3 items
- thirty_day_action_plan must have 5-7 items`;

async function callAI(prompt: string, apiKey: string, isRetry = false, maxTokens = 16000): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { 
          role: "system", 
          content: "You are a Canadian small business expert. Return only valid JSON arrays. No markdown, no explanations. CRITICAL: You must complete the entire JSON response - do not truncate." 
        },
        { role: "user", content: isRetry ? prompt + "\n\n" + RETRY_PROMPT : prompt },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 429) throw new Error("RATE_LIMIT");
    if (status === 402) throw new Error("CREDITS_EXHAUSTED");
    throw new Error(`AI_ERROR:${status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  
  // Check if response was truncated (finish_reason !== 'stop')
  const finishReason = data.choices?.[0]?.finish_reason;
  if (finishReason === 'length') {
    console.warn("AI response was truncated due to max_tokens limit");
  }
  
  return content;
}

function parseIdeasFromResponse(content: string): z.infer<typeof ideasArraySchema> | null {
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("No JSON array found in response");
      return null;
    }
    
    let jsonStr = jsonMatch[0];
    
    // Comprehensive JSON sanitization
    // 1. Remove trailing commas before ] or }
    jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
    
    // 2. Fix unescaped newlines inside strings (common AI issue)
    // Replace newlines that appear inside string values with escaped newlines
    jsonStr = jsonStr.replace(/"([^"]*?)"/gs, (match, content) => {
      const sanitized = content
        .replace(/\r\n/g, '\\n')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\n')
        .replace(/\t/g, '\\t');
      return `"${sanitized}"`;
    });
    
    // 3. Remove control characters that break JSON
    jsonStr = jsonStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
    
    // 4. Try to fix common quote issues (smart quotes to regular quotes)
    jsonStr = jsonStr.replace(/[""]/g, '"');
    jsonStr = jsonStr.replace(/['']/g, "'");
    
    console.log("Attempting to parse sanitized JSON, length:", jsonStr.length);
    
    const parsed = JSON.parse(jsonStr);
    const validated = ideasArraySchema.parse(parsed);
    console.log("Successfully parsed and validated", validated.length, "ideas");
    return validated;
  } catch (error) {
    console.error("Failed to parse/validate ideas:", error);
    if (error instanceof z.ZodError) {
      console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
    }
    // Log a snippet of the problematic JSON for debugging
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      console.error("JSON snippet near error:", jsonMatch[0].substring(30000, 31200));
    }
    return null;
  }
}

// Generate default viability breakdown if AI doesn't provide one
function generateDefaultViabilityBreakdown(
  idea: z.infer<typeof enhancedIdeaSchema>,
  userProfile: {
    budget_max?: number;
    time_commitment_hours?: number;
    skills_background?: string;
    city?: string;
  }
): {
  market_demand: { score: number; reason: string };
  skill_match: { score: number; reason: string };
  budget_fit: { score: number; reason: string };
  competition: { score: number; reason: string };
  time_realistic: { score: number; reason: string };
} {
  const baseScore = idea.viability_score || 7;

  // Market Demand - based on viability score with some variance
  const demandScore = Math.min(10, Math.max(5, baseScore + (Math.random() - 0.5) * 2));

  // Skill Match - infer from why_fit length/quality
  const whyFitLength = idea.market_analysis?.why_fit?.length || 0;
  const skillScore = whyFitLength > 200 ? 8 : whyFitLength > 100 ? 7 : 6;

  // Budget Fit - calculate from financials
  let budgetScore = 7;
  const totalCost = idea.financials?.startup_cost_breakdown?.total;
  if (totalCost && userProfile.budget_max) {
    const ratio = totalCost / userProfile.budget_max;
    if (ratio <= 0.5) budgetScore = 10;
    else if (ratio <= 0.7) budgetScore = 9;
    else if (ratio <= 0.9) budgetScore = 8;
    else if (ratio <= 1.0) budgetScore = 7;
    else if (ratio <= 1.2) budgetScore = 5;
    else budgetScore = 3;
  }

  // Competition - based on competitor count
  const competitorCount = Array.isArray(idea.market_analysis?.competitors)
    ? idea.market_analysis.competitors.length
    : 3;
  const competitionScore = competitorCount <= 3 ? 9 : competitorCount <= 5 ? 7 : 5;

  // Time Realistic - based on hours available
  const hours = userProfile.time_commitment_hours || 20;
  const timeScore = hours >= 30 ? 9 : hours >= 20 ? 8 : hours >= 15 ? 7 : 5;

  return {
    market_demand: {
      score: Math.round(demandScore * 10) / 10,
      reason: `Based on local market analysis in ${userProfile.city || "your area"}`,
    },
    skill_match: {
      score: skillScore,
      reason: `Based on your stated background: ${userProfile.skills_background || "your experience"}`,
    },
    budget_fit: {
      score: budgetScore,
      reason: totalCost
        ? `$${totalCost.toLocaleString()} startup cost vs your $${userProfile.budget_max?.toLocaleString() || "N/A"} budget`
        : "Based on typical startup costs",
    },
    competition: {
      score: competitionScore,
      reason: `${competitorCount} direct competitors identified in your area`,
    },
    time_realistic: {
      score: timeScore,
      reason: `${hours} hours/week available vs typical requirements`,
    },
  };
}

// Resource with eligibility info
interface ResourceWithEligibility {
  name: string;
  type: "grant" | "loan" | "program" | "guide";
  description: string;
  url?: string;
  funding_amount?: string;
  is_eligible: boolean;
  eligibility_reason?: string;
}

// Enrich ideas with eligibility-filtered grants - now includes both eligible and ineligible
function enrichWithEligibleGrants(
  ideas: z.infer<typeof ideasArraySchema>, 
  eligibleGrants: Grant[],
  ineligibleGrants: Array<Grant & { ineligibility_reason: string }>
): z.infer<typeof ideasArraySchema> {
  // Build a URL lookup from eligible grants
  const grantUrlMap: Record<string, { url: string; type: string; description: string; funding: string }> = {};
  eligibleGrants.forEach(g => {
    grantUrlMap[g.name.toLowerCase()] = {
      url: g.application_url,
      type: g.type,
      description: g.description || '',
      funding: g.funding_description || ''
    };
  });
  
  return ideas.map(idea => {
    const resources: ResourceWithEligibility[] = [];
    
    // Add eligible grants first (up to 4)
    const eligibleToAdd = eligibleGrants.slice(0, 4);
    eligibleToAdd.forEach(g => {
      resources.push({
        name: g.name,
        type: g.type as "grant" | "loan" | "program" | "guide",
        description: g.description || g.why_apply || '',
        url: g.application_url,
        funding_amount: g.funding_description || undefined,
        is_eligible: true,
      });
    });
    
    // Add top ineligible grants with reasons (up to 3) for transparency
    const ineligibleToAdd = ineligibleGrants.slice(0, 3);
    ineligibleToAdd.forEach(g => {
      resources.push({
        name: g.name,
        type: g.type as "grant" | "loan" | "program" | "guide",
        description: g.description || g.why_apply || '',
        url: g.application_url,
        funding_amount: g.funding_description || undefined,
        is_eligible: false,
        eligibility_reason: g.ineligibility_reason,
      });
    });
    
    // Replace AI-generated resources with our eligibility-aware ones
    idea.canadian_resources = resources as any;
    
    return idea;
  });
}

// Search for real competitors using Perplexity
async function searchRealCompetitors(
  businessType: string,
  city: string,
  province: string,
  count: number = 5
): Promise<CompetitorSearchResult | null> {
  const functionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/ft_search_competitors`;
  console.log(`[searchRealCompetitors] Calling: ${functionUrl}`);
  console.log(`[searchRealCompetitors] Params: business_type="${businessType}", city="${city}", province="${province}", count=${count}`);
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const response = await fetch(`${supabaseUrl}/functions/v1/ft_search_competitors`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        business_type: businessType,
        city,
        province,
        count,
      }),
    });

    console.log(`[searchRealCompetitors] Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[searchRealCompetitors] FAILED: status=${response.status}, body=${errorText}`);
      return null;
    }

    const result = await response.json();
    console.log(`[searchRealCompetitors] SUCCESS: Found ${result.competitors?.length || 0} competitors`);
    if (result.competitors?.[0]) {
      console.log(`[searchRealCompetitors] Sample competitor: name="${result.competitors[0].name}", google_rating="${result.competitors[0].google_rating}", is_verified=${result.competitors[0].is_verified}`);
    }
    
    return result;
  } catch (error) {
    console.error('[searchRealCompetitors] ERROR:', error);
    return null;
  }
}

// Search for market validation signals using Perplexity
async function searchMarketValidation(
  businessType: string,
  city: string,
  province: string
): Promise<MarketSignals | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const response = await fetch(`${supabaseUrl}/functions/v1/ft_market_validation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        business_type: businessType,
        city,
        province,
      }),
    });

    if (!response.ok) {
      console.error(`Market validation failed: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting market validation:', error);
    return null;
  }
}

// Enrich ideas with verified competitor data
async function enrichWithVerifiedCompetitors(
  ideas: z.infer<typeof ideasArraySchema>,
  city: string,
  province: string,
  competitorCount: number = 5
): Promise<z.infer<typeof ideasArraySchema>> {
  const enrichedIdeas = [];

  for (const idea of ideas) {
    console.log(`Searching ${competitorCount} competitors for: ${idea.title}`);
    
    // Search for real competitors for this idea
    const competitorData = await searchRealCompetitors(idea.title, city, province, competitorCount);
    
    if (competitorData && competitorData.competitors && competitorData.competitors.length > 0) {
      console.log(`Found ${competitorData.competitors.length} verified competitors for ${idea.title}`);
      
      // Replace AI-generated competitors with verified ones
      const verifiedCompetitors = competitorData.competitors.slice(0, competitorCount).map(c => ({
        name: c.name,
        description: c.description,
        price_range: c.price_range,
        weakness: c.weaknesses?.[0] || undefined,
        website: c.website,
        google_rating: c.google_rating,
        strengths: c.strengths,
        weaknesses: c.weaknesses,
        is_verified: true,
      }));

      // Keep some AI-generated competitors if we have fewer than 2 verified
      const existingCompetitors = verifiedCompetitors.length < 2 
        ? idea.market_analysis.competitors.slice(0, 2 - verifiedCompetitors.length).map(c => ({
            ...c,
            is_verified: false
          }))
        : [];

      idea.market_analysis = {
        ...idea.market_analysis,
        competitors: [...verifiedCompetitors, ...existingCompetitors],
        competitive_gap: competitorData.competitive_gap || idea.market_analysis.local_opportunity,
        market_saturation: competitorData.market_saturation,
      } as any; // Cast to avoid type issues with extended market_analysis
    } else {
      // Mark AI-generated competitors as not verified
      idea.market_analysis.competitors = idea.market_analysis.competitors.map(c => ({
        ...c,
        is_verified: false
      }));
    }

    enrichedIdeas.push(idea);
  }

  return enrichedIdeas as z.infer<typeof ideasArraySchema>;
}

// ============= TIER 2+ CONTENT GENERATION =============

interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

interface RiskMitigationItem {
  challenge: string;
  severity: 'high' | 'medium' | 'low';
  mitigations: string[];
  early_warning_signs: string;
}

interface PricingStrategy {
  recommended_model: string;
  price_range: { low: string; mid: string; premium: string };
  rationale: string;
  competitor_comparison: string;
  discounting_strategy: string;
}

async function generateSWOTAnalysis(
  idea: z.infer<typeof enhancedIdeaSchema>,
  collectedData: Record<string, unknown>,
  apiKey: string
): Promise<SWOTAnalysis | null> {
  const prompt = `Create a SWOT analysis for this business opportunity. Return ONLY valid JSON.

Business: ${idea.title}
Description: ${idea.description}
User's Skills: ${collectedData.skills_background || 'Not specified'}
User's Constraints: ${collectedData.constraints || 'None specified'}
Location: ${collectedData.city || 'their city'}, ${collectedData.province || 'their province'}
Budget: $${collectedData.budget_min || 5000} - $${collectedData.budget_max || 25000} CAD
Competitors: ${idea.market_analysis.competitors.slice(0, 3).map(c => c.name).join(', ')}

Return ONLY this JSON structure, no markdown:
{
  "strengths": ["2-4 strengths based on user's actual skills and market position"],
  "weaknesses": ["2-4 weaknesses based on user's constraints or resource gaps"],
  "opportunities": ["2-4 market opportunities specific to their location"],
  "threats": ["2-4 external threats from competitors or market conditions"]
}`;

  try {
    const response = await callAI(prompt, apiKey);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as SWOTAnalysis;
    }
  } catch (error) {
    console.error('SWOT generation failed:', error);
  }
  return null;
}

async function generateRiskMitigation(
  challenges: string[],
  apiKey: string
): Promise<RiskMitigationItem[] | null> {
  const prompt = `For each business challenge, provide specific mitigation strategies. Return ONLY valid JSON array.

Challenges:
${challenges.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Return ONLY this JSON array, no markdown:
[
  {
    "challenge": "The challenge text",
    "severity": "high" | "medium" | "low",
    "mitigations": ["Specific strategy 1", "Specific strategy 2"],
    "early_warning_signs": "What to watch for"
  }
]`;

  try {
    const response = await callAI(prompt, apiKey);
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as RiskMitigationItem[];
    }
  } catch (error) {
    console.error('Risk mitigation generation failed:', error);
  }
  return null;
}

async function generatePricingStrategy(
  idea: z.infer<typeof enhancedIdeaSchema>,
  apiKey: string
): Promise<PricingStrategy | null> {
  const competitorPrices = idea.market_analysis.competitors
    .filter(c => c.price_range)
    .map(c => `${c.name}: ${c.price_range}`)
    .join(', ');

  const prompt = `Create a pricing strategy for this business. Return ONLY valid JSON.

Business: ${idea.title}
Category: ${idea.category}
Competitor Prices: ${competitorPrices || 'Not available'}
Target Customer: ${idea.market_analysis.target_customer}

Return ONLY this JSON structure, no markdown:
{
  "recommended_model": "hourly" | "project" | "subscription" | "product",
  "price_range": {
    "low": "$X (budget clients)",
    "mid": "$Y (standard)",
    "premium": "$Z (premium service)"
  },
  "rationale": "Why this pricing makes sense for the market",
  "competitor_comparison": "How pricing compares to competitors",
  "discounting_strategy": "When and how to offer discounts"
}`;

  try {
    const response = await callAI(prompt, apiKey);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as PricingStrategy;
    }
  } catch (error) {
    console.error('Pricing strategy generation failed:', error);
  }
  return null;
}

// Customer Acquisition Plan Generator
interface CustomerAcquisitionPlan {
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

async function generateCustomerAcquisition(
  idea: z.infer<typeof enhancedIdeaSchema>,
  collectedData: Record<string, unknown>,
  apiKey: string
): Promise<CustomerAcquisitionPlan | null> {
  const prompt = `Create a customer acquisition plan for getting the first 10 customers. Return ONLY valid JSON.

Business: ${idea.title}
Category: ${idea.category}
Target Customer: ${idea.market_analysis.target_customer}
User's Budget: $${collectedData.budget_min || 5000} - $${collectedData.budget_max || 25000} CAD
Location: ${collectedData.city || 'their city'}, ${collectedData.province || 'their province'}

Return ONLY this JSON structure, no markdown:
{
  "first_10_strategy": {
    "week_1": ["2-3 specific tasks to start outreach"],
    "week_2": ["2-3 follow-up and expansion tasks"],
    "week_3": ["2-3 tasks to close first sales"],
    "week_4": ["2-3 tasks to secure referrals"]
  },
  "marketing_channels": [
    {
      "channel": "Channel name (e.g., LinkedIn, Local networking)",
      "roi": "high" | "medium" | "low",
      "cost": "$X/month or Free",
      "time_investment": "X hours/week"
    }
  ],
  "outreach_scripts": {
    "cold_email": "Short email template (2-3 sentences)",
    "linkedin": "Short LinkedIn message template"
  },
  "referral_strategy": "How to incentivize referrals from first customers"
}`;

  try {
    const response = await callAI(prompt, apiKey);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as CustomerAcquisitionPlan;
    }
  } catch (error) {
    console.error('Customer acquisition generation failed:', error);
  }
  return null;
}

// 90-Day Roadmap Generator
interface NinetyDayRoadmapWeek {
  week: number;
  theme: string;
  tasks: string[];
  milestone: string;
  kpi: string;
  decision_point?: string;
}

interface NinetyDayRoadmap {
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

async function generateNinetyDayRoadmap(
  idea: z.infer<typeof enhancedIdeaSchema>,
  apiKey: string
): Promise<NinetyDayRoadmap | null> {
  const prompt = `Create a 90-day launch roadmap with weekly milestones. Return ONLY valid JSON.

Business: ${idea.title}
Category: ${idea.category}
Time to Launch: ${idea.time_to_launch}
First Steps: ${idea.market_analysis.first_steps.slice(0, 3).join(', ')}

Return ONLY this JSON structure, no markdown:
{
  "weeks": [
    {
      "week": 1,
      "theme": "Foundation & Research",
      "tasks": ["Task 1", "Task 2", "Task 3"],
      "milestone": "What should be done by end of week",
      "kpi": "Measurable target"
    }
  ],
  "monthly_kpis": {
    "month_1": [{"metric": "KPI name", "target": "Target value"}],
    "month_2": [{"metric": "KPI name", "target": "Target value"}],
    "month_3": [{"metric": "KPI name", "target": "Target value"}]
  },
  "go_no_go_checkpoints": [
    {
      "week": 4,
      "question": "Should I continue or pivot?",
      "green_light": "Proceed if...",
      "red_flag": "Reconsider if..."
    }
  ]
}

Generate 12 weeks (one per week) with realistic milestones. Include go/no-go checkpoints at weeks 4, 8, and 12.`;

  try {
    const response = await callAI(prompt, apiKey);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as NinetyDayRoadmap;
    }
  } catch (error) {
    console.error('90-day roadmap generation failed:', error);
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const parseResult = inputSchema.safeParse(body);
    
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: parseResult.error.errors[0].message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { session_id, force_regenerate } = parseResult.data;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    console.log(`[ft_generate_ideas_v2] User ${userId} requesting ideas for session ${session_id}`);

    const { data: session, error: sessionError } = await supabase
      .from("ft_sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (sessionError || !session) {
      console.error("Session not found:", sessionError);
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (session.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate that session has minimum required data before generating
    const collectedData = session.collected_data || {};
    
    // Check for alternative field names - interests is now optional
    const hasSkills = collectedData.skills_background || collectedData.skills;
    const hasBudget = (collectedData.budget_min && collectedData.budget_max) || collectedData.budget;
    const hasInterests = collectedData.interests || collectedData.preferred_industries;
    
    // Only skills and budget are truly required - we can infer interests from skills/goals
    if (!hasSkills || !hasBudget) {
      const missing = [];
      if (!hasSkills) missing.push('skills/background');
      if (!hasBudget) missing.push('budget');
      
      console.error("Session missing critical data:", missing, "Collected data:", JSON.stringify(collectedData));
      return new Response(
        JSON.stringify({ 
          error: `Incomplete intake data. Missing: ${missing.join(', ')}. Please complete the chat intake first.`,
          missing_fields: missing,
          collected_data: collectedData
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Log if interests is missing but we're proceeding anyway
    if (!hasInterests) {
      console.log("Note: 'interests' field is missing, but proceeding with idea generation using available data");
    }

    console.log("Session has required data:", JSON.stringify(collectedData));

    // Check for existing ideas (idempotency) - skip if force_regenerate
    if ((session.status === "ideas_generated" || session.status === "completed") && !force_regenerate) {
      console.log("Ideas already generated, returning existing");
      const { data: existingIdeas } = await supabase
        .from("ft_ideas")
        .select("*")
        .eq("session_id", session_id)
        .order("created_at", { ascending: true });

      return new Response(
        JSON.stringify({ ideas: existingIdeas || [], version: "v2" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (force_regenerate) {
      console.log("[ft_generate_ideas] Force regenerate requested, bypassing idempotency check");
    }

    // Payment verification - TEMPORARILY DISABLED FOR TESTING
    /*
    const { data: paidOrder } = await supabase
      .from("ft_orders")
      .select("*")
      .eq("session_id", session_id)
      .eq("tier", "tier1")
      .eq("status", "paid")
      .limit(1)
      .single();

    if (!paidOrder) {
      return new Response(
        JSON.stringify({ error: "Payment required to generate ideas" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    */
    console.log("[TESTING MODE] Payment check bypassed");

    // Rate limiting - TEMPORARILY DISABLED FOR TESTING
    /*
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentGenerations } = await supabase
      .from("ft_events")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("event_name", "ideas_generated")
      .gte("created_at", oneDayAgo);

    if (recentGenerations && recentGenerations >= 3) {
      return new Response(
        JSON.stringify({ error: "Daily generation limit reached. Try again tomorrow." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    */
    console.log("[TESTING MODE] Rate limit check bypassed");

    await supabase
      .from("ft_sessions")
      .update({ status: "generating" })
      .eq("id", session_id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    const province = (collectedData.province || profile?.province || "Ontario") as string;

    // ========================================================================
    // ELIGIBILITY FILTERING: Query grants from database and filter
    // Filter by: status (open/upcoming) AND url_status (accessible/unchecked)
    // This excludes closed/unknown grants and broken/timeout URLs
    // ========================================================================
    const { data: allGrants, error: grantsError } = await supabase
      .from("canadian_grants")
      .select("*")
      .or(`province.eq.${province},province.is.null`)
      .in("status", ["open", "upcoming"])
      .in("url_status", ["accessible", "unchecked"]);

    if (grantsError) {
      console.error("Failed to fetch grants:", grantsError);
    }
    
    console.log(`Fetched ${allGrants?.length || 0} grants (filtered: status=open/upcoming, url_status=accessible/unchecked)`);

    // Extract user eligibility data from collected data
    const userAge = getAgeFromRange(collectedData.age_range as string | undefined);
    const residencyStatus = normalizeResidencyStatus(collectedData.residency_status as string | undefined);
    const isCitizenOrPR = ["citizen", "pr"].includes(residencyStatus);
    const yearsInCanada = getYearsFromStatus(collectedData.years_in_canada as string | undefined);
    const isIndigenous = collectedData.is_indigenous === true;

    console.log(`Eligibility check: age=${userAge}, status=${residencyStatus}, years=${yearsInCanada}, indigenous=${isIndigenous}`);

    // Filter grants by eligibility
    const { eligible: eligibleGrants, ineligible: ineligibleGrants } = filterGrantsByEligibility(
      (allGrants || []) as Grant[],
      userAge,
      isCitizenOrPR,
      yearsInCanada,
      isIndigenous
    );

    console.log(`Grants: ${eligibleGrants.length} eligible, ${ineligibleGrants.length} ineligible`);

    // Build prompt with eligibility-filtered grants (sanitize user data first)
    const sanitizedData = sanitizeCollectedData(collectedData);
    const prompt = buildEnhancedPrompt(sanitizedData, profile, eligibleGrants, ineligibleGrants);

    console.log("Generating enhanced ideas with collected data:", JSON.stringify(collectedData));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    let ideas: z.infer<typeof ideasArraySchema> | null = null;
    
    // First attempt with higher token limit
    const firstResponse = await callAI(prompt, LOVABLE_API_KEY, false, 20000);
    console.log("AI response length:", firstResponse.length);
    ideas = parseIdeasFromResponse(firstResponse);

    if (!ideas) {
      console.log("First parse failed, retrying with stricter prompt and higher token limit");
      const retryResponse = await callAI(prompt, LOVABLE_API_KEY, true, 24000);
      console.log("Retry response length:", retryResponse.length);
      ideas = parseIdeasFromResponse(retryResponse);
    }

    if (!ideas) {
      console.error("Both attempts to generate ideas failed");
      await supabase
        .from("ft_sessions")
        .update({ status: "ready_to_pay" })
        .eq("id", session_id);

      return new Response(
        JSON.stringify({ error: "Failed to generate ideas. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enrich with eligibility-filtered grants (now includes both eligible and ineligible)
    ideas = enrichWithEligibleGrants(ideas, eligibleGrants, ineligibleGrants);

    // Determine order tier for tier-specific features
    const { data: paidOrder } = await supabase
      .from("ft_orders")
      .select("tier, tier_name")
      .eq("session_id", session_id)
      .eq("status", "paid")
      .limit(1)
      .single();
    
    const orderTier = paidOrder?.tier_name || paidOrder?.tier || 'starter';
    const isCompleteTier = orderTier === 'complete' || orderTier === 'vip';
    const competitorCount = isCompleteTier ? 10 : 5;
    
    console.log(`[ft_generate_ideas] Order tier: ${orderTier}, competitor count: ${competitorCount}`);

    // Enrich with verified competitors from Perplexity search
    const city = (collectedData.city || profile?.city || "Toronto") as string;
    console.log(`Searching for ${competitorCount} real competitors in ${city}, ${province}...`);
    
    try {
      ideas = await enrichWithVerifiedCompetitors(ideas, city, province, competitorCount);
      console.log("Competitor enrichment complete");
    } catch (compError) {
      console.error("Competitor search failed, using AI-generated competitors:", compError);
      // Continue with AI-generated competitors (already in ideas)
    }

    // Generate Tier 2+ content if applicable
    let tier2Content: Record<string, any> = {};
    
    if (isCompleteTier) {
      console.log(`[ft_generate_ideas] Generating Tier 2+ content for tier: ${orderTier}`);
      
      for (let i = 0; i < ideas.length; i++) {
        const idea = ideas[i];
        
        // Generate SWOT Analysis
        const swot = await generateSWOTAnalysis(idea, collectedData, LOVABLE_API_KEY);
        if (swot) {
          tier2Content[idea.title] = tier2Content[idea.title] || {};
          tier2Content[idea.title].swot_analysis = swot;
        }
        
        // Generate Risk Mitigation
        const riskMitigation = await generateRiskMitigation(idea.market_analysis.challenges, LOVABLE_API_KEY);
        if (riskMitigation) {
          tier2Content[idea.title] = tier2Content[idea.title] || {};
          tier2Content[idea.title].risk_mitigation = riskMitigation;
        }
        
        // Generate Pricing Strategy
        const pricing = await generatePricingStrategy(idea, LOVABLE_API_KEY);
        if (pricing) {
          tier2Content[idea.title] = tier2Content[idea.title] || {};
          tier2Content[idea.title].pricing_strategy = pricing;
        }
        
        // Generate Customer Acquisition Plan
        const customerAcq = await generateCustomerAcquisition(idea, collectedData, LOVABLE_API_KEY);
        if (customerAcq) {
          tier2Content[idea.title] = tier2Content[idea.title] || {};
          tier2Content[idea.title].customer_acquisition = customerAcq;
        }
        
        // Generate 90-Day Roadmap
        const roadmap = await generateNinetyDayRoadmap(idea, LOVABLE_API_KEY);
        if (roadmap) {
          tier2Content[idea.title] = tier2Content[idea.title] || {};
          tier2Content[idea.title].ninety_day_roadmap = roadmap;
        }
        
        console.log(`[ft_generate_ideas] Generated Tier 2+ content for idea ${i + 1}: ${idea.title}`);
      }
    }

    // Get market validation signals for each idea category
    console.log(`Fetching market signals for ideas in ${city}, ${province}...`);
    const marketSignalsMap: Record<string, MarketSignals | null> = {};
    
    // Get unique business types to avoid duplicate searches
    const uniqueBusinessTypes = [...new Set(ideas.map(i => i.title))];
    
    for (const businessType of uniqueBusinessTypes.slice(0, 3)) { // Limit to avoid timeouts
      try {
        const signals = await searchMarketValidation(businessType, city, province);
        if (signals) {
          marketSignalsMap[businessType] = signals;
          console.log(`Market signals for "${businessType}": demand=${signals.demand_indicator}`);
        }
      } catch (error) {
        console.error(`Market validation failed for ${businessType}:`, error);
      }
    }

    const ideasToInsert = ideas.map((idea) => {
      const tier2Data = tier2Content[idea.title] || {};
      return {
        user_id: userId,
        session_id: session_id,
        title: idea.title,
        tagline: idea.tagline,
        description: idea.description,
        category: idea.category,
        viability_score: idea.viability_score,
        confidence_factors: idea.confidence_factors,
        investment_min: idea.investment_min,
        investment_max: idea.investment_max,
        time_to_revenue: idea.time_to_revenue,
        time_to_launch: idea.time_to_launch,
        market_analysis: idea.market_analysis,
        financials: idea.financials,
        canadian_resources: idea.canadian_resources,
        quick_win: idea.quick_win,
        risk_level: idea.risk_level,
        market_signals: marketSignalsMap[idea.title] || null,
        // Tier 2+ fields
        swot_analysis: tier2Data.swot_analysis || null,
        risk_mitigation: tier2Data.risk_mitigation || null,
        pricing_strategy: tier2Data.pricing_strategy || null,
        customer_acquisition: tier2Data.customer_acquisition || null,
        ninety_day_roadmap: tier2Data.ninety_day_roadmap || null,
      };
    });

    const { data: savedIdeas, error: insertError } = await supabase
      .from("ft_ideas")
      .insert(ideasToInsert)
      .select();

    if (insertError) {
      console.error("Failed to insert ideas:", insertError);
      throw new Error("Failed to save ideas");
    }

    await supabase
      .from("ft_sessions")
      .update({ 
        status: "ideas_generated",
        progress: 100 
      })
      .eq("id", session_id);

    await supabase
      .from("ft_events")
      .insert({
        user_id: userId,
        session_id: session_id,
        event_name: "ideas_generated",
        event_data: { 
          ideas_count: savedIdeas?.length || 0,
          categories: ideas.map(i => i.category),
          version: "v2_enhanced"
        },
      });

    console.log(`[ft_generate_ideas_v2] Generated ${savedIdeas?.length} enhanced ideas for session ${session_id}`);

    return new Response(
      JSON.stringify({ ideas: savedIdeas, version: "v2" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("ft_generate_ideas_v2 error:", error);

    const message = error instanceof Error ? error.message : "Unknown error";
    
    if (message === "RATE_LIMIT") {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (message === "CREDITS_EXHAUSTED") {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Failed to generate ideas. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});