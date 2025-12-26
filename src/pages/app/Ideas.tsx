import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Lightbulb, Rocket, ChevronDown, Loader2, ClipboardCheck, ArrowRight, Lock, FileSpreadsheet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIdeas } from "@/hooks/useIdeas";
import { useActiveRegistrations } from "@/hooks/useActiveRegistrations";
import { useOrderTier } from "@/hooks/useOrderTier";
import { IdeaCardV2 } from "@/components/ideas/IdeaCardV2";
import { IdeaDetails } from "@/components/ideas/IdeaDetails";
import { IdeaComparisonTool } from "@/components/ideas/IdeaComparisonTool";
import { QuickWinCard } from "@/components/ideas/QuickWinCard";
import { BusinessIdeaDisplay } from "@/types/ideas-enhanced";
import { generateYear1CashFlow, downloadSpreadsheet } from "@/utils/spreadsheetExport";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const categories = ["All", "Service", "Product", "Digital", "Hybrid"] as const;
type CategoryFilter = typeof categories[number];

type SortOption = "newest" | "viability" | "alpha";

const Ideas = () => {
  const navigate = useNavigate();
  const { ideas, isLoading, error, loadAllUserIdeas, toggleFavorite } = useIdeas();
  const { registrations: activeRegistrations } = useActiveRegistrations();
  const { tier, isComplete, isLoading: tierLoading } = useOrderTier();
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("All");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedIdea, setSelectedIdea] = useState<BusinessIdeaDisplay | null>(null);
  const [openSessions, setOpenSessions] = useState<Set<string>>(new Set());

  // Handler for downloading spreadsheet (Tier 2+)
  const handleDownloadSpreadsheet = (idea: BusinessIdeaDisplay) => {
    if (!isComplete) {
      toast.error("Upgrade to Complete tier to download financial spreadsheets");
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

  // Load all ideas on mount
  useEffect(() => {
    loadAllUserIdeas();
  }, [loadAllUserIdeas]);

  // Filter and sort ideas
  const filteredIdeas = useMemo(() => {
    let result = [...ideas];

    // Filter by category
    if (selectedCategory !== "All") {
      result = result.filter((idea) => idea.category === selectedCategory);
    }

    // Sort
    switch (sortBy) {
      case "newest":
        break;
      case "viability":
        result.sort((a, b) => b.viabilityScore - a.viabilityScore);
        break;
      case "alpha":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [ideas, selectedCategory, sortBy]);

  // Group ideas by session
  const groupedIdeas = useMemo(() => {
    const groups: Record<string, BusinessIdeaDisplay[]> = {};
    filteredIdeas.forEach((idea) => {
      if (!groups[idea.sessionId]) {
        groups[idea.sessionId] = [];
      }
      groups[idea.sessionId].push(idea);
    });
    return groups;
  }, [filteredIdeas]);

  const toggleSession = (sessionId: string) => {
    setOpenSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

  const handleViewDetails = (idea: BusinessIdeaDisplay) => {
    setSelectedIdea(idea);
  };

  const handleCloseDetails = () => {
    setSelectedIdea(null);
  };

  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
    if (selectedIdea?.id === id) {
      setSelectedIdea((prev) =>
        prev ? { ...prev, isFavorite: !prev.isFavorite } : null
      );
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading your ideas...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => loadAllUserIdeas()}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (ideas.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">
            My Ideas
          </h1>
          <p className="text-muted-foreground text-sm">
            Your generated business ideas
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              No ideas yet
            </h2>
            <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
              Complete a coaching session to receive personalized business ideas.
            </p>
            <Button
              onClick={() => navigate("/chat")}
              className="touch-target bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Start Session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sessionIds = Object.keys(groupedIdeas);

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">
          My Ideas
        </h1>
        <p className="text-muted-foreground text-sm">
          {filteredIdeas.length} {filteredIdeas.length === 1 ? "idea" : "ideas"} across {sessionIds.length} {sessionIds.length === 1 ? "session" : "sessions"}
        </p>
      </div>

      {/* Continue Registration Banner */}
      {activeRegistrations.length > 0 && (
        <Card className="mb-6 border-green-600/30 bg-green-600/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardCheck className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-foreground">
                Continue Registration
              </span>
              <Badge variant="secondary" className="ml-auto">
                {activeRegistrations.length} in progress
              </Badge>
            </div>
            
            <div className="space-y-3">
              {activeRegistrations.slice(0, 3).map((reg) => {
                const progressPercent = reg.total_steps > 0 
                  ? Math.round((reg.completed_steps.length / reg.total_steps) * 100) 
                  : 0;
                
                return (
                  <div 
                    key={reg.id}
                    className="flex items-center gap-3 p-3 bg-background rounded-lg border cursor-pointer hover:border-green-600/50 transition-colors"
                    onClick={() => navigate(`/app/registration/${reg.idea_id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {reg.idea_title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={progressPercent} className="h-1.5 flex-1 [&>div]:bg-green-600" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {reg.completed_steps.length}/{reg.total_steps} steps
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {reg.province} • {formatDistanceToNow(new Date(reg.updated_at), { addSuffix: true })}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </div>
                );
              })}
            </div>
            
            {activeRegistrations.length > 3 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-3 text-green-600 hover:text-green-700 hover:bg-green-600/10"
                onClick={() => navigate("/app/dashboard")}
              >
                View all {activeRegistrations.length} registrations
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Category filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="flex-shrink-0"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Sort dropdown */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="viability">Highest viability</SelectItem>
            <SelectItem value="alpha">Alphabetical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ideas grouped by session */}
      <div className="space-y-4">
        {sessionIds.map((sessionId, sessionIndex) => {
          const sessionIdeas = groupedIdeas[sessionId];
          const isOpen = openSessions.has(sessionId) || sessionIds.length === 1;

          return (
            <Collapsible
              key={sessionId}
              open={isOpen}
              onOpenChange={() => sessionIds.length > 1 && toggleSession(sessionId)}
            >
              {/* Session header - only show if multiple sessions */}
              {sessionIds.length > 1 && (
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {sessionIndex + 1}
                        </span>
                      </div>
                      <div className="text-left">
                        <span className="font-semibold text-foreground">
                          Session {sessionIndex + 1}
                        </span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {sessionIdeas.length} {sessionIdeas.length === 1 ? "idea" : "ideas"}
                        </Badge>
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-5 h-5 text-muted-foreground transition-transform duration-200",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                </CollapsibleTrigger>
              )}

              <CollapsibleContent>
                <div className="space-y-3">
                  {sessionIdeas.map((idea) => (
                    <IdeaCardV2
                      key={idea.id}
                      idea={idea}
                      onToggleFavorite={() => handleToggleFavorite(idea.id)}
                      onViewDetails={() => handleViewDetails(idea)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {/* Enhanced Features Section */}
      {filteredIdeas.length > 1 && (
        <div className="mt-6">
          <IdeaComparisonTool 
            ideas={filteredIdeas.map(idea => ({
              id: idea.id,
              title: idea.name,
              tagline: idea.tagline,
              category: idea.category,
              viability_score: idea.viabilityScore,
              risk_level: idea.riskLevel,
              investment_min: idea.startupCostBreakdown?.total || 0,
              investment_max: idea.startupCostBreakdown?.total || 0,
              time_to_revenue: idea.timeToRevenue,
              time_to_launch: idea.timeToLaunch,
              financials: {
                startup_cost_breakdown: idea.startupCostBreakdown,
                monthly_revenue_low: 0,
                monthly_revenue_high: 0,
                break_even_months: 0,
                monthly_expenses: 0,
              },
              market_analysis: {
                why_fit: idea.whyItFits,
                competitors: idea.competitors,
                challenges: idea.challenges,
              },
              confidence_factors: idea.confidenceFactors,
            }))} 
          />
        </div>
      )}

      {/* Quick Win Card for selected idea */}
      {selectedIdea && selectedIdea.quickWin && (
        <div className="mt-4">
          <QuickWinCard 
            ideaId={selectedIdea.id}
            ideaTitle={selectedIdea.name}
            quickWin={selectedIdea.quickWin}
          />
        </div>
      )}

      {/* Details sheet */}
      <IdeaDetails
        idea={selectedIdea}
        open={!!selectedIdea}
        onClose={handleCloseDetails}
        onToggleFavorite={() => selectedIdea && handleToggleFavorite(selectedIdea.id)}
      />
    </div>
  );
};

export default Ideas;