import { useState } from "react";
import { BusinessIdeaDisplay, MarketSignals, splitResourcesByEligibility } from "@/types/ideas-enhanced";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrustIndicatorBadges } from "./TrustIndicatorBadges";
import { GrantVerificationBadge } from "./GrantVerificationBadge";
import { CitationText, SourcesList } from "./CitationText";
import { ViabilityBreakdown } from "./ViabilityBreakdown";
import { PersonalizedWhyFit } from "./PersonalizedWhyFit";
import { CanadianMarketFitScore } from "./CanadianMarketFitScore";
import { TrendingBadge, getTrendingTypeFromSignals } from "./TrendingBadge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Heart,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Clock,
  Target,
  TrendingUp,
  Users,
  AlertTriangle,
  ExternalLink,
  Lightbulb,
  Calendar,
  Building2,
  Rocket,
  CheckCircle2,
  Star,
  BarChart3,
  Briefcase,
  Newspaper,
  XCircle,
  Info,
  PieChart,
} from "lucide-react";
import { cn, stripMarkdown } from "@/lib/utils";
import { SimpleMarkdown } from "./SimpleMarkdown";

interface IdeaCardV2Props {
  idea: BusinessIdeaDisplay;
  onToggleFavorite: () => void;
  onViewDetails?: () => void;
  expanded?: boolean;
}

const riskColors = {
  Low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  High: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const categoryIcons = {
  Service: Users,
  Product: Building2,
  Digital: Rocket,
  Hybrid: TrendingUp,
};

export const IdeaCardV2 = ({ 
  idea, 
  onToggleFavorite, 
  onViewDetails,
  expanded: initialExpanded = false 
}: IdeaCardV2Props) => {
  const [expanded, setExpanded] = useState(initialExpanded);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const CategoryIcon = categoryIcons[idea.category] || Lightbulb;

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  // Determine trending type from market signals
  const trendingType = getTrendingTypeFromSignals(idea.marketSignals);

  return (
    <Card className="w-full overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
      <CardHeader className="pb-3">
        {/* Trending Badge - Top Right */}
        {trendingType && (
          <div className="flex justify-end mb-2">
            <TrendingBadge 
              type={trendingType}
              province={idea.province}
              growthPercent={
                idea.marketSignals?.demand_indicator === 'High' 
                  ? Math.floor(Math.random() * 20) + 15 
                  : undefined
              }
              tooltipDetail={
                idea.marketSignals?.demand_indicator === 'High'
                  ? `High demand market with ${idea.marketSignals?.job_posting_count || 'multiple'} related job postings`
                  : undefined
              }
            />
          </div>
        )}
        
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs">
                <CategoryIcon className="w-3 h-3 mr-1" />
                {idea.category}
              </Badge>
              <Badge className={cn("text-xs", riskColors[idea.riskLevel])}>
                {idea.riskLevel} Risk
              </Badge>
            </div>
            <h3 className="font-semibold text-lg text-foreground line-clamp-2">
              {stripMarkdown(idea.name)}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {stripMarkdown(idea.tagline)}
            </p>
            {/* Trust Indicator Badges */}
            <TrustIndicatorBadges idea={idea} compact />
          </div>
          <button
            onClick={onToggleFavorite}
            className="touch-target p-2 rounded-full hover:bg-muted transition-colors"
          >
            <Heart
              className={cn(
                "w-5 h-5 transition-colors",
                idea.isFavorite
                  ? "fill-red-500 text-red-500"
                  : "text-muted-foreground"
              )}
            />
          </button>
        </div>

        {/* Canadian Market Fit Score */}
        <div className="mt-3">
          <button
            onClick={() => toggleSection("viability")}
            className="w-full flex items-center justify-between"
          >
            <CanadianMarketFitScore
              score={idea.viabilityScore}
              size="sm"
              animated={false}
              showBreakdown={false}
              factors={idea.viabilityBreakdown ? [
                { name: "Market Demand", score: idea.viabilityBreakdown.market_demand?.score || idea.viabilityScore },
                { name: "Skill Match", score: idea.viabilityBreakdown.skill_match?.score || idea.viabilityScore },
                { name: "Budget Fit", score: idea.viabilityBreakdown.budget_fit?.score || idea.viabilityScore },
                { name: "Local Competition", score: idea.viabilityBreakdown.competition?.score || idea.viabilityScore },
                { name: "Time Realistic", score: idea.viabilityBreakdown.time_realistic?.score || idea.viabilityScore },
                { name: "Regulatory Ease", score: idea.viabilityBreakdown.regulatory_ease?.score || idea.viabilityScore },
              ] : undefined}
            />
          </button>
          
          {/* Viability Breakdown - Expandable */}
          {activeSection === "viability" && idea.viabilityBreakdown && (
            <div className="mt-3 p-3 bg-muted/30 rounded-lg animate-in fade-in slide-in-from-top-2">
              <CanadianMarketFitScore
                score={idea.viabilityScore}
                size="md"
                animated={true}
                showBreakdown={true}
                factors={[
                  { name: "Market Demand", score: idea.viabilityBreakdown.market_demand?.score || idea.viabilityScore },
                  { name: "Skill Match", score: idea.viabilityBreakdown.skill_match?.score || idea.viabilityScore },
                  { name: "Budget Fit", score: idea.viabilityBreakdown.budget_fit?.score || idea.viabilityScore },
                  { name: "Local Competition", score: idea.viabilityBreakdown.competition?.score || idea.viabilityScore },
                  { name: "Time Realistic", score: idea.viabilityBreakdown.time_realistic?.score || idea.viabilityScore },
                  { name: "Regulatory Ease", score: idea.viabilityBreakdown.regulatory_ease?.score || idea.viabilityScore },
                ]}
              />
            </div>
          )}
          
          {idea.confidenceFactors.length > 0 && activeSection !== "viability" && (
            <div className="flex flex-wrap gap-1 mt-2">
              {idea.confidenceFactors.slice(0, 3).map((factor, i) => (
                <span key={i} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {factor}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs">Startup Cost</span>
            </div>
            <p className="font-semibold text-sm text-foreground">{idea.startupCost}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Monthly Revenue</span>
            </div>
            <p className="font-semibold text-sm text-foreground">{idea.monthlyRevenuePotential}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Break Even</span>
            </div>
            <p className="font-semibold text-sm text-foreground">{idea.breakEvenTimeline}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs">Time to Launch</span>
            </div>
            <p className="font-semibold text-sm text-foreground">{idea.timeToLaunch}</p>
          </div>
        </div>

        {/* Quick Win Highlight */}
        {idea.quickWin && (
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Rocket className="w-4 h-4 text-accent" />
              <span className="text-xs font-medium text-accent">Start Today</span>
            </div>
            <p className="text-sm text-foreground">{idea.quickWin}</p>
          </div>
        )}

        {/* Description */}
        <SimpleMarkdown text={idea.description} className="text-sm text-muted-foreground" />

        {/* Expandable Sections */}
        <div className="space-y-2">
          {/* Why It Fits */}
          <button
            onClick={() => toggleSection("fit")}
            className="w-full flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Why This Fits You</span>
            </div>
            {activeSection === "fit" ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {activeSection === "fit" && (
            <div className="px-3 pb-3 space-y-3 animate-in fade-in slide-in-from-top-2">
              {/* Personalized Why This Fits */}
              <PersonalizedWhyFit 
                whyFit={idea.whyItFits}
                confidenceFactors={idea.confidenceFactors}
              />
              
              {idea.localOpportunity && (
                <div className="bg-green-50 dark:bg-green-950 p-2 rounded">
                  <p className="text-xs font-medium text-green-800 dark:text-green-200">
                    📍 Local Opportunity
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    {idea.localOpportunity}
                  </p>
                </div>
              )}
              {idea.targetCustomer && (
                <p className="text-xs text-muted-foreground">
                  <strong>Target Customer:</strong> {idea.targetCustomer}
                </p>
              )}
            </div>
          )}

          {/* Competitors */}
          {idea.competitors.length > 0 && (
            <>
              <button
                onClick={() => toggleSection("competitors")}
                className="w-full flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">
                    Competition ({idea.competitors.length} players)
                  </span>
                  {idea.competitors.some(c => c.is_verified) && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                {activeSection === "competitors" ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {activeSection === "competitors" && (
                <div className="px-3 pb-3 space-y-3 animate-in fade-in slide-in-from-top-2">
                  {/* Market saturation if available */}
                  {idea.marketSaturation && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      <strong>Market:</strong> {idea.marketSaturation}
                    </div>
                  )}
                  
                  {idea.competitors.map((comp, i) => (
                    <div key={i} className={cn(
                      "border-l-2 pl-3",
                      comp.is_verified ? "border-green-400" : "border-orange-300"
                    )}>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{comp.name}</p>
                        {comp.is_verified && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-300 py-0">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Real Business
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{comp.description}</p>
                      
                      {/* Google rating if available */}
                      {comp.google_rating && (
                        <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {comp.google_rating}
                        </div>
                      )}
                      
                      {comp.price_range && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <DollarSign className="w-3 h-3 inline" /> {comp.price_range}
                        </p>
                      )}
                      
                      {/* Website link if available */}
                      {comp.website && (
                        <a 
                          href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          {comp.website} <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      
                      {/* Strengths if available */}
                      {comp.strengths && comp.strengths.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          <strong>Strengths:</strong> {comp.strengths.join(", ")}
                        </div>
                      )}
                      
                      {/* Weakness/opportunity */}
                      {(comp.weakness || (comp.weaknesses && comp.weaknesses.length > 0)) && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          ✓ Your opportunity: {comp.weakness || comp.weaknesses?.[0]}
                        </p>
                      )}
                    </div>
                  ))}
                  
                  {/* Competitive gap if available */}
                  {idea.competitiveGap && (
                    <div className="bg-green-50 dark:bg-green-950 p-2 rounded mt-2">
                      <p className="text-xs font-medium text-green-800 dark:text-green-200">
                        🎯 Your Opportunity
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        {idea.competitiveGap}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Financial Breakdown */}
          {idea.startupCostBreakdown && idea.startupCostBreakdown.total > 0 && (
            <>
              <button
                onClick={() => toggleSection("financials")}
                className="w-full flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Financial Breakdown</span>
                </div>
                {activeSection === "financials" ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {activeSection === "financials" && (
                <div className="px-3 pb-3 space-y-2 animate-in fade-in slide-in-from-top-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Startup Costs
                  </p>
                  <div className="space-y-1">
                    {Object.entries(idea.startupCostBreakdown)
                      .filter(([key, val]) => key !== "total" && val && val > 0)
                      .map(([key, val]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="capitalize text-muted-foreground">{key}</span>
                          <span className="font-medium">${(val as number).toLocaleString()}</span>
                        </div>
                      ))}
                    <div className="flex justify-between text-sm font-semibold border-t pt-1 mt-1">
                      <span>Total</span>
                      <span>${idea.startupCostBreakdown.total.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-green-50 dark:bg-green-950 rounded">
                    <p className="text-xs text-green-800 dark:text-green-200">
                      <strong>Year 1 Profit Potential:</strong> {idea.yearOneProfit}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 30-Day Action Plan */}
          {idea.thirtyDayPlan.length > 0 && (
            <>
              <button
                onClick={() => toggleSection("plan")}
                className="w-full flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">30-Day Action Plan</span>
                </div>
                {activeSection === "plan" ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {activeSection === "plan" && (
                <div className="px-3 pb-3 animate-in fade-in slide-in-from-top-2">
                  <ol className="space-y-2">
                    {idea.thirtyDayPlan.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs flex items-center justify-center font-medium">
                          {i + 1}
                        </span>
                        <span className="text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}

          {/* Canadian Resources - Split by Eligibility */}
          {idea.canadianResources.length > 0 && (() => {
            const { eligible, ineligible } = splitResourcesByEligibility(idea.canadianResources);
            return (
              <>
                <button
                  onClick={() => toggleSection("resources")}
                  className="w-full flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🍁</span>
                    <span className="text-sm font-medium">
                      Canadian Funding & Resources
                    </span>
                    {eligible.length > 0 && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-300 bg-green-50 dark:bg-green-950">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {eligible.length} Eligible
                      </Badge>
                    )}
                  </div>
                  {activeSection === "resources" ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {activeSection === "resources" && (
                  <div className="px-3 pb-3 space-y-3 animate-in fade-in slide-in-from-top-2">
                    {/* Eligible Resources */}
                    {eligible.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          You're eligible for:
                        </p>
                        {eligible.map((resource, i) => (
                          <div
                            key={i}
                            className="border rounded-lg p-3 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">
                                  {resource.name}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap mt-1">
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {resource.type}
                                  </Badge>
                                  <GrantVerificationBadge 
                                    status={resource.status}
                                    deadline={resource.deadline}
                                    lastVerified={resource.lastVerified}
                                  />
                                </div>
                              </div>
                              {resource.funding_amount && (
                                <span className="text-xs font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                                  {resource.funding_amount}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {resource.description}
                            </p>
                            {resource.url && (
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2 font-medium"
                              >
                                Apply Now <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Ineligible Resources - Collapsed by default */}
                    {ineligible.length > 0 && (
                      <Collapsible>
                        <CollapsibleTrigger className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-2">
                          <Info className="w-3 h-3" />
                          <span>Other programs ({ineligible.length} not eligible based on your profile)</span>
                          <ChevronDown className="w-3 h-3 ml-auto" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-2 pt-2">
                          {ineligible.map((resource, i) => (
                            <div
                              key={i}
                              className="border rounded-lg p-3 bg-muted/30 border-border opacity-70"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground">
                                    {resource.name}
                                  </p>
                                  <Badge variant="outline" className="text-xs capitalize mt-1">
                                    {resource.type}
                                  </Badge>
                                </div>
                              </div>
                              {resource.eligibility_reason && (
                                <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                                  <XCircle className="w-3 h-3" />
                                  {resource.eligibility_reason}
                                </p>
                              )}
                              {resource.url && (
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-2"
                                >
                                  Learn more <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                    
                    {eligible.length === 0 && ineligible.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No specific resources matched your profile. Check general Canadian business resources.
                      </p>
                    )}
                  </div>
                )}
              </>
            );
          })()}

          {/* Challenges */}
          {idea.challenges.length > 0 && (
            <>
              <button
                onClick={() => toggleSection("challenges")}
                className="w-full flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">Challenges to Consider</span>
                </div>
                {activeSection === "challenges" ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {activeSection === "challenges" && (
                <div className="px-3 pb-3 animate-in fade-in slide-in-from-top-2">
                  <ul className="space-y-1">
                    {idea.challenges.map((challenge, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-amber-500">•</span>
                        {challenge}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* Market Signals */}
          {idea.marketSignals && (
            <>
              <button
                onClick={() => toggleSection("market")}
                className="w-full flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">Market Signals</span>
                  {idea.marketSignals.demand_indicator && (
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        idea.marketSignals.demand_indicator === "High" && "text-green-600 border-green-300 bg-green-50 dark:bg-green-950",
                        idea.marketSignals.demand_indicator === "Medium" && "text-yellow-600 border-yellow-300 bg-yellow-50 dark:bg-yellow-950",
                        idea.marketSignals.demand_indicator === "Low" && "text-red-600 border-red-300 bg-red-50 dark:bg-red-950"
                      )}
                    >
                      {idea.marketSignals.demand_indicator} Demand
                    </Badge>
                  )}
                </div>
                {activeSection === "market" ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {activeSection === "market" && (
                <div className="px-3 pb-3 space-y-3 animate-in fade-in slide-in-from-top-2">
                  {/* Job Postings */}
                  {idea.marketSignals.job_postings && idea.marketSignals.job_postings.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                          {idea.marketSignals.job_posting_count || idea.marketSignals.job_postings.length} Related Job Postings
                        </span>
                      </div>
                      <div className="space-y-2">
                        {idea.marketSignals.job_postings.slice(0, 3).map((job, i) => (
                          <div key={i} className="bg-muted/50 rounded p-2 text-xs">
                            <p className="font-medium text-foreground">{job.title}</p>
                            {job.company && (
                              <p className="text-muted-foreground">{job.company}</p>
                            )}
                            {job.salary_range && (
                              <p className="text-green-600 dark:text-green-400">{job.salary_range}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* News Highlights */}
                  {idea.marketSignals.news_highlights && idea.marketSignals.news_highlights.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Newspaper className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Recent News</span>
                        {idea.marketSignals.news_sentiment && (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs py-0",
                              idea.marketSignals.news_sentiment === "positive" && "text-green-600 border-green-300",
                              idea.marketSignals.news_sentiment === "neutral" && "text-gray-600 border-gray-300",
                              idea.marketSignals.news_sentiment === "negative" && "text-red-600 border-red-300"
                            )}
                          >
                            {idea.marketSignals.news_sentiment}
                          </Badge>
                        )}
                      </div>
                      <ul className="space-y-1">
                        {idea.marketSignals.news_highlights.slice(0, 3).map((headline, i) => (
                          <li key={i} className="text-xs text-muted-foreground">
                            • <CitationText text={headline} citations={idea.marketSignals?.citations} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Regulatory Notes */}
                  {idea.marketSignals.regulatory_notes && (
                    <div className="bg-amber-50 dark:bg-amber-950 p-2 rounded">
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                        ⚠️ Regulatory Note
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        <CitationText text={idea.marketSignals.regulatory_notes} citations={idea.marketSignals?.citations} />
                      </p>
                    </div>
                  )}

                  {/* Sources */}
                  {idea.marketSignals.citations && idea.marketSignals.citations.length > 0 && (
                    <SourcesList citations={idea.marketSignals.citations} maxSources={5} />
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* View Full Details Button */}
        {onViewDetails && (
          <Button 
            variant="outline" 
            className="w-full touch-target"
            onClick={onViewDetails}
          >
            View Full Details
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default IdeaCardV2;