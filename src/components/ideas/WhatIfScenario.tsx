// ============================================================================
// "WHAT IF" SCENARIO TESTING
// Let users adjust parameters and see how ideas would change
// ============================================================================

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wand2,
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnalytics } from "@/hooks/useEnhancedAnalytics";

// ============================================================================
// TYPES
// ============================================================================

export interface WhatIfParameters {
  budget_min: number;
  budget_max: number;
  time_commitment_hours: number;
  risk_tolerance: "low" | "medium" | "high";
  income_goal_monthly: number;
}

export interface IdeaForWhatIf {
  id: string;
  title: string;
  viability_score: number;
  risk_level: "Low" | "Medium" | "High";
  investment_min: number;
  investment_max: number;
  time_to_revenue: string;
  financials?: {
    startup_cost_breakdown?: { total: number };
    monthly_revenue_low?: number;
    monthly_revenue_high?: number;
  };
}

interface WhatIfResult {
  idea: IdeaForWhatIf;
  original_viability: number;
  new_viability: number;
  change: "improved" | "same" | "reduced";
  change_amount: number;
  reasons: string[];
  unlocked?: boolean; // Idea now becomes viable
  locked?: boolean; // Idea no longer viable
}

// ============================================================================
// SIMULATION LOGIC
// ============================================================================

function simulateWhatIf(
  ideas: IdeaForWhatIf[],
  original: WhatIfParameters,
  modified: WhatIfParameters
): WhatIfResult[] {
  const results: WhatIfResult[] = [];

  for (const idea of ideas) {
    let viabilityDelta = 0;
    const reasons: string[] = [];

    // Budget impact
    const startupCost =
      idea.financials?.startup_cost_breakdown?.total || idea.investment_min;
    const originalBudgetRatio = startupCost / original.budget_max;
    const newBudgetRatio = startupCost / modified.budget_max;

    if (newBudgetRatio < originalBudgetRatio - 0.1) {
      viabilityDelta += 0.5;
      reasons.push(
        `Budget increased: ${Math.round((1 - newBudgetRatio) * 100)}% buffer (was ${Math.round((1 - originalBudgetRatio) * 100)}%)`
      );
    } else if (newBudgetRatio > originalBudgetRatio + 0.1) {
      viabilityDelta -= 0.5;
      reasons.push(
        `Budget decreased: startup cost now uses ${Math.round(newBudgetRatio * 100)}% of budget`
      );
    }

    // Check if budget now covers/doesn't cover
    if (originalBudgetRatio > 1 && newBudgetRatio <= 1) {
      viabilityDelta += 1.5;
      reasons.push("Now within budget!");
    } else if (originalBudgetRatio <= 1 && newBudgetRatio > 1) {
      viabilityDelta -= 1.5;
      reasons.push("Now exceeds budget");
    }

    // Time commitment impact
    const timeChange = modified.time_commitment_hours - original.time_commitment_hours;
    if (timeChange >= 10) {
      viabilityDelta += 0.3;
      reasons.push(`+${timeChange} hrs/week allows faster scaling`);
    } else if (timeChange <= -10) {
      viabilityDelta -= 0.3;
      reasons.push(`-${Math.abs(timeChange)} hrs/week may slow growth`);
    }

    // Risk tolerance impact
    const riskLevelValue = { Low: 1, Medium: 2, High: 3 };
    const toleranceValue = { low: 1, medium: 2, high: 3 };

    const ideaRisk = riskLevelValue[idea.risk_level];
    const originalTolerance = toleranceValue[original.risk_tolerance];
    const newTolerance = toleranceValue[modified.risk_tolerance];

    if (ideaRisk > originalTolerance && ideaRisk <= newTolerance) {
      viabilityDelta += 0.5;
      reasons.push("Higher risk tolerance unlocks this option");
    } else if (ideaRisk <= originalTolerance && ideaRisk > newTolerance) {
      viabilityDelta -= 0.5;
      reasons.push("Lower risk tolerance makes this less suitable");
    }

    // Income goal impact
    const monthlyRevHigh = idea.financials?.monthly_revenue_high || 5000;
    const originalGoalRatio = monthlyRevHigh / original.income_goal_monthly;
    const newGoalRatio = monthlyRevHigh / modified.income_goal_monthly;

    if (originalGoalRatio < 1 && newGoalRatio >= 1) {
      viabilityDelta += 0.8;
      reasons.push("Now meets income goal");
    } else if (originalGoalRatio >= 1 && newGoalRatio < 1) {
      viabilityDelta -= 0.8;
      reasons.push("May not meet higher income goal");
    }

    // Calculate new viability
    const newViability = Math.max(
      1,
      Math.min(10, idea.viability_score + viabilityDelta)
    );
    const roundedDelta = Math.round(viabilityDelta * 10) / 10;

    results.push({
      idea,
      original_viability: idea.viability_score,
      new_viability: Math.round(newViability * 10) / 10,
      change:
        roundedDelta > 0.2
          ? "improved"
          : roundedDelta < -0.2
          ? "reduced"
          : "same",
      change_amount: Math.abs(roundedDelta),
      reasons,
      unlocked: idea.viability_score < 6 && newViability >= 6,
      locked: idea.viability_score >= 6 && newViability < 6,
    });
  }

  // Sort by improvement
  return results.sort((a, b) => {
    const aChange = a.new_viability - a.original_viability;
    const bChange = b.new_viability - b.original_viability;
    return bChange - aChange;
  });
}

// ============================================================================
// PARAMETER CONTROLS
// ============================================================================

interface ParameterControlsProps {
  parameters: WhatIfParameters;
  onChange: (params: WhatIfParameters) => void;
  originalParams: WhatIfParameters;
}

const ParameterControls = ({
  parameters,
  onChange,
  originalParams,
}: ParameterControlsProps) => {
  const hasChanges =
    parameters.budget_max !== originalParams.budget_max ||
    parameters.time_commitment_hours !== originalParams.time_commitment_hours ||
    parameters.risk_tolerance !== originalParams.risk_tolerance ||
    parameters.income_goal_monthly !== originalParams.income_goal_monthly;

  return (
    <div className="space-y-6">
      {/* Budget */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Investment Budget
          </Label>
          <span className="text-sm font-medium">
            ${parameters.budget_max.toLocaleString()} CAD
          </span>
        </div>
        <Slider
          value={[parameters.budget_max]}
          onValueChange={([value]) =>
            onChange({ ...parameters, budget_max: value })
          }
          min={5000}
          max={200000}
          step={5000}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>$5,000</span>
          <span>$200,000</span>
        </div>
        {parameters.budget_max !== originalParams.budget_max && (
          <Badge
            variant={
              parameters.budget_max > originalParams.budget_max
                ? "default"
                : "secondary"
            }
            className="text-xs"
          >
            {parameters.budget_max > originalParams.budget_max ? "+" : ""}$
            {(
              parameters.budget_max - originalParams.budget_max
            ).toLocaleString()}
          </Badge>
        )}
      </div>

      {/* Time */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Hours per Week
          </Label>
          <span className="text-sm font-medium">
            {parameters.time_commitment_hours} hrs/week
          </span>
        </div>
        <Slider
          value={[parameters.time_commitment_hours]}
          onValueChange={([value]) =>
            onChange({ ...parameters, time_commitment_hours: value })
          }
          min={5}
          max={60}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>5 hrs (side project)</span>
          <span>60 hrs (full time+)</span>
        </div>
      </div>

      {/* Risk Tolerance */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Risk Tolerance
        </Label>
        <Select
          value={parameters.risk_tolerance}
          onValueChange={(value: "low" | "medium" | "high") =>
            onChange({ ...parameters, risk_tolerance: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">
              Low - Prefer proven business models
            </SelectItem>
            <SelectItem value="medium">
              Medium - Balanced risk/reward
            </SelectItem>
            <SelectItem value="high">
              High - Open to innovative ideas
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Income Goal */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Monthly Income Goal
          </Label>
          <span className="text-sm font-medium">
            ${parameters.income_goal_monthly.toLocaleString()}/mo
          </span>
        </div>
        <Slider
          value={[parameters.income_goal_monthly]}
          onValueChange={([value]) =>
            onChange({ ...parameters, income_goal_monthly: value })
          }
          min={1000}
          max={50000}
          step={500}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>$1,000</span>
          <span>$50,000</span>
        </div>
      </div>

      {/* Reset button */}
      {hasChanges && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(originalParams)}
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset to Original
        </Button>
      )}
    </div>
  );
};

// ============================================================================
// RESULT CARD
// ============================================================================

interface ResultCardProps {
  result: WhatIfResult;
}

const ResultCard = ({ result }: ResultCardProps) => {
  const { idea, original_viability, new_viability, change, reasons, unlocked, locked } =
    result;

  return (
    <Card
      className={cn(
        unlocked && "border-green-500 bg-green-50/50 dark:bg-green-950/20",
        locked && "border-red-500 bg-red-50/50 dark:bg-red-950/20"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium truncate">
              {idea.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {idea.risk_level} Risk
              </Badge>
              <span className="text-xs">
                ${idea.investment_min.toLocaleString()} -{" "}
                ${idea.investment_max.toLocaleString()}
              </span>
            </CardDescription>
          </div>

          {/* Score change indicator */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {original_viability.toFixed(1)}
            </span>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <div
              className={cn(
                "flex items-center gap-1 font-semibold",
                change === "improved" && "text-green-600",
                change === "reduced" && "text-red-600"
              )}
            >
              {change === "improved" && <TrendingUp className="w-4 h-4" />}
              {change === "reduced" && <TrendingDown className="w-4 h-4" />}
              {change === "same" && <Minus className="w-4 h-4 text-muted-foreground" />}
              {new_viability.toFixed(1)}
            </div>
          </div>
        </div>
      </CardHeader>

      {reasons.length > 0 && (
        <CardContent className="pt-0">
          <ul className="space-y-1">
            {reasons.map((reason, i) => (
              <li
                key={i}
                className="text-xs text-muted-foreground flex items-start gap-1"
              >
                <CheckCircle2
                  className={cn(
                    "w-3 h-3 mt-0.5 flex-shrink-0",
                    change === "improved"
                      ? "text-green-600"
                      : change === "reduced"
                      ? "text-red-600"
                      : "text-muted-foreground"
                  )}
                />
                {reason}
              </li>
            ))}
          </ul>

          {unlocked && (
            <Badge className="mt-2 bg-green-500">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Now Viable!
            </Badge>
          )}
          {locked && (
            <Badge variant="destructive" className="mt-2">
              <AlertCircle className="w-3 h-3 mr-1" />
              No Longer Recommended
            </Badge>
          )}
        </CardContent>
      )}
    </Card>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface WhatIfScenarioProps {
  ideas: IdeaForWhatIf[];
  currentProfile: {
    budget_min?: number;
    budget_max?: number;
    time_commitment_hours?: number;
    income_goal?: string;
  };
  sessionId?: string;
  className?: string;
  onRegenerate?: (params: WhatIfParameters) => void;
}

export const WhatIfScenario = ({
  ideas,
  currentProfile,
  sessionId,
  className,
  onRegenerate,
}: WhatIfScenarioProps) => {
  const { track } = useAnalytics();

  // Parse current profile to parameters
  const originalParams = useMemo<WhatIfParameters>(() => {
    const incomeGoal = currentProfile.income_goal || "$3000/month";
    const incomeMatch = incomeGoal.match(/\$?([\d,]+)/);
    const incomeValue = incomeMatch
      ? parseInt(incomeMatch[1].replace(/,/g, ""), 10)
      : 3000;

    return {
      budget_min: currentProfile.budget_min || 5000,
      budget_max: currentProfile.budget_max || 25000,
      time_commitment_hours: currentProfile.time_commitment_hours || 20,
      risk_tolerance: "medium",
      income_goal_monthly: incomeValue,
    };
  }, [currentProfile]);

  const [isOpen, setIsOpen] = useState(false);
  const [modifiedParams, setModifiedParams] =
    useState<WhatIfParameters>(originalParams);

  // Calculate results
  const results = useMemo(
    () => simulateWhatIf(ideas, originalParams, modifiedParams),
    [ideas, originalParams, modifiedParams]
  );

  const hasChanges =
    modifiedParams.budget_max !== originalParams.budget_max ||
    modifiedParams.time_commitment_hours !== originalParams.time_commitment_hours ||
    modifiedParams.risk_tolerance !== originalParams.risk_tolerance ||
    modifiedParams.income_goal_monthly !== originalParams.income_goal_monthly;

  const improvedCount = results.filter((r) => r.change === "improved").length;
  const reducedCount = results.filter((r) => r.change === "reduced").length;
  const unlockedCount = results.filter((r) => r.unlocked).length;

  const handleOpen = () => {
    setIsOpen(true);
    setModifiedParams(originalParams);
    track("whatif_opened", { idea_count: ideas.length }, sessionId);
  };

  const handleParamChange = (params: WhatIfParameters) => {
    const changedParam = Object.keys(params).find(
      (key) =>
        params[key as keyof WhatIfParameters] !==
        modifiedParams[key as keyof WhatIfParameters]
    );

    if (changedParam) {
      track(
        "whatif_parameter_changed",
        {
          parameter_name: changedParam,
          original_value: String(originalParams[changedParam as keyof WhatIfParameters]),
          new_value_whatif: String(params[changedParam as keyof WhatIfParameters]),
        },
        sessionId
      );
    }

    setModifiedParams(params);
  };

  const handleRegenerate = () => {
    track(
      "whatif_regenerate_clicked",
      {
        parameters: modifiedParams,
        improved_count: improvedCount,
        unlocked_count: unlockedCount,
      },
      sessionId
    );

    if (onRegenerate) {
      onRegenerate(modifiedParams);
    }
  };

  if (ideas.length < 2) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2", className)}
          onClick={handleOpen}
        >
          <Wand2 className="w-4 h-4" />
          What If...?
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:w-[450px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Explore Scenarios
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Parameter controls */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">
              Adjust your parameters to see how ideas change:
            </h3>
            <ParameterControls
              parameters={modifiedParams}
              onChange={handleParamChange}
              originalParams={originalParams}
            />
          </div>

          {/* Results summary */}
          {hasChanges && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Impact Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
                    <p className="text-lg font-bold text-green-600">
                      {improvedCount}
                    </p>
                    <p className="text-xs text-green-600/80">Improved</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted">
                    <p className="text-lg font-bold text-muted-foreground">
                      {results.length - improvedCount - reducedCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Unchanged</p>
                  </div>
                  <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
                    <p className="text-lg font-bold text-red-600">
                      {reducedCount}
                    </p>
                    <p className="text-xs text-red-600/80">Reduced</p>
                  </div>
                </div>

                {unlockedCount > 0 && (
                  <p className="text-sm text-green-600 mt-3 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {unlockedCount} idea{unlockedCount > 1 ? "s" : ""} now
                    viable!
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Results list */}
          {hasChanges && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Idea Impact:</h3>
              {results.map((result) => (
                <ResultCard key={result.idea.id} result={result} />
              ))}
            </div>
          )}
        </div>

        <SheetFooter className="border-t pt-4">
          {onRegenerate && hasChanges && (
            <Button onClick={handleRegenerate} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate Ideas with These Parameters
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default WhatIfScenario;
