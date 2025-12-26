import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type TrendingType = 'trending' | 'growing' | 'popular' | 'new';

interface TrendingBadgeProps {
  type: TrendingType;
  province?: string;
  growthPercent?: number;
  size?: 'sm' | 'md';
  tooltipDetail?: string;
}

const pulseAnimation = {
  scale: [1, 1.03, 1],
  opacity: [1, 0.85, 1],
};

const badgeConfig: Record<TrendingType, {
  icon: string;
  label: string;
  className: string;
  tooltip: string;
}> = {
  trending: {
    icon: '🔥',
    label: 'Trending',
    className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    tooltip: 'High demand in your area based on recent market activity',
  },
  growing: {
    icon: '📈',
    label: 'Growing',
    className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    tooltip: 'This market is expanding with increasing opportunities',
  },
  popular: {
    icon: '⭐',
    label: 'Popular',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    tooltip: 'Many businesses successfully operating in this space',
  },
  new: {
    icon: '🆕',
    label: 'New Opportunity',
    className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    tooltip: 'Emerging market with first-mover advantage potential',
  },
};

export function TrendingBadge({
  type,
  province,
  growthPercent,
  size = 'sm',
  tooltipDetail,
}: TrendingBadgeProps) {
  const config = badgeConfig[type];
  
  const label = province 
    ? `${config.icon} ${config.label} in ${province}`
    : `${config.icon} ${config.label}`;
  
  const growthLabel = growthPercent && growthPercent > 0 
    ? ` +${growthPercent}%`
    : '';

  const badgeContent = (
    <Badge 
      variant="outline"
      className={cn(
        "font-medium cursor-default",
        config.className,
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
      )}
    >
      {label}
      {growthLabel && (
        <span className="ml-1 font-semibold text-green-600 dark:text-green-400">
          {growthLabel}
        </span>
      )}
    </Badge>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {type === 'trending' ? (
            <motion.span
              animate={pulseAnimation}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="inline-flex"
            >
              {badgeContent}
            </motion.span>
          ) : (
            badgeContent
          )}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{tooltipDetail || config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Helper to determine trending type from market signals
export function getTrendingTypeFromSignals(
  marketSignals?: {
    demand_indicator?: 'High' | 'Medium' | 'Low';
    news_sentiment?: 'positive' | 'neutral' | 'negative';
    recent_openings?: string[];
  }
): TrendingType | null {
  if (!marketSignals) return null;
  
  const { demand_indicator, news_sentiment, recent_openings } = marketSignals;
  
  // High demand = Trending
  if (demand_indicator === 'High') {
    return 'trending';
  }
  
  // Positive news sentiment = Growing
  if (news_sentiment === 'positive') {
    return 'growing';
  }
  
  // Medium demand with recent openings = Popular
  if (demand_indicator === 'Medium' && recent_openings && recent_openings.length > 0) {
    return 'popular';
  }
  
  // Recent openings alone = New Opportunity
  if (recent_openings && recent_openings.length > 0) {
    return 'new';
  }
  
  return null;
}
