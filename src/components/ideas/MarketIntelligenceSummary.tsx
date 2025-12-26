import { BusinessIdeaDisplay } from "@/types/ideas-enhanced";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, CheckCircle2, TrendingUp, Leaf, Radio } from "lucide-react";
import { format } from "date-fns";

interface MarketIntelligenceSummaryProps {
  ideas: BusinessIdeaDisplay[];
}

export const MarketIntelligenceSummary = ({ ideas }: MarketIntelligenceSummaryProps) => {
  // Aggregate stats
  const totalIdeas = ideas.length;
  
  const totalCompetitors = ideas.reduce((acc, idea) => {
    return acc + (idea.competitors?.length || 0);
  }, 0);
  
  const highDemandCount = ideas.filter(
    idea => idea.marketSignals?.demand_indicator?.toLowerCase() === "high"
  ).length;
  
  const totalGrants = ideas.reduce((acc, idea) => {
    return acc + (idea.canadianResources?.filter(r => r.type === "grant" || r.type === "loan" || r.type === "program")?.length || 0);
  }, 0);

  // Find most recent market signal update
  const latestUpdate = ideas.reduce((latest, idea) => {
    if (idea.marketSignals?.last_updated) {
      const date = new Date(idea.marketSignals.last_updated);
      return date > latest ? date : latest;
    }
    return latest;
  }, new Date(0));

  const hasMarketData = latestUpdate.getTime() > 0;
  const isDataFresh = hasMarketData && (Date.now() - latestUpdate.getTime()) < 7 * 24 * 60 * 60 * 1000; // 7 days

  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardContent className="pt-4 pb-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Market Intelligence Summary</h3>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <div className="bg-background/60 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{totalIdeas}</div>
            <div className="text-xs text-muted-foreground">Ideas Generated</div>
          </div>
          <div className="bg-background/60 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-2xl font-bold text-foreground">{totalCompetitors}</span>
            </div>
            <div className="text-xs text-muted-foreground">Competitors Identified</div>
          </div>
          <div className="bg-background/60 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-2xl font-bold text-foreground">{highDemandCount}</span>
            </div>
            <div className="text-xs text-muted-foreground">High Demand</div>
          </div>
          <div className="bg-background/60 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Leaf className="w-4 h-4 text-accent" />
              <span className="text-2xl font-bold text-foreground">{totalGrants}</span>
            </div>
            <div className="text-xs text-muted-foreground">Funding Sources</div>
          </div>
        </div>

        {/* Live Data Indicator */}
        <div className="flex items-center gap-2">
          {isDataFresh ? (
            <Badge variant="outline" className="bg-success/10 text-success border-success/30">
              <Radio className="w-3 h-3 mr-1 animate-pulse" />
              LIVE DATA
            </Badge>
          ) : hasMarketData ? (
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
              Data may be stale
            </Badge>
          ) : null}
          {hasMarketData && (
            <span className="text-xs text-muted-foreground">
              Last updated: {format(latestUpdate, "MMM d, yyyy")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
