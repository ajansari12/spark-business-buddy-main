import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BusinessIdeaDisplay, Competitor, CanadianResource, splitResourcesByEligibility } from "@/types/ideas-enhanced";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { TrustIndicatorBadges } from "./TrustIndicatorBadges";
import { GrantVerificationBadge } from "./GrantVerificationBadge";
import { BusinessNameGenerator } from "./BusinessNameGenerator";
import { GrantKitGenerator } from "./GrantKitGenerator";
import { StrategyCallBooking } from "./StrategyCallBooking";
import { IdeaBuilderToolkit } from "./IdeaBuilderToolkit";
import { InvestorOnePager } from "./InvestorOnePager";
import { WhatIfScenario, IdeaForWhatIf } from "./WhatIfScenario";
import { useOrderTier } from "@/hooks/useOrderTier";
import { generateYear1CashFlow, generate3YearModel, downloadSpreadsheet } from "@/utils/spreadsheetExport";
import { toast } from "sonner";
import {
  Heart,
  DollarSign,
  Clock,
  TrendingUp,
  MapPin,
  ChevronDown,
  AlertTriangle,
  ArrowLeft,
  Users,
  Target,
  Zap,
  CalendarDays,
  ExternalLink,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Star,
  ClipboardList,
  BarChart3,
  Briefcase,
  Newspaper,
  Radio,
  XCircle,
  Info,
  Lock,
  Grid2X2,
  TrendingDown,
  Shield,
  FileSpreadsheet,
  Crown,
  Wand2,
  X,
} from "lucide-react";
import { cn, stripMarkdown } from "@/lib/utils";
import { SimpleMarkdown } from "./SimpleMarkdown";
import { ViabilityScore } from "./ViabilityScore";
import { format } from "date-fns";

export interface IdeaDetailsContentProps {
  idea: BusinessIdeaDisplay;
  onClose: () => void;
  onToggleFavorite: () => void;
  showBackButton?: boolean;
}

const categoryColors: Record<string, string> = {
  Service: "bg-primary/10 text-primary border-primary/20",
  Product: "bg-accent/10 text-accent border-accent/20",
  Digital: "bg-success/10 text-success border-success/20",
  Hybrid: "bg-secondary/10 text-secondary border-secondary/20",
};

const riskColors: Record<string, string> = {
  Low: "bg-success/10 text-success border-success/20",
  Medium: "bg-warning/10 text-warning border-warning/20",
  High: "bg-destructive/10 text-destructive border-destructive/20",
};

export const IdeaDetailsContent = ({
  idea,
  onClose,
  onToggleFavorite,
  showBackButton = false,
}: IdeaDetailsContentProps) => {
  const navigate = useNavigate();
  const { isComplete, isVip } = useOrderTier();
  const [checkedSteps, setCheckedSteps] = useState<boolean[]>(
    new Array(idea.firstSteps.length).fill(false)
  );
  const [challengesOpen, setChallengesOpen] = useState(false);
  const [competitorsOpen, setCompetitorsOpen] = useState(false);
  const [financialsOpen, setFinancialsOpen] = useState(false);
  const [actionPlanOpen, setActionPlanOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [marketSignalsOpen, setMarketSignalsOpen] = useState(false);
  const [whatIfOpen, setWhatIfOpen] = useState(false);
  const [swotOpen, setSwotOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [riskMitigationOpen, setRiskMitigationOpen] = useState(false);
  const [customerAcqOpen, setCustomerAcqOpen] = useState(false);
  const [roadmapOpen, setRoadmapOpen] = useState(false);

  const parseMoneyString = (str?: string): number => {
    if (!str) return 0;
    const match = str.replace(/[$,]/g, "").match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const ideaForWhatIf = useMemo<IdeaForWhatIf | null>(() => {
    const startupCost = parseMoneyString(idea.startupCost);
    return {
      id: idea.id,
      title: idea.name,
      viability_score: idea.viabilityScore,
      risk_level: (idea.riskLevel as "Low" | "Medium" | "High") || "Medium",
      investment_min: startupCost * 0.8,
      investment_max: startupCost * 1.2,
      time_to_revenue: idea.breakEvenTimeline || "3-6 months",
      financials: {
        startup_cost_breakdown: { total: startupCost },
        monthly_revenue_low: parseMoneyString(idea.monthlyRevenuePotential) * 0.7,
        monthly_revenue_high: parseMoneyString(idea.monthlyRevenuePotential) * 1.3,
      }
    };
  }, [idea]);

  const handleDownloadSpreadsheet = () => {
    if (!isComplete) {
      toast.error("Upgrade to Complete tier to download financial spreadsheets");
      onClose();
      navigate("/pricing");
      return;
    }
    
    try {
      const blob = generateYear1CashFlow(idea);
      const filename = `FastTrack-${idea.name.replace(/\s+/g, '-')}-Year1-Financials.xlsx`;
      downloadSpreadsheet(blob, filename);
      toast.success("Spreadsheet downloaded!");
    } catch (err) {
      console.error("Spreadsheet generation failed:", err);
      toast.error("Failed to generate spreadsheet");
    }
  };

  const handleDownload3YearModel = () => {
    if (!isVip) {
      toast.error("Upgrade to VIP tier to download 3-year financial model");
      onClose();
      navigate("/pricing");
      return;
    }
    
    try {
      const blob = generate3YearModel(idea);
      const filename = `FastTrack-${idea.name.replace(/\s+/g, '-')}-3Year-Model.xlsx`;
      downloadSpreadsheet(blob, filename);
      toast.success("3-Year model downloaded!");
    } catch (err) {
      console.error("3-Year model generation failed:", err);
      toast.error("Failed to generate 3-year model");
    }
  };

  const handleStepToggle = (index: number) => {
    setCheckedSteps((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const completedSteps = checkedSteps.filter(Boolean).length;

  const costBreakdownItems = idea.startupCostBreakdown
    ? Object.entries(idea.startupCostBreakdown).filter(
        ([key, value]) => key !== "total" && value && value > 0
      )
    : [];

  return (
    <div className="overflow-y-auto h-full pb-8">
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-4">
        {showBackButton ? (
          <Button variant="ghost" size="sm" onClick={onClose} className="-ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to cards
          </Button>
        ) : (
          <button onClick={onToggleFavorite} className="touch-target flex items-center justify-center">
            <Heart
              className={cn(
                "w-6 h-6 transition-colors",
                idea.isFavorite ? "fill-accent text-accent" : "text-muted-foreground hover:text-accent"
              )}
            />
          </button>
        )}
        {!showBackButton && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Title Section */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="outline" className={cn("text-xs", categoryColors[idea.category])}>
              {idea.category}
            </Badge>
            {idea.riskLevel && (
              <Badge variant="outline" className={cn("text-xs", riskColors[idea.riskLevel])}>
                {idea.riskLevel} Risk
              </Badge>
            )}
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-1">
            {stripMarkdown(idea.name)}
          </h2>
          <p className="text-accent font-medium">{stripMarkdown(idea.tagline)}</p>
        </div>
        <div className="flex flex-col items-center">
          <ViabilityScore score={idea.viabilityScore} size="lg" />
          <span className="text-xs text-muted-foreground mt-1">Viability</span>
        </div>
      </div>

      {showBackButton && (
        <button
          onClick={onToggleFavorite}
          className="absolute top-4 right-12 touch-target flex items-center justify-center"
        >
          <Heart
            className={cn(
              "w-7 h-7 transition-colors",
              idea.isFavorite ? "fill-accent text-accent" : "text-muted-foreground"
            )}
          />
        </button>
      )}

      {/* Trust Indicator Badges */}
      <div className="mb-6">
        <TrustIndicatorBadges idea={idea} />
      </div>

      {/* Confidence Factors */}
      {idea.confidenceFactors && idea.confidenceFactors.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {idea.confidenceFactors.map((factor, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              <ShieldCheck className="w-3 h-3 mr-1" />
              {factor}
            </Badge>
          ))}
        </div>
      )}

      {/* Description */}
      <div className="mb-6">
        <h3 className="font-semibold text-foreground mb-2">About This Business</h3>
        <SimpleMarkdown text={idea.description} className="text-muted-foreground" />
      </div>

      {/* Quick Win Highlight */}
      {idea.quickWin && (
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-primary">Quick Win</h3>
          </div>
          <p className="text-foreground">{idea.quickWin}</p>
        </div>
      )}

      {/* Why it fits */}
      <div className="bg-success/10 rounded-2xl p-4 mb-6">
        <h3 className="font-semibold text-success mb-2">Why This Fits You</h3>
        <p className="text-foreground mb-3">{idea.whyItFits}</p>
        {idea.targetCustomer && (
          <div className="flex items-start gap-2 pt-3 border-t border-success/20">
            <Target className="w-4 h-4 text-success mt-0.5" />
            <div>
              <span className="text-xs text-success font-medium">Target Customer:</span>
              <p className="text-foreground text-sm">{idea.targetCustomer}</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm">Startup Cost</span>
          </div>
          <p className="font-bold text-lg text-foreground">{idea.startupCost}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm">Monthly Revenue</span>
          </div>
          <p className="font-bold text-lg text-foreground">{idea.monthlyRevenuePotential}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-sm">Break Even</span>
          </div>
          <p className="font-bold text-lg text-foreground">{idea.breakEvenTimeline}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <CalendarDays className="w-5 h-5" />
            <span className="text-sm">Time to Launch</span>
          </div>
          <p className="font-bold text-lg text-foreground">{idea.timeToLaunch}</p>
        </div>
      </div>

      {/* Year One Profit */}
      {idea.yearOneProfit && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Wallet className="w-5 h-5" />
            <span className="text-sm">Year One Profit Potential</span>
          </div>
          <p className="font-bold text-lg text-foreground">{idea.yearOneProfit}</p>
        </div>
      )}

      {/* Local advantage */}
      <div className="bg-accent/10 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-foreground">Local Advantage</h3>
        </div>
        <p className="text-muted-foreground">{idea.localOpportunity || idea.localAdvantage}</p>
      </div>

      {/* What-If Scenarios */}
      {ideaForWhatIf && (
        <Collapsible open={whatIfOpen} onOpenChange={setWhatIfOpen} className="mb-6">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 bg-primary/5 rounded-2xl hover:bg-primary/10 transition-colors">
              <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">What If Scenarios</span>
                <Badge variant="secondary" className="text-xs">Interactive</Badge>
              </div>
              <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", whatIfOpen && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-4">
                Adjust your budget, time, or risk tolerance to see how this idea's viability changes.
              </p>
              <WhatIfScenario
                ideas={[ideaForWhatIf]}
                currentProfile={{
                  budget_min: ideaForWhatIf.investment_min * 0.8,
                  budget_max: ideaForWhatIf.investment_max * 1.2,
                  time_commitment_hours: 20,
                  income_goal: "$3000/month",
                }}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Competitors */}
      {idea.competitors && idea.competitors.length > 0 && (
        <Collapsible open={competitorsOpen} onOpenChange={setCompetitorsOpen} className="mb-6">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-2xl hover:bg-muted transition-colors">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">Competition</span>
                <Badge variant="secondary" className="text-xs">{idea.competitors.length}</Badge>
              </div>
              <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", competitorsOpen && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-3">
            {idea.marketSaturation && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-xl">
                <strong>Market:</strong> {idea.marketSaturation}
              </div>
            )}
            {idea.competitors.map((competitor: Competitor, index: number) => (
              <div key={index} className={cn("bg-card border rounded-xl p-3", competitor.is_verified ? "border-success/50" : "border-border")}>
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{competitor.name}</span>
                    {competitor.is_verified && (
                      <Badge variant="outline" className="text-xs text-success border-success/30 py-0">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  {competitor.price_range && (
                    <Badge variant="outline" className="text-xs">{competitor.price_range}</Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm mb-2">{competitor.description}</p>
                {competitor.google_rating && (
                  <div className="flex items-center gap-1 text-sm text-amber-600 mb-2">
                    <Star className="w-4 h-4 fill-amber-400" />
                    {competitor.google_rating}
                  </div>
                )}
                {competitor.website && (
                  <a 
                    href={competitor.website.startsWith('http') ? competitor.website : `https://${competitor.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1 mb-2"
                  >
                    {competitor.website} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {competitor.strengths && competitor.strengths.length > 0 && (
                  <p className="text-muted-foreground text-sm mb-1">
                    <strong>Strengths:</strong> {competitor.strengths.join(", ")}
                  </p>
                )}
                {(competitor.weakness || (competitor.weaknesses && competitor.weaknesses.length > 0)) && (
                  <p className="text-success text-sm">
                    <span className="font-medium">Your edge:</span> {competitor.weakness || competitor.weaknesses?.[0]}
                  </p>
                )}
              </div>
            ))}
            {idea.competitiveGap && (
              <div className="bg-success/10 border border-success/20 rounded-xl p-3 mt-2">
                <p className="text-sm font-medium text-success mb-1">🎯 Your Opportunity</p>
                <p className="text-sm text-foreground">{idea.competitiveGap}</p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Financial Breakdown */}
      {costBreakdownItems.length > 0 && (
        <Collapsible open={financialsOpen} onOpenChange={setFinancialsOpen} className="mb-6">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-2xl hover:bg-muted transition-colors">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-success" />
                <span className="font-semibold text-foreground">Startup Cost Breakdown</span>
              </div>
              <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", financialsOpen && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="bg-card border border-border rounded-xl p-4 space-y-2">
              {costBreakdownItems.map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                  <span className="text-foreground font-medium">${value?.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-foreground">
                  ${idea.startupCostBreakdown?.total?.toLocaleString()}
                </span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* 30-Day Action Plan */}
      {idea.thirtyDayPlan && idea.thirtyDayPlan.length > 0 && (
        <Collapsible open={actionPlanOpen} onOpenChange={setActionPlanOpen} className="mb-6">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-2xl hover:bg-muted transition-colors">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">30-Day Action Plan</span>
                <Badge variant="secondary" className="text-xs">{idea.thirtyDayPlan.length} steps</Badge>
              </div>
              <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", actionPlanOpen && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="space-y-2">
              {idea.thirtyDayPlan.map((step: string, index: number) => (
                <div key={index} className="flex items-start gap-3 bg-card border border-border rounded-xl p-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-foreground text-sm">{step}</p>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Canadian Resources */}
      {idea.canadianResources && idea.canadianResources.length > 0 && (() => {
        const { eligible, ineligible } = splitResourcesByEligibility(idea.canadianResources);
        return (
          <Collapsible open={resourcesOpen} onOpenChange={setResourcesOpen} className="mb-6">
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-2xl hover:bg-muted transition-colors">
                <div className="flex items-center gap-2 flex-wrap">
                  <MapPin className="w-5 h-5 text-accent" />
                  <span className="font-semibold text-foreground">Canadian Resources</span>
                  {eligible.length > 0 && (
                    <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {eligible.length} Eligible
                    </Badge>
                  )}
                </div>
                <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", resourcesOpen && "rotate-180")} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-4">
              {eligible.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-2 px-1">
                    <CheckCircle2 className="w-4 h-4" />
                    You're eligible for these programs:
                  </p>
                  {eligible.map((resource: CanadianResource, index: number) => (
                    <div key={index} className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="font-medium text-foreground">{resource.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">{resource.type}</Badge>
                      </div>
                      <div className="mb-2">
                        <GrantVerificationBadge 
                          status={resource.status}
                          deadline={resource.deadline}
                          lastVerified={resource.lastVerified}
                        />
                      </div>
                      <p className="text-muted-foreground text-sm mb-2">{resource.description}</p>
                      {resource.funding_amount && (
                        <p className="text-green-600 dark:text-green-400 text-sm font-medium mb-2">
                          Funding: {resource.funding_amount}
                        </p>
                      )}
                      {resource.url && (
                        <Button size="sm" asChild className="mt-2">
                          <a href={resource.url} target="_blank" rel="noopener noreferrer">
                            Apply Now <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {ineligible.length > 0 && (
                <Collapsible>
                  <CollapsibleTrigger className="w-full flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 px-1">
                    <Info className="w-4 h-4" />
                    <span>Other programs ({ineligible.length} not eligible based on your profile)</span>
                    <ChevronDown className="w-4 h-4 ml-auto" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pt-2">
                    {ineligible.map((resource: CanadianResource, index: number) => (
                      <div key={index} className="bg-muted/30 border border-border rounded-xl p-3 opacity-70">
                        <div className="flex items-start justify-between mb-1">
                          <span className="font-medium text-foreground text-sm">{resource.name}</span>
                          <Badge variant="outline" className="text-xs capitalize">{resource.type}</Badge>
                        </div>
                        {resource.eligibility_reason && (
                          <p className="text-destructive text-xs flex items-center gap-1 mb-2">
                            <XCircle className="w-3 h-3" />
                            {resource.eligibility_reason}
                          </p>
                        )}
                        <p className="text-muted-foreground text-xs mb-2">{resource.description}</p>
                        {resource.url && (
                          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-muted-foreground text-xs hover:text-primary">
                            Learn more <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </CollapsibleContent>
          </Collapsible>
        );
      })()}

      {/* Challenges */}
      {idea.challenges && idea.challenges.length > 0 && (
        <Collapsible open={challengesOpen} onOpenChange={setChallengesOpen} className="mb-6">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-2xl hover:bg-muted transition-colors">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-accent" />
                <span className="font-semibold text-foreground">Challenges to Consider</span>
                <Badge variant="secondary" className="text-xs">{idea.challenges.length}</Badge>
              </div>
              <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", challengesOpen && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <ul className="space-y-2 pl-4">
              {idea.challenges.map((challenge, index) => (
                <li key={index} className="text-muted-foreground text-sm flex items-start gap-2">
                  <span className="text-accent mt-1">•</span>
                  {challenge}
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Market Signals */}
      {idea.marketSignals && (
        <Collapsible open={marketSignalsOpen} onOpenChange={setMarketSignalsOpen} className="mb-6">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-2xl hover:bg-muted transition-colors">
              <div className="flex items-center gap-2 flex-wrap">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                <span className="font-semibold text-foreground">Market Signals</span>
                {idea.marketSignals.last_updated && (
                  (Date.now() - new Date(idea.marketSignals.last_updated).getTime()) < 7 * 24 * 60 * 60 * 1000 ? (
                    <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                      <Radio className="w-3 h-3 mr-1 animate-pulse" />
                      LIVE
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/30">
                      <Clock className="w-3 h-3 mr-1" />
                      Stale
                    </Badge>
                  )
                )}
                {idea.marketSignals.demand_indicator && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      idea.marketSignals.demand_indicator === "High" && "text-success border-success/30 bg-success/10",
                      idea.marketSignals.demand_indicator === "Medium" && "text-warning border-warning/30 bg-warning/10",
                      idea.marketSignals.demand_indicator === "Low" && "text-destructive border-destructive/30 bg-destructive/10"
                    )}
                  >
                    {idea.marketSignals.demand_indicator} Demand
                  </Badge>
                )}
              </div>
              <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", marketSignalsOpen && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-4">
            {idea.marketSignals.job_postings && idea.marketSignals.job_postings.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {idea.marketSignals.job_posting_count || idea.marketSignals.job_postings.length} Related Jobs Found
                  </span>
                </div>
                <div className="space-y-3">
                  {idea.marketSignals.job_postings.slice(0, 5).map((job, i) => (
                    <div key={i} className="border-l-2 border-primary/30 pl-3">
                      <span className="font-medium text-foreground text-sm">{job.title}</span>
                      <p className="text-xs text-muted-foreground">{job.company} • {job.location}</p>
                      {job.url && (
                        <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {idea.marketSignals.news_highlights && idea.marketSignals.news_highlights.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Newspaper className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-foreground">Industry News</span>
                </div>
                <ul className="space-y-2">
                  {idea.marketSignals.news_highlights.slice(0, 3).map((news, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-purple-500">•</span>
                      {news}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {idea.marketSignals.regulatory_notes && Array.isArray(idea.marketSignals.regulatory_notes) && idea.marketSignals.regulatory_notes.length > 0 && (
              <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-sm font-medium text-warning">Regulatory Notes</span>
                </div>
                <ul className="space-y-1">
                  {idea.marketSignals.regulatory_notes.map((note, i) => (
                    <li key={i} className="text-xs text-foreground flex items-start gap-1">
                      <span className="text-warning">!</span> {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* SWOT Analysis - Tier 2+ */}
      {isComplete && idea.swotAnalysis && (
        <Collapsible open={swotOpen} onOpenChange={setSwotOpen} className="mb-6">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 bg-primary/10 rounded-2xl hover:bg-primary/20 transition-colors">
              <div className="flex items-center gap-2">
                <Grid2X2 className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">SWOT Analysis</span>
                <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">Complete Tier</Badge>
              </div>
              <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", swotOpen && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-success/10 border border-success/20 rounded-xl p-3">
                <span className="text-xs font-medium text-success block mb-2">Strengths</span>
                <ul className="space-y-1">
                  {idea.swotAnalysis.strengths?.map((s, i) => (
                    <li key={i} className="text-xs text-foreground flex items-start gap-1">
                      <CheckCircle2 className="w-3 h-3 text-success mt-0.5" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                <span className="text-xs font-medium text-destructive block mb-2">Weaknesses</span>
                <ul className="space-y-1">
                  {idea.swotAnalysis.weaknesses?.map((w, i) => (
                    <li key={i} className="text-xs text-foreground flex items-start gap-1">
                      <TrendingDown className="w-3 h-3 text-destructive mt-0.5" /> {w}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
                <span className="text-xs font-medium text-primary block mb-2">Opportunities</span>
                <ul className="space-y-1">
                  {idea.swotAnalysis.opportunities?.map((o, i) => (
                    <li key={i} className="text-xs text-foreground flex items-start gap-1">
                      <TrendingUp className="w-3 h-3 text-primary mt-0.5" /> {o}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-warning/10 border border-warning/20 rounded-xl p-3">
                <span className="text-xs font-medium text-warning block mb-2">Threats</span>
                <ul className="space-y-1">
                  {idea.swotAnalysis.threats?.map((t, i) => (
                    <li key={i} className="text-xs text-foreground flex items-start gap-1">
                      <AlertTriangle className="w-3 h-3 text-warning mt-0.5" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Pricing Strategy - Tier 2+ */}
      {isComplete && idea.pricingStrategy && (
        <Collapsible open={pricingOpen} onOpenChange={setPricingOpen} className="mb-6">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 bg-success/10 rounded-2xl hover:bg-success/20 transition-colors">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-success" />
                <span className="font-semibold text-foreground">Pricing Strategy</span>
                <Badge variant="secondary" className="text-xs bg-success/20 text-success">Complete Tier</Badge>
              </div>
              <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", pricingOpen && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Recommended Model</span>
                <Badge variant="outline" className="capitalize">{idea.pricingStrategy.recommended_model}</Badge>
              </div>
              <p className="text-sm text-foreground">{idea.pricingStrategy.rationale}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <span className="text-xs text-muted-foreground block mb-1">Entry</span>
                <span className="font-bold text-foreground">{idea.pricingStrategy.price_range.low}</span>
              </div>
              <div className="bg-primary/10 rounded-xl p-3 text-center border-2 border-primary/30">
                <span className="text-xs text-primary block mb-1">Standard</span>
                <span className="font-bold text-foreground">{idea.pricingStrategy.price_range.mid}</span>
              </div>
              <div className="bg-accent/10 rounded-xl p-3 text-center">
                <span className="text-xs text-accent block mb-1">Premium</span>
                <span className="font-bold text-foreground">{idea.pricingStrategy.price_range.premium}</span>
              </div>
            </div>
            {idea.pricingStrategy.competitor_comparison && (
              <div className="bg-muted/50 rounded-xl p-3">
                <span className="text-xs text-muted-foreground block mb-1">vs. Competitors</span>
                <p className="text-sm text-foreground">{idea.pricingStrategy.competitor_comparison}</p>
              </div>
            )}
            {idea.pricingStrategy.discounting_strategy && (
              <div className="bg-warning/10 border border-warning/20 rounded-xl p-3">
                <span className="text-xs text-warning block mb-1">Discounting Strategy</span>
                <p className="text-sm text-foreground">{idea.pricingStrategy.discounting_strategy}</p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Risk Mitigation - Tier 2+ */}
      {isComplete && idea.riskMitigation && idea.riskMitigation.length > 0 && (
        <Collapsible open={riskMitigationOpen} onOpenChange={setRiskMitigationOpen} className="mb-6">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 bg-warning/10 rounded-2xl hover:bg-warning/20 transition-colors">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-warning" />
                <span className="font-semibold text-foreground">Risk Mitigation</span>
                <Badge variant="secondary" className="text-xs bg-warning/20 text-warning">{idea.riskMitigation.length} risks</Badge>
              </div>
              <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", riskMitigationOpen && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-3">
            {idea.riskMitigation.map((risk, index) => (
              <div key={index} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-foreground text-sm">{risk.challenge}</h4>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs capitalize",
                      risk.severity === 'high' && "text-destructive border-destructive/30",
                      risk.severity === 'medium' && "text-warning border-warning/30",
                      risk.severity === 'low' && "text-success border-success/30"
                    )}
                  >
                    {risk.severity}
                  </Badge>
                </div>
                <div className="mb-3">
                  <span className="text-xs text-muted-foreground block mb-1">How to Mitigate</span>
                  <ul className="space-y-1">
                    {risk.mitigations.map((m, i) => (
                      <li key={i} className="text-sm text-foreground flex items-start gap-2">
                        <CheckCircle2 className="w-3 h-3 text-success mt-1 flex-shrink-0" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
                {risk.early_warning_signs && (
                  <div className="bg-destructive/5 border border-destructive/10 rounded-lg p-2">
                    <span className="text-xs text-destructive block mb-1">⚠ Early Warning Signs</span>
                    <p className="text-xs text-foreground">{risk.early_warning_signs}</p>
                  </div>
                )}
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Customer Acquisition - Tier 2+ */}
      {isComplete && idea.customerAcquisition && (
        <Collapsible open={customerAcqOpen} onOpenChange={setCustomerAcqOpen} className="mb-6">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 bg-primary/10 rounded-2xl hover:bg-primary/20 transition-colors">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">Customer Acquisition</span>
                <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">Complete Tier</Badge>
              </div>
              <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", customerAcqOpen && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Your First 10 Customers
              </h4>
              <div className="space-y-3">
                {Object.entries(idea.customerAcquisition.first_10_strategy).map(([week, tasks], i) => (
                  <div key={week} className="border-l-2 border-primary/30 pl-3">
                    <span className="text-xs font-medium text-primary uppercase">Week {i + 1}</span>
                    <ul className="space-y-1 mt-1">
                      {(tasks as string[]).map((task, j) => (
                        <li key={j} className="text-sm text-foreground flex items-start gap-2">
                          <CheckCircle2 className="w-3 h-3 text-success mt-1 flex-shrink-0" />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            {idea.customerAcquisition.marketing_channels && idea.customerAcquisition.marketing_channels.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h4 className="font-medium text-foreground mb-3">Marketing Channels</h4>
                <div className="space-y-2">
                  {idea.customerAcquisition.marketing_channels.map((channel, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium text-foreground">{channel.channel}</span>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            channel.roi === 'high' && "text-success border-success/30",
                            channel.roi === 'medium' && "text-warning border-warning/30",
                            channel.roi === 'low' && "text-muted-foreground"
                          )}
                        >
                          {channel.roi} ROI
                        </Badge>
                        <span className="text-xs text-muted-foreground">{channel.cost}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {idea.customerAcquisition.outreach_scripts && (
              <div className="bg-muted/50 rounded-xl p-4">
                <h4 className="font-medium text-foreground mb-3">Outreach Templates</h4>
                {idea.customerAcquisition.outreach_scripts.cold_email && (
                  <div className="mb-3">
                    <span className="text-xs text-muted-foreground block mb-1">Cold Email</span>
                    <p className="text-sm text-foreground bg-card p-2 rounded-lg border">
                      {idea.customerAcquisition.outreach_scripts.cold_email}
                    </p>
                  </div>
                )}
                {idea.customerAcquisition.outreach_scripts.linkedin && (
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">LinkedIn Message</span>
                    <p className="text-sm text-foreground bg-card p-2 rounded-lg border">
                      {idea.customerAcquisition.outreach_scripts.linkedin}
                    </p>
                  </div>
                )}
              </div>
            )}
            {idea.customerAcquisition.referral_strategy && (
              <div className="bg-success/10 border border-success/20 rounded-xl p-3">
                <span className="text-xs text-success block mb-1">Referral Strategy</span>
                <p className="text-sm text-foreground">{idea.customerAcquisition.referral_strategy}</p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* 90-Day Roadmap - Tier 2+ */}
      {isComplete && idea.ninetyDayRoadmap && (
        <Collapsible open={roadmapOpen} onOpenChange={setRoadmapOpen} className="mb-6">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 bg-accent/10 rounded-2xl hover:bg-accent/20 transition-colors">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-accent" />
                <span className="font-semibold text-foreground">90-Day Roadmap</span>
                <Badge variant="secondary" className="text-xs bg-accent/20 text-accent">{idea.ninetyDayRoadmap.weeks?.length || 12} weeks</Badge>
              </div>
              <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", roadmapOpen && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-4">
            <div className="space-y-3">
              {idea.ninetyDayRoadmap.weeks?.slice(0, 12).map((week) => (
                <div 
                  key={week.week} 
                  className={cn(
                    "bg-card border rounded-xl p-4",
                    [4, 8, 12].includes(week.week) ? "border-accent" : "border-border"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {week.week}
                      </div>
                      <span className="font-medium text-foreground">{week.theme}</span>
                    </div>
                    {[4, 8, 12].includes(week.week) && (
                      <Badge variant="outline" className="text-xs text-accent border-accent/30">
                        Checkpoint
                      </Badge>
                    )}
                  </div>
                  <ul className="space-y-1 mb-2">
                    {week.tasks?.slice(0, 3).map((task, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {task}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-4 pt-2 border-t border-border">
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-warning" />
                      <span className="text-xs text-muted-foreground">Milestone: {week.milestone}</span>
                    </div>
                  </div>
                  {week.kpi && (
                    <div className="mt-1 text-xs text-success">
                      KPI: {week.kpi}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {idea.ninetyDayRoadmap.go_no_go_checkpoints && idea.ninetyDayRoadmap.go_no_go_checkpoints.length > 0 && (
              <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
                <h4 className="font-medium text-warning mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Decision Checkpoints
                </h4>
                <div className="space-y-3">
                  {idea.ninetyDayRoadmap.go_no_go_checkpoints.map((checkpoint, i) => (
                    <div key={i} className="bg-card rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">Week {checkpoint.week}</Badge>
                        <span className="text-sm font-medium text-foreground">{checkpoint.question}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-success/10 p-2 rounded">
                          <span className="text-success font-medium">✓ Green Light:</span>
                          <p className="text-foreground">{checkpoint.green_light}</p>
                        </div>
                        <div className="bg-destructive/10 p-2 rounded">
                          <span className="text-destructive font-medium">✗ Red Flag:</span>
                          <p className="text-foreground">{checkpoint.red_flag}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* VIP: Business Name Generator */}
      <div className="mb-6">
        {isVip ? (
          <BusinessNameGenerator
            ideaId={idea.id}
            ideaTitle={idea.name}
            initialNames={(idea as any).businessNames}
          />
        ) : (
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-foreground">AI Business Name Generator</h3>
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/30">VIP</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Get 10-15 AI-generated business names with domain suggestions, taglines, and brand rationale.
            </p>
            <Button
              variant="outline"
              className="w-full border-amber-500/30 hover:bg-amber-500/10"
              onClick={() => {
                onClose();
                navigate("/pricing");
              }}
            >
              <Lock className="w-4 h-4 mr-2" />
              Unlock with VIP Launch ($299)
            </Button>
          </div>
        )}
      </div>

      {/* VIP: Investor One-Pager */}
      {isVip && (
        <div className="mb-6">
          <InvestorOnePager idea={idea} />
        </div>
      )}

      {/* VIP: Grant Kit Generator */}
      {isVip && idea.canadianResources && idea.canadianResources.filter(r => r.is_eligible).length > 0 && (
        <div className="mb-6">
          <GrantKitGenerator
            ideaId={idea.id}
            eligibleGrants={idea.canadianResources.filter(r => r.is_eligible)}
          />
        </div>
      )}

      {/* VIP: Strategy Call Booking */}
      {isVip && (
        <div className="mb-6">
          <StrategyCallBooking ideaTitle={idea.name} />
        </div>
      )}

      {/* VIP: 3-Year Financial Model */}
      {isVip && (
        <div className="mb-6">
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
              <h3 className="font-semibold text-foreground">3-Year Financial Model</h3>
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/30">VIP</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Download a comprehensive 3-year financial projection with growth scenarios (conservative, moderate, aggressive).
            </p>
            <Button onClick={handleDownload3YearModel} className="w-full" variant="secondary">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Download 3-Year Model (.xlsx)
            </Button>
          </div>
        </div>
      )}

      {/* First steps with checkboxes */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Your First Steps</h3>
          <span className="text-xs text-muted-foreground">
            {completedSteps} of {idea.firstSteps.length} completed
          </span>
        </div>
        <div className="space-y-3">
          {idea.firstSteps.map((step, index) => (
            <label
              key={index}
              className={cn(
                "flex items-start gap-3 rounded-xl p-3 cursor-pointer transition-colors",
                checkedSteps[index] ? "bg-success/10" : "bg-muted/50"
              )}
            >
              <Checkbox
                checked={checkedSteps[index] || false}
                onCheckedChange={() => handleStepToggle(index)}
                className="mt-0.5"
              />
              <div className="flex items-start gap-3 flex-1">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                    checkedSteps[index]
                      ? "bg-success text-success-foreground"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  {index + 1}
                </div>
                <p
                  className={cn(
                    "text-sm pt-0.5",
                    checkedSteps[index]
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  )}
                >
                  {step}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Idea Builder Toolkit */}
      <IdeaBuilderToolkit 
        ideaId={idea.id}
        ideaName={idea.name}
        ideaDescription={idea.description}
      />

      {/* Tier 2+ Features CTA */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6">
        <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          Ready to make it official?
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          Get step-by-step guidance to register your business in Canada with real government links and costs.
        </p>
        
        <div className="space-y-2">
          {isComplete ? (
            <Button
              className="w-full"
              onClick={() => {
                onClose();
                navigate(`/app/registration/${idea.id}`);
              }}
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Start Registration Guide
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                onClose();
                navigate("/pricing");
              }}
            >
              <Lock className="w-4 h-4 mr-2" />
              Unlock with Complete ($149)
            </Button>
          )}
          
          <Button
            variant={isComplete ? "secondary" : "outline"}
            className="w-full"
            onClick={handleDownloadSpreadsheet}
          >
            {isComplete ? (
              <>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Download Financial Spreadsheet
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Financial Spreadsheet (Complete tier)
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
