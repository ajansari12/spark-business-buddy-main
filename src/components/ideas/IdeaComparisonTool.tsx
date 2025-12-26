// ============================================================================
// IDEA COMPARISON TOOL
// Side-by-side comparison of 2-3 business ideas
// ============================================================================

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Scale,
  DollarSign,
  Clock,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle2,
  X,
  ChevronRight,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnalytics } from "@/hooks/useEnhancedAnalytics";

// ============================================================================
// TYPES
// ============================================================================

export interface ComparableIdea {
  id: string;
  title: string;
  tagline?: string;
  category: "Service" | "Product" | "Digital" | "Hybrid";
  viability_score: number;
  risk_level: "Low" | "Medium" | "High";
  investment_min: number;
  investment_max: number;
  time_to_revenue: string;
  time_to_launch: string;
  financials?: {
    startup_cost_breakdown?: { total: number };
    monthly_revenue_low?: number;
    monthly_revenue_high?: number;
    break_even_months?: number;
    year_one_profit_low?: number;
    year_one_profit_high?: number;
    monthly_expenses?: number;
  };
  market_analysis?: {
    why_fit?: string;
    competitors?: { name: string }[];
    challenges?: string[];
  };
  confidence_factors?: string[];
}

interface ComparisonCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  getValue: (idea: ComparableIdea) => string | number | React.ReactNode;
  getBestIndex?: (ideas: ComparableIdea[]) => number;
  format?: "currency" | "percent" | "text" | "badge";
}

// ============================================================================
// COMPARISON LOGIC
// ============================================================================

const COMPARISON_CATEGORIES: ComparisonCategory[] = [
  {
    id: "viability",
    label: "Viability Score",
    icon: <TrendingUp className="w-4 h-4" />,
    getValue: (idea) => idea.viability_score.toFixed(1),
    getBestIndex: (ideas) => {
      const scores = ideas.map((i) => i.viability_score);
      return scores.indexOf(Math.max(...scores));
    },
  },
  {
    id: "risk",
    label: "Risk Level",
    icon: <Shield className="w-4 h-4" />,
    getValue: (idea) => (
      <Badge
        variant="outline"
        className={cn(
          idea.risk_level === "Low" && "border-green-500 text-green-600",
          idea.risk_level === "Medium" && "border-yellow-500 text-yellow-600",
          idea.risk_level === "High" && "border-red-500 text-red-600"
        )}
      >
        {idea.risk_level}
      </Badge>
    ),
    getBestIndex: (ideas) => {
      const riskOrder = { Low: 0, Medium: 1, High: 2 };
      const risks = ideas.map((i) => riskOrder[i.risk_level]);
      return risks.indexOf(Math.min(...risks));
    },
  },
  {
    id: "startup_cost",
    label: "Startup Cost",
    icon: <DollarSign className="w-4 h-4" />,
    getValue: (idea) => {
      const total = idea.financials?.startup_cost_breakdown?.total;
      return total ? `$${total.toLocaleString()}` : `$${idea.investment_min.toLocaleString()} - $${idea.investment_max.toLocaleString()}`;
    },
    getBestIndex: (ideas) => {
      const costs = ideas.map(
        (i) => i.financials?.startup_cost_breakdown?.total || i.investment_min
      );
      return costs.indexOf(Math.min(...costs));
    },
  },
  {
    id: "monthly_revenue",
    label: "Monthly Revenue",
    icon: <TrendingUp className="w-4 h-4" />,
    getValue: (idea) => {
      const low = idea.financials?.monthly_revenue_low;
      const high = idea.financials?.monthly_revenue_high;
      if (low && high) {
        return `$${low.toLocaleString()} - $${high.toLocaleString()}`;
      }
      return "Varies";
    },
    getBestIndex: (ideas) => {
      const revenues = ideas.map(
        (i) => i.financials?.monthly_revenue_high || 0
      );
      return revenues.indexOf(Math.max(...revenues));
    },
  },
  {
    id: "break_even",
    label: "Break Even",
    icon: <Clock className="w-4 h-4" />,
    getValue: (idea) => {
      const months = idea.financials?.break_even_months;
      return months ? `${months} months` : "Varies";
    },
    getBestIndex: (ideas) => {
      const times = ideas.map((i) => i.financials?.break_even_months || 999);
      return times.indexOf(Math.min(...times));
    },
  },
  {
    id: "time_to_launch",
    label: "Time to Launch",
    icon: <Clock className="w-4 h-4" />,
    getValue: (idea) => idea.time_to_launch,
  },
  {
    id: "time_to_revenue",
    label: "Time to Revenue",
    icon: <Clock className="w-4 h-4" />,
    getValue: (idea) => idea.time_to_revenue,
  },
  {
    id: "year_one_profit",
    label: "Year 1 Profit",
    icon: <DollarSign className="w-4 h-4" />,
    getValue: (idea) => {
      const low = idea.financials?.year_one_profit_low;
      const high = idea.financials?.year_one_profit_high;
      if (low && high) {
        return `$${low.toLocaleString()} - $${high.toLocaleString()}`;
      }
      return "Varies";
    },
    getBestIndex: (ideas) => {
      const profits = ideas.map(
        (i) => i.financials?.year_one_profit_high || 0
      );
      return profits.indexOf(Math.max(...profits));
    },
  },
  {
    id: "competitors",
    label: "Competition",
    icon: <Shield className="w-4 h-4" />,
    getValue: (idea) => {
      const count = idea.market_analysis?.competitors?.length || 0;
      return `${count} competitors`;
    },
    getBestIndex: (ideas) => {
      const counts = ideas.map(
        (i) => i.market_analysis?.competitors?.length || 0
      );
      return counts.indexOf(Math.min(...counts));
    },
  },
  {
    id: "challenges",
    label: "Challenges",
    icon: <AlertTriangle className="w-4 h-4" />,
    getValue: (idea) => {
      const count = idea.market_analysis?.challenges?.length || 0;
      return `${count} identified`;
    },
  },
  {
    id: "category",
    label: "Business Type",
    icon: <Star className="w-4 h-4" />,
    getValue: (idea) => (
      <Badge variant="secondary">{idea.category}</Badge>
    ),
  },
];

// ============================================================================
// SELECTION COMPONENT
// ============================================================================

interface IdeaSelectionProps {
  ideas: ComparableIdea[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  maxSelection?: number;
}

const IdeaSelection = ({
  ideas,
  selectedIds,
  onSelectionChange,
  maxSelection = 3,
}: IdeaSelectionProps) => {
  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else if (selectedIds.length < maxSelection) {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Select {maxSelection} ideas to compare ({selectedIds.length}/{maxSelection})
      </p>
      <div className="space-y-2">
        {ideas.map((idea, index) => (
          <div
            key={idea.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
              selectedIds.includes(idea.id)
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
            onClick={() => toggleSelection(idea.id)}
          >
            <Checkbox
              checked={selectedIds.includes(idea.id)}
              disabled={
                !selectedIds.includes(idea.id) &&
                selectedIds.length >= maxSelection
              }
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">#{index + 1}</span>
                <span className="font-medium truncate">{idea.title}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {idea.category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {idea.viability_score.toFixed(1)}/10
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// COMPARISON TABLE
// ============================================================================

interface ComparisonTableProps {
  ideas: ComparableIdea[];
  onRemove?: (id: string) => void;
}

const ComparisonTable = ({ ideas, onRemove }: ComparisonTableProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(COMPARISON_CATEGORIES.slice(0, 6).map((c) => c.id))
  );

  const toggleCategory = (id: string) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedCategories(newSet);
  };

  // Find best value for each category
  const bestIndices = useMemo(() => {
    const indices: Record<string, number> = {};
    for (const category of COMPARISON_CATEGORIES) {
      if (category.getBestIndex) {
        indices[category.id] = category.getBestIndex(ideas);
      }
    }
    return indices;
  }, [ideas]);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Factor</TableHead>
            {ideas.map((idea, index) => (
              <TableHead key={idea.id} className="min-w-[150px]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      #{index + 1}
                    </span>
                    <p className="font-medium truncate max-w-[120px]">
                      {idea.title}
                    </p>
                  </div>
                  {onRemove && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => onRemove(idea.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {COMPARISON_CATEGORIES.map((category) => (
            <TableRow
              key={category.id}
              className={cn(
                !expandedCategories.has(category.id) && "opacity-50"
              )}
            >
              <TableCell>
                <button
                  className="flex items-center gap-2 text-left w-full"
                  onClick={() => toggleCategory(category.id)}
                >
                  {category.icon}
                  <span className="text-sm">{category.label}</span>
                </button>
              </TableCell>
              {ideas.map((idea, index) => {
                const isBest = bestIndices[category.id] === index;
                const value = category.getValue(idea);

                return (
                  <TableCell
                    key={idea.id}
                    className={cn(
                      isBest && "bg-green-50 dark:bg-green-950/20"
                    )}
                  >
                    <div className="flex items-center gap-1">
                      {isBest && (
                        <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                      )}
                      <span className={cn("text-sm", isBest && "font-medium")}>
                        {value}
                      </span>
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// ============================================================================
// SUMMARY CARD
// ============================================================================

interface ComparisonSummaryProps {
  ideas: ComparableIdea[];
}

const ComparisonSummary = ({ ideas }: ComparisonSummaryProps) => {
  // Calculate winner based on most "best" categories
  const scores = useMemo(() => {
    const ideaScores = ideas.map(() => 0);

    for (const category of COMPARISON_CATEGORIES) {
      if (category.getBestIndex) {
        const bestIndex = category.getBestIndex(ideas);
        if (bestIndex >= 0) {
          ideaScores[bestIndex]++;
        }
      }
    }

    return ideaScores;
  }, [ideas]);

  const winnerIndex = scores.indexOf(Math.max(...scores));
  const winner = ideas[winnerIndex];

  return (
    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
      <div className="flex items-center gap-2 mb-2">
        <Star className="w-5 h-5 text-primary" />
        <h4 className="font-semibold">Recommendation</h4>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        Based on the comparison, <strong>{winner.title}</strong> leads in{" "}
        {scores[winnerIndex]} out of {COMPARISON_CATEGORIES.filter((c) => c.getBestIndex).length}{" "}
        categories.
      </p>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        {ideas.map((idea, index) => (
          <div
            key={idea.id}
            className={cn(
              "p-2 rounded-lg",
              index === winnerIndex ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
          >
            <p className="font-medium truncate">{idea.title}</p>
            <p>{scores[index]} wins</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface IdeaComparisonToolProps {
  ideas: ComparableIdea[];
  sessionId?: string;
  className?: string;
}

export const IdeaComparisonTool = ({
  ideas,
  sessionId,
  className,
}: IdeaComparisonToolProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const { track } = useAnalytics();

  const selectedIdeas = useMemo(
    () => ideas.filter((i) => selectedIds.includes(i.id)),
    [ideas, selectedIds]
  );

  const handleOpen = () => {
    setIsOpen(true);
    track("comparison_opened", { idea_count: ideas.length }, sessionId);
  };

  const handleSelectionChange = (ids: string[]) => {
    setSelectedIds(ids);
    if (ids.length > selectedIds.length) {
      track(
        "comparison_idea_added",
        { idea_id: ids[ids.length - 1], comparison_count: ids.length },
        sessionId
      );
    } else {
      track(
        "comparison_idea_removed",
        { comparison_count: ids.length },
        sessionId
      );
    }
  };

  const handleCompare = () => {
    setShowComparison(true);
    track(
      "comparison_completed",
      {
        idea_ids: selectedIds,
        comparison_count: selectedIds.length,
      },
      sessionId
    );
  };

  const handleRemove = (id: string) => {
    setSelectedIds(selectedIds.filter((i) => i !== id));
    if (selectedIds.length <= 2) {
      setShowComparison(false);
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
          <Scale className="w-4 h-4" />
          Compare Ideas
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="h-[85vh] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Compare Business Ideas
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {!showComparison ? (
            <div className="max-w-md mx-auto">
              <IdeaSelection
                ideas={ideas}
                selectedIds={selectedIds}
                onSelectionChange={handleSelectionChange}
                maxSelection={3}
              />

              <Button
                className="w-full mt-4"
                disabled={selectedIds.length < 2}
                onClick={handleCompare}
              >
                Compare {selectedIds.length} Ideas
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <ComparisonSummary ideas={selectedIdeas} />
              <ComparisonTable ideas={selectedIdeas} onRemove={handleRemove} />

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowComparison(false)}
              >
                Change Selection
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default IdeaComparisonTool;
