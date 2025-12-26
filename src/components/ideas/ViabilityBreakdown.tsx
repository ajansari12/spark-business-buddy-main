import { useState, useMemo } from "react";
import {
  TrendingUp,
  Users,
  DollarSign,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  Info,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface ViabilityFactor {
  name: string;
  score: number; // 1-10
  reason: string;
  icon?: "demand" | "skills" | "budget" | "competition" | "time";
}

export interface ViabilityBreakdownData {
  overall_score: number;
  factors: ViabilityFactor[];
}

interface ViabilityBreakdownProps {
  data?: ViabilityBreakdownData;
  breakdown?: {
    market_demand: { score: number; reason: string };
    skill_match: { score: number; reason: string };
    budget_fit: { score: number; reason: string };
    competition: { score: number; reason: string };
    time_realistic: { score: number; reason: string };
  };
  compact?: boolean;
  className?: string;
}

const iconMap = {
  demand: TrendingUp,
  skills: Users,
  budget: DollarSign,
  competition: Shield,
  time: Clock,
};

const getScoreColor = (score: number): string => {
  if (score >= 8) return "text-green-500 bg-green-500";
  if (score >= 6) return "text-yellow-500 bg-yellow-500";
  if (score >= 4) return "text-orange-500 bg-orange-500";
  return "text-red-500 bg-red-500";
};

const getScoreLabel = (score: number): string => {
  if (score >= 9) return "Excellent";
  if (score >= 8) return "Very Good";
  if (score >= 7) return "Good";
  if (score >= 6) return "Fair";
  if (score >= 5) return "Average";
  if (score >= 4) return "Below Average";
  return "Needs Attention";
};

// Get improvement suggestions based on factor name and score
const getImprovementSuggestion = (factor: ViabilityFactor): string => {
  const name = factor.name.toLowerCase();
  const score = factor.score;

  if (score >= 8) {
    if (name.includes("demand")) return "Strong market demand - consider capturing early market share quickly.";
    if (name.includes("skill")) return "Great skills alignment - leverage your expertise for competitive advantage.";
    if (name.includes("budget")) return "Excellent budget fit - consider reserving funds for marketing.";
    if (name.includes("competition")) return "Low competition - establish brand presence while you have the advantage.";
    if (name.includes("time")) return "Timeline is realistic - you're well-positioned for success.";
    return "This factor is a strength - maximize it.";
  }

  if (score >= 6) {
    if (name.includes("demand")) return "Consider niching down or targeting underserved segments.";
    if (name.includes("skill")) return "Consider short courses or partnering with someone who has complementary skills.";
    if (name.includes("budget")) return "Look for ways to bootstrap initially or phase your investment.";
    if (name.includes("competition")) return "Focus on differentiation and unique value propositions.";
    if (name.includes("time")) return "Consider starting with MVP to validate faster.";
    return "Room for improvement - focus on this area.";
  }

  if (name.includes("demand")) return "Research alternative markets or pivot the offering to match demand.";
  if (name.includes("skill")) return "Strongly consider hiring or partnering with experienced professionals.";
  if (name.includes("budget")) return "Explore funding options, grants, or consider a lower-cost alternative.";
  if (name.includes("competition")) return "Find a unique angle or underserved niche to avoid direct competition.";
  if (name.includes("time")) return "Break down into smaller milestones or extend your timeline expectations.";
  return "This needs significant attention before proceeding.";
};

const InternalProgressBar = ({
  value,
  max = 10,
  className,
}: {
  value: number;
  max?: number;
  className?: string;
}) => {
  const percentage = (value / max) * 100;
  const colorClass = getScoreColor(value);

  return (
    <div
      className={cn(
        "h-2 w-full bg-muted rounded-full overflow-hidden",
        className
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-500", colorClass.split(" ")[1])}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export const ViabilityBreakdown = ({
  data,
  breakdown,
  compact = false,
  className,
}: ViabilityBreakdownProps) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [expandedFactor, setExpandedFactor] = useState<string | null>(null);

  // Convert old breakdown format to new format if needed
  const normalizedData: ViabilityBreakdownData | null = useMemo(() => {
    if (data) return data;
    if (!breakdown) return null;
    
    return {
      overall_score: 0,
      factors: [
        { name: "Market Demand", score: breakdown.market_demand.score, reason: breakdown.market_demand.reason, icon: "demand" as const },
        { name: "Skill Match", score: breakdown.skill_match.score, reason: breakdown.skill_match.reason, icon: "skills" as const },
        { name: "Budget Fit", score: breakdown.budget_fit.score, reason: breakdown.budget_fit.reason, icon: "budget" as const },
        { name: "Competition", score: breakdown.competition.score, reason: breakdown.competition.reason, icon: "competition" as const },
        { name: "Time Realistic", score: breakdown.time_realistic.score, reason: breakdown.time_realistic.reason, icon: "time" as const },
      ]
    };
  }, [data, breakdown]);

  if (!normalizedData) return null;

  // Calculate weighted average if not provided
  const overallScore =
    normalizedData.overall_score ||
    normalizedData.factors.reduce((sum, f) => sum + f.score, 0) / normalizedData.factors.length;

  const overallColorClass = getScoreColor(overallScore);

  // Find factors needing attention
  const weakFactors = normalizedData.factors.filter(f => f.score < 6);
  const strongFactors = normalizedData.factors.filter(f => f.score >= 8);

  if (compact && !isExpanded) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setIsExpanded(true)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors hover:bg-muted/50",
                className
              )}
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                  overallColorClass.split(" ")[1]
                )}
              >
                {overallScore.toFixed(1)}
              </div>
              <span className="text-sm font-medium">Viability Score</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to see detailed breakdown</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 space-y-4",
        className
      )}
    >
      {/* Header with overall score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white",
              overallColorClass.split(" ")[1]
            )}
          >
            {overallScore.toFixed(1)}
          </div>
          <div>
            <h4 className="font-semibold text-foreground">Viability Score</h4>
            <p className={cn("text-sm", overallColorClass.split(" ")[0])}>
              {getScoreLabel(overallScore)}
            </p>
          </div>
        </div>
        {compact && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="h-8 w-8 p-0"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Quick insights */}
      {(strongFactors.length > 0 || weakFactors.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {strongFactors.length > 0 && (
            <div className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
              ✓ Strong: {strongFactors.map(f => f.name).join(", ")}
            </div>
          )}
          {weakFactors.length > 0 && (
            <div className="text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400">
              ! Focus: {weakFactors.map(f => f.name).join(", ")}
            </div>
          )}
        </div>
      )}

      {/* Factor breakdown */}
      <div className="space-y-3">
        {normalizedData.factors.map((factor, index) => {
          const IconComponent = factor.icon
            ? iconMap[factor.icon]
            : TrendingUp;
          const colorClass = getScoreColor(factor.score);
          const isFactorExpanded = expandedFactor === factor.name;

          return (
            <Collapsible
              key={index}
              open={isFactorExpanded}
              onOpenChange={() => setExpandedFactor(isFactorExpanded ? null : factor.name)}
            >
              <CollapsibleTrigger asChild>
                <div className="space-y-1.5 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent
                        className={cn("w-4 h-4", colorClass.split(" ")[0])}
                      />
                      <span className="text-sm font-medium text-foreground">
                        {factor.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          colorClass.split(" ")[0]
                        )}
                      >
                        {factor.score}/10
                      </span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs">
                            <p className="text-sm">{factor.reason}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {isFactorExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <InternalProgressBar value={factor.score} />
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {factor.reason}
                  </p>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 p-3 bg-muted/30 rounded-lg border border-border animate-fade-in">
                  <div className="flex items-start gap-2">
                    <Lightbulb className={cn(
                      "w-4 h-4 mt-0.5 flex-shrink-0",
                      factor.score >= 8 ? "text-green-500" :
                      factor.score >= 6 ? "text-yellow-500" :
                      "text-orange-500"
                    )} />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        {factor.score >= 8 ? "Leverage this strength" : 
                         factor.score >= 6 ? "Room for improvement" : 
                         "Action needed"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getImprovementSuggestion(factor)}
                      </p>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-muted-foreground">8-10 Excellent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-xs text-muted-foreground">6-7 Good</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-xs text-muted-foreground">4-5 Fair</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-xs text-muted-foreground">1-3 Low</span>
        </div>
      </div>
    </div>
  );
};

export default ViabilityBreakdown;
