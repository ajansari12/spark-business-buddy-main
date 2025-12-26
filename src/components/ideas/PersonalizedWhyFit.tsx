import { useMemo, useState } from "react";
import {
  CheckCircle2,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PersonalizedWhyFitProps {
  whyFit: string;
  confidenceFactors?: string[];
  userProfile?: {
    skills_background?: string;
    budget_min?: number;
    budget_max?: number;
    time_commitment_hours?: number;
    income_goal?: string;
    city?: string;
    province?: string;
    interests?: string;
  };
  ideaData?: {
    title?: string;
    startup_cost?: number;
    time_to_revenue?: string;
    category?: string;
  };
  compact?: boolean;
  className?: string;
}

interface FitFactor {
  icon: React.ReactNode;
  label: string;
  description: string;
  highlight: string;
  isMatch: boolean;
  confidencePercent: number;
  tooltip?: string;
}

export const PersonalizedWhyFit = ({
  whyFit,
  confidenceFactors = [],
  userProfile,
  ideaData,
  compact = false,
  className,
}: PersonalizedWhyFitProps) => {
  const [isExpanded, setIsExpanded] = useState(!compact);

  // Parse and enhance the why_fit text into structured factors with confidence scores
  const parsedFactors = useMemo<FitFactor[]>(() => {
    const factors: FitFactor[] = [];

    // Skills/Background match
    if (userProfile?.skills_background) {
      const skillsLower = userProfile.skills_background.toLowerCase();
      const whyFitLower = whyFit.toLowerCase();
      const hasSkillMatch =
        whyFitLower.includes(skillsLower.split(" ")[0]) ||
        confidenceFactors.some((f) =>
          f.toLowerCase().includes(skillsLower.split(" ")[0])
        );

      factors.push({
        icon: <Briefcase className="w-4 h-4" />,
        label: "Skills Match",
        description: `Your ${userProfile.skills_background} background`,
        highlight: hasSkillMatch
          ? "directly applies to this business"
          : "provides transferable skills",
        isMatch: true,
        confidencePercent: hasSkillMatch ? 95 : 70,
        tooltip: hasSkillMatch 
          ? "Your specific skills are mentioned as a key success factor for this business"
          : "Your skills can be adapted to this business with some additional learning",
      });
    }

    // Budget fit
    if (userProfile?.budget_max && ideaData?.startup_cost) {
      const budgetRatio = ideaData.startup_cost / userProfile.budget_max;
      const budgetFit = budgetRatio <= 1;
      const bufferPercent = Math.round((1 - budgetRatio) * 100);
      const confidencePercent = budgetFit 
        ? Math.min(100, 70 + bufferPercent * 0.3) 
        : Math.max(30, 70 - Math.abs(bufferPercent) * 0.5);

      factors.push({
        icon: <DollarSign className="w-4 h-4" />,
        label: "Budget Fit",
        description: `$${ideaData.startup_cost.toLocaleString()} startup cost`,
        highlight: budgetFit
          ? `${bufferPercent > 0 ? `leaves ${bufferPercent}% buffer` : "within your budget"}`
          : `${Math.abs(bufferPercent)}% over budget`,
        isMatch: budgetFit,
        confidencePercent,
        tooltip: budgetFit
          ? `Your budget of $${userProfile.budget_max.toLocaleString()} covers the startup cost with room for unexpected expenses`
          : "Consider phased investment or additional funding options",
      });
    } else if (userProfile?.budget_max) {
      factors.push({
        icon: <DollarSign className="w-4 h-4" />,
        label: "Budget Fit",
        description: `Your $${userProfile.budget_max.toLocaleString()} budget`,
        highlight: "covers typical startup costs",
        isMatch: true,
        confidencePercent: 75,
        tooltip: "Your budget is within the typical range for this type of business",
      });
    }

    // Time commitment
    if (userProfile?.time_commitment_hours) {
      const hoursText = `${userProfile.time_commitment_hours} hrs/week`;
      const isFullTime = userProfile.time_commitment_hours >= 20;
      const confidencePercent = isFullTime ? 90 : 65;

      factors.push({
        icon: <Clock className="w-4 h-4" />,
        label: "Time Match",
        description: hoursText,
        highlight:
          isFullTime
            ? "sufficient for active management"
            : "suitable for part-time operation",
        isMatch: true,
        confidencePercent,
        tooltip: isFullTime
          ? "You have enough time to actively grow and manage this business"
          : "This business can be started part-time; consider scaling up time as it grows",
      });
    }

    // Location advantage
    if (userProfile?.city) {
      factors.push({
        icon: <MapPin className="w-4 h-4" />,
        label: "Local Opportunity",
        description: `${userProfile.city}${userProfile.province ? `, ${userProfile.province}` : ""}`,
        highlight: "growing market with demand",
        isMatch: true,
        confidencePercent: 80,
        tooltip: `We analyzed market demand and competition in ${userProfile.city} for this business type`,
      });
    }

    // Income goal alignment
    if (userProfile?.income_goal) {
      factors.push({
        icon: <Target className="w-4 h-4" />,
        label: "Income Potential",
        description: `Goal: ${userProfile.income_goal}`,
        highlight: "achievable based on market rates",
        isMatch: true,
        confidencePercent: 75,
        tooltip: "Based on market rates and typical profit margins for this business type",
      });
    }

    // Add any additional confidence factors not covered above
    const coveredTopics = ["skill", "budget", "time", "hour", "location", "city", "income", "goal"];
    const additionalFactors = confidenceFactors.filter(
      (f) => !coveredTopics.some((topic) => f.toLowerCase().includes(topic))
    );

    if (additionalFactors.length > 0) {
      factors.push({
        icon: <TrendingUp className="w-4 h-4" />,
        label: "Additional Fit",
        description: additionalFactors[0],
        highlight: "",
        isMatch: true,
        confidencePercent: 70,
      });
    }

    return factors;
  }, [whyFit, confidenceFactors, userProfile, ideaData]);

  // Calculate overall match score
  const overallScore = useMemo(() => {
    if (parsedFactors.length === 0) return 0;
    const total = parsedFactors.reduce((sum, f) => sum + f.confidencePercent, 0);
    return Math.round(total / parsedFactors.length);
  }, [parsedFactors]);

  if (compact && !isExpanded) {
    // Compact view - just badges with overall score
    return (
      <div className={cn("space-y-2", className)}>
        <button 
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{overallScore}%</span>
            </div>
            <span className="text-sm font-medium text-foreground">Profile Match</span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="flex flex-wrap gap-1.5">
          {parsedFactors.slice(0, 4).map((factor, index) => (
            <Badge
              key={index}
              variant={factor.isMatch ? "default" : "secondary"}
              className={cn(
                "text-xs py-0.5",
                factor.isMatch
                  ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                  : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
              )}
            >
              {factor.label}
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with overall score */}
      {compact && (
        <button 
          onClick={() => setIsExpanded(false)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{overallScore}%</span>
            </div>
            <span className="text-sm font-medium text-foreground">Profile Match</span>
          </div>
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      {/* Main why_fit text */}
      <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
        <h4 className="font-medium text-sm text-foreground mb-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          Why This Fits You
        </h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {whyFit}
        </p>
      </div>

      {/* Structured factors with confidence meters */}
      {parsedFactors.length > 0 && (
        <TooltipProvider delayDuration={200}>
          <div className="grid gap-3 sm:grid-cols-2">
            {parsedFactors.map((factor, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                      factor.isMatch
                        ? "bg-green-500/5 border-green-500/20"
                        : "bg-yellow-500/5 border-yellow-500/20"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        factor.isMatch
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                      )}
                    >
                      {factor.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          {factor.label}
                        </p>
                        <span className={cn(
                          "text-xs font-semibold",
                          factor.confidencePercent >= 80 ? "text-green-600 dark:text-green-400" :
                          factor.confidencePercent >= 60 ? "text-yellow-600 dark:text-yellow-400" :
                          "text-orange-600 dark:text-orange-400"
                        )}>
                          {factor.confidencePercent}%
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">
                        {factor.description}
                      </p>
                      {/* Confidence meter */}
                      <div className="mt-1.5">
                        <Progress 
                          value={factor.confidencePercent} 
                          className={cn(
                            "h-1.5",
                            factor.confidencePercent >= 80 ? "[&>div]:bg-green-500" :
                            factor.confidencePercent >= 60 ? "[&>div]:bg-yellow-500" :
                            "[&>div]:bg-orange-500"
                          )}
                        />
                      </div>
                      {factor.highlight && (
                        <p
                          className={cn(
                            "text-xs mt-1",
                            factor.isMatch
                              ? "text-green-600 dark:text-green-400"
                              : "text-yellow-600 dark:text-yellow-400"
                          )}
                        >
                          {factor.isMatch ? "✓" : "!"} {factor.highlight}
                        </p>
                      )}
                    </div>
                  </div>
                </TooltipTrigger>
                {factor.tooltip && (
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-sm">{factor.tooltip}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      )}

      {/* Confidence factors as tags */}
      {confidenceFactors.length > 0 && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Key factors:</p>
          <div className="flex flex-wrap gap-1.5">
            {confidenceFactors.map((factor, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {factor}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper to generate enhanced why_fit text from user data
export function generatePersonalizedWhyFit(
  baseWhyFit: string,
  userProfile: {
    skills_background?: string;
    budget_min?: number;
    budget_max?: number;
    time_commitment_hours?: number;
    income_goal?: string;
    city?: string;
    interests?: string;
  },
  ideaData: {
    startup_cost?: number;
    time_to_revenue?: string;
    category?: string;
  }
): string {
  // If base why_fit already references user data, return as-is
  const hasPersonalization =
    (userProfile.skills_background &&
      baseWhyFit.toLowerCase().includes(userProfile.skills_background.toLowerCase().split(" ")[0])) ||
    (userProfile.city && baseWhyFit.toLowerCase().includes(userProfile.city.toLowerCase())) ||
    /\$[\d,]+/.test(baseWhyFit);

  if (hasPersonalization) {
    return baseWhyFit;
  }

  // Enhance with user data
  const parts: string[] = [];

  if (userProfile.skills_background) {
    parts.push(
      `Your ${userProfile.skills_background} experience gives you a strong foundation for this type of business.`
    );
  }

  if (userProfile.budget_max && ideaData.startup_cost) {
    const bufferPercent = Math.round(
      ((userProfile.budget_max - ideaData.startup_cost) / userProfile.budget_max) * 100
    );
    if (bufferPercent > 0) {
      parts.push(
        `At $${ideaData.startup_cost.toLocaleString()} startup cost, you'll use ${100 - bufferPercent}% of your $${userProfile.budget_max.toLocaleString()} budget, leaving room for unexpected expenses.`
      );
    }
  }

  if (userProfile.time_commitment_hours) {
    parts.push(
      `With ${userProfile.time_commitment_hours} hours per week available, you can ${
        userProfile.time_commitment_hours >= 30
          ? "dedicate full attention to growth"
          : "start part-time and scale up"
      }.`
    );
  }

  if (userProfile.city) {
    parts.push(`${userProfile.city} offers a growing market for this type of business.`);
  }

  // Combine original with enhancements
  return parts.length > 0 ? `${baseWhyFit}\n\n${parts.join(" ")}` : baseWhyFit;
}

export default PersonalizedWhyFit;
