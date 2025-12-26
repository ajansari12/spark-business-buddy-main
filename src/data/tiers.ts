export interface FeatureCategory {
  name: string;
  icon: string;
  badge?: "verified" | "live" | "smart";
  features: string[];
}

export interface Tier {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  featureCategories?: FeatureCategory[];
  highlight?: boolean;
  badge?: string;
  comingSoon?: boolean;
}

export const tiers: Tier[] = [
  {
    id: "starter",
    name: "Starter",
    price: 49,
    description: "AI-powered business discovery with VERIFIED market data — not generic AI advice",
    features: [
      "Up to 7 personalized business ideas with viability scores (1-10)",
      "Risk assessment + confidence factors for each idea",
      "Target customer identified for each opportunity",
      "Personalized 'Why This Fits You' explanation for each idea",
      "VERIFIED competitors with real Google ratings & websites",
      "LIVE market data: job demand, news sentiment & business activity",
      "Market saturation & competitive gaps identified",
      "Regulatory requirements (permits, licenses, insurance)",
      "Cited data sources for all market intelligence",
      "Detailed startup cost breakdown by category",
      "Monthly revenue projections & break-even timeline",
      "Time to launch + time to first revenue estimates",
      "Year 1 profit potential estimates for each idea",
      "SMART grant filtering — only shows what YOU qualify for",
      "Ineligible programs listed with clear reasons why",
      "Province-specific business context & resources",
      "30-day action plan + Quick Win for each idea",
      "Potential challenges identified for each idea",
      "Premium PDF report (25+ pages) with Executive Summary",
      "Side-by-side comparison table of all ideas",
      "7-day email support",
    ],
    featureCategories: [
      {
        name: "Personalized Ideas",
        icon: "Lightbulb",
        features: [
          "Up to 7 personalized business ideas with viability scores (1-10)",
          "Risk assessment + confidence factors for each idea",
          "Target customer identified for each opportunity",
          "Personalized 'Why This Fits You' explanation for each idea",
        ],
      },
      {
        name: "Market Intelligence",
        icon: "Search",
        badge: "verified",
        features: [
          "VERIFIED competitors with real Google ratings & websites",
          "LIVE market data: job demand, news sentiment & business activity",
          "Market saturation & competitive gaps identified",
          "Regulatory requirements (permits, licenses, insurance)",
          "Cited data sources for all market intelligence",
        ],
      },
      {
        name: "Financial Projections",
        icon: "DollarSign",
        features: [
          "Detailed startup cost breakdown by category",
          "Monthly revenue projections & break-even timeline",
          "Time to launch + time to first revenue estimates",
          "Year 1 profit potential estimates for each idea",
        ],
      },
      {
        name: "Canadian-Specific",
        icon: "MapPin",
        badge: "smart",
        features: [
          "SMART grant filtering — only shows what YOU qualify for",
          "Ineligible programs listed with clear reasons why",
          "Province-specific business context & resources",
        ],
      },
      {
        name: "Deliverables",
        icon: "FileText",
        features: [
          "30-day action plan + Quick Win for each idea",
          "Potential challenges identified for each idea",
          "Premium PDF report (25+ pages) with Executive Summary",
          "Side-by-side comparison table of all ideas",
          "7-day email support",
        ],
      },
    ],
    highlight: true,
    badge: "Best Value",
  },
  {
    id: "complete",
    name: "Complete",
    price: 149,
    description: "Launch ready with strategic planning and full registration support",
    features: [
      "Everything in Starter",
      "10+ verified competitors with pricing matrix",
      "SWOT analysis for each idea",
      "Risk mitigation playbook",
      "90-day execution roadmap with KPIs",
      "Customer acquisition playbook",
      "Pricing strategy recommendations",
      "Year 1 financial spreadsheet (.xlsx)",
      "Business registration wizard",
      "Personalized business structure recommendation",
      "Verified government fees by province",
      "Tax registration checklist (HST, payroll)",
      "30-day priority email support (48hr response)",
      "Premium PDF report (35+ pages)",
    ],
    featureCategories: [
      {
        name: "Enhanced Analysis",
        icon: "Search",
        badge: "verified",
        features: [
          "10+ verified competitors with Google ratings",
          "Competitor pricing matrix",
          "SWOT analysis for each idea",
          "Risk mitigation playbook with strategies",
        ],
      },
      {
        name: "Strategic Planning",
        icon: "Target",
        features: [
          "90-day execution roadmap with KPIs",
          "Customer acquisition playbook",
          "Pricing strategy recommendations",
        ],
      },
      {
        name: "Financial Tools",
        icon: "Calculator",
        features: [
          "Year 1 financial spreadsheet (.xlsx)",
          "Editable projections & scenarios",
        ],
      },
      {
        name: "Registration Support",
        icon: "FileText",
        badge: "smart",
        features: [
          "Business registration wizard",
          "Personalized structure recommendation",
          "Verified government fees",
          "Tax registration checklist",
        ],
      },
      {
        name: "Support & Deliverables",
        icon: "Mail",
        features: [
          "30-day priority email support",
          "48-hour response time",
          "Premium PDF report (35+ pages)",
        ],
      },
    ],
    comingSoon: true,
  },
  {
    id: "vip",
    name: "VIP Launch",
    price: 299,
    description: "Full guidance from idea to first customer with personal support",
    features: [
      "Everything in Complete",
      "30-minute 1-on-1 strategy call",
      "Pre-call business brief",
      "Call recording & action items",
      "AI business name suggestions",
      "Domain availability check (.ca/.com)",
      "Social handle availability links",
      "Grant application starter kit",
      "3-year financial model (.xlsx)",
      "Investor-ready one-pager (PDF)",
      "30-day dedicated support (24hr response)",
    ],
    featureCategories: [
      {
        name: "Strategy Call",
        icon: "Video",
        features: [
          "30-minute 1-on-1 strategy call",
          "Pre-call business brief",
          "Call recording & action items",
        ],
      },
      {
        name: "Business Identity",
        icon: "Sparkles",
        features: [
          "AI business name suggestions",
          "Domain availability check (.ca/.com)",
          "Social handle links",
        ],
      },
      {
        name: "Grant Support",
        icon: "Award",
        badge: "smart",
        features: [
          "Grant application starter kit",
          "Cover letter template",
          "Budget template",
        ],
      },
      {
        name: "Financial Modeling",
        icon: "TrendingUp",
        features: [
          "3-year financial projections (.xlsx)",
          "Growth scenarios (conservative/moderate/aggressive)",
        ],
      },
      {
        name: "Premium Support",
        icon: "Crown",
        features: [
          "30-day dedicated support",
          "24-hour response time",
          "Investor one-pager (PDF)",
        ],
      },
    ],
    comingSoon: true,
  },
];
