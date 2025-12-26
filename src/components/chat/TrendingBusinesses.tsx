import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Clock, DollarSign, Sparkles, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TrendingBusiness {
  business_type: string;
  trend_reason: string;
  estimated_cost_min: number;
  estimated_cost_max: number;
  growth_potential: "High" | "Medium" | "Moderate";
  time_to_launch: string;
  why_trending: string;
}

interface TrendingBusinessesProps {
  budgetMin: number;
  budgetMax: number;
  province: string;
  city?: string;
  skillsBackground?: string;
  onSelect: (business: TrendingBusiness) => void;
  onSkip: () => void;
}

export const TrendingBusinesses = ({
  budgetMin,
  budgetMax,
  province,
  city,
  skillsBackground,
  onSelect,
  onSkip,
}: TrendingBusinessesProps) => {
  const [businesses, setBusinesses] = useState<TrendingBusiness[]>([]);
  const [citations, setCitations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCitations, setShowCitations] = useState(false);

  useEffect(() => {
    const fetchTrending = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          "ft_trending_businesses",
          {
            body: {
              budget_min: budgetMin,
              budget_max: budgetMax,
              province,
              city,
              skills_background: skillsBackground,
            },
          }
        );

        if (fnError) {
          console.error("Error fetching trending businesses:", fnError);
          setError("Couldn't load trending businesses. You can skip and continue.");
          return;
        }

        if (data?.businesses) {
          setBusinesses(data.businesses);
          setCitations(data.citations || []);
        }
      } catch (err) {
        console.error("Error:", err);
        setError("Something went wrong. You can skip and continue.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrending();
  }, [budgetMin, budgetMax, province, city, skillsBackground]);

  const getGrowthBadgeVariant = (growth: string) => {
    switch (growth) {
      case "High":
        return "default";
      case "Medium":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <span className="text-sm font-medium">Finding trending businesses in your area...</span>
        </div>
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button variant="ghost" className="w-full" disabled>
          Skip & Enter My Own Idea
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 space-y-4">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={onSkip} variant="outline" className="w-full">
          Continue Without Suggestions
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 bg-background border-t border-border">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        <span className="text-sm font-semibold">
          Trending in {city || province}
        </span>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Based on your ${budgetMin.toLocaleString()}-${budgetMax.toLocaleString()} CAD budget, these businesses are growing fast:
      </p>

      <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-1">
        {businesses.map((business, index) => (
          <Card 
            key={index} 
            className={cn(
              "overflow-hidden cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm",
              "active:scale-[0.99]"
            )}
            onClick={() => onSelect(business)}
          >
            <CardHeader className="p-3 pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm font-medium leading-tight">
                  {business.business_type}
                </CardTitle>
                <Badge 
                  variant={getGrowthBadgeVariant(business.growth_potential)}
                  className="flex-shrink-0 text-xs"
                >
                  {business.growth_potential}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              <p className="text-xs text-muted-foreground line-clamp-2">
                {business.trend_reason}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  ${business.estimated_cost_min.toLocaleString()}-${business.estimated_cost_max.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {business.time_to_launch}
                </span>
              </div>
              <Button 
                size="sm" 
                variant="secondary" 
                className="w-full mt-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(business);
                }}
              >
                Choose This Business
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {citations.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => setShowCitations(!showCitations)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Sources ({citations.length})</span>
            {showCitations ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
          {showCitations && (
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {citations.slice(0, 5).map((url, i) => (
                <li key={i} className="truncate">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary hover:underline"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Button 
        onClick={onSkip} 
        variant="ghost" 
        className="w-full text-sm"
      >
        Skip & Enter My Own Idea
      </Button>
    </div>
  );
};
