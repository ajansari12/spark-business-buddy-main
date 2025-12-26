import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { FTExtractedData } from "@/types/chat";

interface SelectedBusinessCardProps {
  extractedData: FTExtractedData;
}

export const SelectedBusinessCard = ({ extractedData }: SelectedBusinessCardProps) => {
  const trendingBusiness = extractedData.selected_trending_business;

  // Full trending business object
  if (trendingBusiness) {
    return (
      <div className="px-4 mb-4">
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">Your Selected Business</CardTitle>
              </div>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  trendingBusiness.growth_potential === "High"
                    ? "bg-primary/20 text-primary"
                    : trendingBusiness.growth_potential === "Medium"
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {trendingBusiness.growth_potential} Growth
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div>
              <h3 className="font-semibold text-lg text-foreground">
                {trendingBusiness.business_type}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {trendingBusiness.trend_reason}
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <span className="text-base">💰</span>$
                {trendingBusiness.estimated_cost_min.toLocaleString()} - $
                {trendingBusiness.estimated_cost_max.toLocaleString()} CAD
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <span className="text-base">⏱️</span>
                {trendingBusiness.time_to_launch}
              </span>
            </div>
            {trendingBusiness.why_trending && (
              <p className="text-xs text-muted-foreground border-t border-border/50 pt-2">
                <span className="font-medium">Why it's trending:</span>{" "}
                {trendingBusiness.why_trending}
              </p>
            )}
            <p className="text-xs text-primary/80 italic">
              Your personalized ideas are tailored to align with this business type.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Legacy fallback: Show business_idea if no full object
  if (extractedData.business_idea) {
    return (
      <div className="px-4 mb-4">
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Your Selected Business</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="font-medium text-foreground">{extractedData.business_idea}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Based on your interest, we've tailored your ideas to align with this
              business type.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};
