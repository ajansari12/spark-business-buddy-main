import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Radio, Clock, DollarSign, Gift, FileText } from "lucide-react";
import { BusinessIdeaDisplay } from "@/types/ideas-enhanced";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TrustIndicatorBadgesProps {
  idea: BusinessIdeaDisplay;
  compact?: boolean;
}

export const TrustIndicatorBadges = ({ idea, compact = false }: TrustIndicatorBadgesProps) => {
  const verifiedCount = idea.competitors?.filter(c => c.is_verified)?.length || 0;
  const hasMarketSignals = !!idea.marketSignals;

  // Separate funding types
  const grantsCount = idea.canadianResources?.filter(r => r.type === "grant")?.length || 0;
  const loansCount = idea.canadianResources?.filter(r => r.type === "loan")?.length || 0;
  const programsCount = idea.canadianResources?.filter(r => r.type === "program")?.length || 0;

  // Check if market data is fresh (within 7 days)
  const isDataFresh = idea.marketSignals?.last_updated 
    ? (Date.now() - new Date(idea.marketSignals.last_updated).getTime()) < 7 * 24 * 60 * 60 * 1000
    : false;

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {verifiedCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs py-0 bg-success/5 text-success border-success/20 cursor-help">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {verifiedCount} Verified
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Real competitors found via web search with verified ratings.</p>
              </TooltipContent>
            </Tooltip>
          )}
          {hasMarketSignals && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs py-0 cursor-help",
                    isDataFresh 
                      ? "bg-success/5 text-success border-success/20" 
                      : "bg-warning/5 text-warning border-warning/20"
                  )}
                >
                  {isDataFresh ? (
                    <>
                      <Radio className="w-3 h-3 mr-1 animate-pulse" />
                      Live
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 mr-1" />
                      Stale
                    </>
                  )}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {isDataFresh 
                    ? "Market data was refreshed within the last 7 days." 
                    : "Market data is over 7 days old. Click 'Refresh Market Data' to update."}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
          {grantsCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs py-0 bg-success/5 text-success border-success/20 cursor-help">
                  <Gift className="w-3 h-3 mr-1" />
                  {grantsCount} Grants
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Government grants you may be eligible for (free funding).</p>
              </TooltipContent>
            </Tooltip>
          )}
          {loansCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs py-0 bg-primary/5 text-primary border-primary/20 cursor-help">
                  <DollarSign className="w-3 h-3 mr-1" />
                  {loansCount} Loans
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Business loans available from Canadian lenders (must be repaid).</p>
              </TooltipContent>
            </Tooltip>
          )}
          {programsCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs py-0 bg-accent/5 text-accent border-accent/20 cursor-help">
                  <FileText className="w-3 h-3 mr-1" />
                  {programsCount} Programs
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Support programs offering mentorship, training, or resources.</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2">
        {verifiedCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="bg-success/10 text-success cursor-help">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {verifiedCount} Verified Competitors
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Real competitors found via web search with verified ratings.</p>
            </TooltipContent>
          </Tooltip>
        )}
        {hasMarketSignals && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="secondary" 
                className={cn(
                  "cursor-help",
                  isDataFresh 
                    ? "bg-success/10 text-success" 
                    : "bg-warning/10 text-warning"
                )}
              >
                {isDataFresh ? (
                  <>
                    <Radio className="w-3 h-3 mr-1 animate-pulse" />
                    Live Market Data
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 mr-1" />
                    Market Data (Stale)
                  </>
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isDataFresh 
                  ? "Market data was refreshed within the last 7 days." 
                  : "Market data is over 7 days old. Click 'Refresh Market Data' to update."}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
        {grantsCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="bg-success/10 text-success cursor-help">
                <Gift className="w-3 h-3 mr-1" />
                {grantsCount} Grants
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Government grants you may be eligible for (free funding).</p>
            </TooltipContent>
          </Tooltip>
        )}
        {loansCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="bg-primary/10 text-primary cursor-help">
                <DollarSign className="w-3 h-3 mr-1" />
                {loansCount} Loans
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Business loans available from Canadian lenders (must be repaid).</p>
            </TooltipContent>
          </Tooltip>
        )}
        {programsCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="bg-accent/10 text-accent cursor-help">
                <FileText className="w-3 h-3 mr-1" />
                {programsCount} Programs
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Support programs offering mentorship, training, or resources.</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};
