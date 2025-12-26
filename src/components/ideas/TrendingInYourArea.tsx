import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TrendingUp, Clock, DollarSign, Flame, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendingBusiness {
  business_type: string;
  trend_reason: string;
  estimated_cost_min: number;
  estimated_cost_max: number;
  growth_potential: "High" | "Medium" | "Moderate";
  time_to_launch: string;
  why_trending: string;
}

interface TrendingInYourAreaProps {
  budgetMin: number;
  budgetMax: number;
  province: string;
  city?: string;
  skillsBackground?: string;
  selectedBusiness?: string | null;
}

export const TrendingInYourArea = ({
  budgetMin,
  budgetMax,
  province,
  city,
  skillsBackground,
  selectedBusiness,
}: TrendingInYourAreaProps) => {
  const [businesses, setBusinesses] = useState<TrendingBusiness[]>([]);
  const [citations, setCitations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
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
          setError("Couldn't load trending businesses.");
          return;
        }

        if (data?.businesses) {
          setBusinesses(data.businesses);
          setCitations(data.citations || []);
        }
      } catch (err) {
        console.error("Error:", err);
        setError("Something went wrong loading trends.");
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

  const location = city || province;

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary animate-pulse" />
            <Skeleton className="h-5 w-48" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <Skeleton className="h-4 w-4 mt-1 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || businesses.length === 0) {
    return null; // Silently hide if error or no data
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-border/50">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" />
                <CardTitle className="text-base font-semibold">
                  What's Trending in {location}
                </CardTitle>
              </div>
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Popular business types in your budget range
            </p>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {/* Horizontal scroll on mobile, grid on larger screens */}
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible">
              {businesses.map((business, index) => {
                const isSelected = selectedBusiness && 
                  business.business_type.toLowerCase().includes(selectedBusiness.toLowerCase());
                
                return (
                <div
                  key={index}
                  className={cn(
                    "flex-shrink-0 w-[280px] md:w-auto snap-start",
                    "p-3 rounded-lg border transition-colors",
                    isSelected 
                      ? "bg-primary/10 border-primary/50 ring-1 ring-primary/30"
                      : "bg-muted/30 border-border/50 hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-medium leading-tight">
                      {business.business_type}
                    </h4>
                    <Badge 
                      variant={getGrowthBadgeVariant(business.growth_potential)}
                      className="flex-shrink-0 text-xs"
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {business.growth_potential}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
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
                </div>
              )})}
            </div>

            {/* Citations */}
            {citations.length > 0 && (
              <div className="pt-2 border-t border-border/50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCitations(!showCitations);
                  }}
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
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
