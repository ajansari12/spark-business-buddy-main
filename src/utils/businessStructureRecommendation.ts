import { BusinessStructureType } from "@/types/registration";

interface CollectedData {
  budget_min?: number;
  budget_max?: number;
  income_goal?: number;
  time_commitment_hours?: number;
  skills_background?: string;
  interests?: string;
  constraints?: string;
  preferred_industries?: string[];
}

interface RecommendationResult {
  recommendedType: BusinessStructureType;
  explanations: Record<BusinessStructureType, string>;
}

// Industries that typically require liability protection
const HIGH_RISK_INDUSTRIES = [
  "food", "restaurant", "catering", "construction", "contractor",
  "healthcare", "medical", "consulting", "financial", "childcare",
  "manufacturing", "transportation", "fitness", "gym"
];

function detectHighRiskIndustry(data: CollectedData): boolean {
  const searchText = [
    data.skills_background,
    data.interests,
    ...(data.preferred_industries || [])
  ].filter(Boolean).join(" ").toLowerCase();

  return HIGH_RISK_INDUSTRIES.some(industry => searchText.includes(industry));
}

function formatBudget(min?: number, max?: number): string {
  if (min && max) {
    return `$${min.toLocaleString()}–$${max.toLocaleString()}`;
  } else if (max) {
    return `up to $${max.toLocaleString()}`;
  } else if (min) {
    return `$${min.toLocaleString()}+`;
  }
  return "your budget";
}

export function getStructureRecommendation(collectedData: CollectedData | null): RecommendationResult {
  const data = collectedData || {};
  
  const budget = data.budget_max || data.budget_min || 0;
  const incomeGoal = data.income_goal || 0;
  const timeCommitment = data.time_commitment_hours || 0;
  const isHighRisk = detectHighRiskIndustry(data);
  const budgetDisplay = formatBudget(data.budget_min, data.budget_max);

  // Default explanations
  const explanations: Record<BusinessStructureType, string> = {
    sole_proprietorship: "",
    partnership: "",
    corporation: "",
  };

  let recommendedType: BusinessStructureType = "sole_proprietorship";

  // Decision logic with personalized explanations
  if (isHighRisk && budget >= 5000) {
    // High-risk industry with decent budget → Corporation
    recommendedType = "corporation";
    explanations.corporation = `Your industry may involve liability risks. With ${budgetDisplay}, a corporation provides personal asset protection.`;
    explanations.sole_proprietorship = `Simpler to start, but offers no liability protection for higher-risk industries like yours.`;
    explanations.partnership = `Only needed if you have a business partner. Your intake suggests you're starting solo.`;
  } else if (incomeGoal >= 75000 && budget >= 3000) {
    // High income goal with budget → Corporation
    recommendedType = "corporation";
    explanations.corporation = `With an income goal of $${incomeGoal.toLocaleString()}/year, incorporating offers tax advantages once profitable.`;
    explanations.sole_proprietorship = `Great for starting out, but you may want to incorporate once revenues exceed $50K for tax benefits.`;
    explanations.partnership = `Only relevant if you're starting with a partner.`;
  } else if (budget < 1500 || timeCommitment < 20) {
    // Low budget or part-time → Sole Proprietorship
    recommendedType = "sole_proprietorship";
    if (budget < 1500) {
      explanations.sole_proprietorship = `With ${budgetDisplay}, this is the most cost-effective option. Perfect for testing your business before scaling.`;
    } else {
      explanations.sole_proprietorship = `At ${timeCommitment} hours/week, a simple structure lets you start quickly without complex paperwork.`;
    }
    explanations.corporation = `Higher setup costs (~$300+). Consider once your business grows and revenue exceeds $50K/year.`;
    explanations.partnership = `Only needed if you have a business partner.`;
  } else {
    // Default case → Sole Proprietorship
    recommendedType = "sole_proprietorship";
    explanations.sole_proprietorship = `With ${budgetDisplay}, this is the simplest and most affordable way to start. You can always incorporate later.`;
    explanations.corporation = `Higher setup costs and ongoing requirements. Makes sense once revenues exceed $50K/year.`;
    explanations.partnership = `Only relevant if you're starting with a business partner.`;
  }

  return { recommendedType, explanations };
}
