import { BusinessIdea } from "@/types/ideas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, DollarSign, Clock, MapPin, ChevronRight } from "lucide-react";
import { cn, stripMarkdown } from "@/lib/utils";
import { ViabilityScore } from "./ViabilityScore";

interface IdeaCardProps {
  idea: BusinessIdea;
  onToggleFavorite: () => void;
  onViewDetails: () => void;
  compact?: boolean;
}

const categoryColors: Record<string, string> = {
  Service: "bg-primary/10 text-primary border-primary/20",
  Product: "bg-accent/10 text-accent border-accent/20",
  Digital: "bg-success/10 text-success border-success/20",
  Hybrid: "bg-secondary/10 text-secondary border-secondary/20",
};

export const IdeaCard = ({ idea, onToggleFavorite, onViewDetails, compact = false }: IdeaCardProps) => {
  if (compact) {
    return (
      <div 
        onClick={onViewDetails}
        className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex items-start gap-3">
          <ViabilityScore score={idea.viabilityScore} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">{stripMarkdown(idea.name)}</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className="flex-shrink-0"
              >
                <Heart
                  className={cn(
                    "w-4 h-4 transition-colors",
                    idea.isFavorite
                      ? "fill-accent text-accent"
                      : "text-muted-foreground hover:text-accent"
                  )}
                />
              </button>
            </div>
            <Badge variant="outline" className={cn("text-xs", categoryColors[idea.category])}>
              {idea.category}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{idea.description}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-6 shadow-lg h-full flex flex-col">
      {/* Header with category badge and viability score */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={cn("text-xs", categoryColors[idea.category])}>
              {idea.category}
            </Badge>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className="touch-target flex items-center justify-center ml-auto"
            >
              <Heart
                className={cn(
                  "w-6 h-6 transition-colors",
                  idea.isFavorite
                    ? "fill-accent text-accent"
                    : "text-muted-foreground hover:text-accent"
                )}
              />
            </button>
          </div>
          <h2 className="font-display text-xl font-bold text-foreground mb-1">
            {stripMarkdown(idea.name)}
          </h2>
          <p className="text-sm text-accent font-medium">{stripMarkdown(idea.tagline)}</p>
        </div>
        <ViabilityScore score={idea.viabilityScore} size="md" className="flex-shrink-0 ml-3" />
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
        {idea.description}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-muted/50 rounded-xl p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs">Startup Cost</span>
          </div>
          <p className="font-semibold text-sm text-foreground">{idea.startupCost}</p>
        </div>
        <div className="bg-muted/50 rounded-xl p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Time to Revenue</span>
          </div>
          <p className="font-semibold text-sm text-foreground">{idea.timeToLaunch}</p>
        </div>
      </div>

      {/* Why it fits */}
      <div className="bg-success/10 rounded-xl p-3 mb-4">
        <p className="text-xs font-medium text-success mb-1">Why this fits you:</p>
        <p className="text-sm text-foreground line-clamp-2">{idea.whyItFits}</p>
      </div>

      {/* Local advantage */}
      <div className="flex items-start gap-2 mb-4">
        <MapPin className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground line-clamp-2">
          {idea.localAdvantage}
        </p>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* CTA */}
      <Button
        onClick={onViewDetails}
        className="w-full touch-target"
        variant="outline"
      >
        View Full Details
        <ChevronRight className="ml-2 w-4 h-4" />
      </Button>
    </div>
  );
};
