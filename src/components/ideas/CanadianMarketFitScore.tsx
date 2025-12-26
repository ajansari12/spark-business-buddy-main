import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface ScoreFactor {
  name: string;
  score: number;
}

interface CanadianMarketFitScoreProps {
  score: number;
  factors?: ScoreFactor[];
  size?: "sm" | "md" | "lg";
  showBreakdown?: boolean;
  animated?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    container: "w-16 h-16",
    scoreText: "text-lg",
    label: "text-[10px]",
    strokeWidth: 4,
    radius: 26,
  },
  md: {
    container: "w-24 h-24",
    scoreText: "text-2xl",
    label: "text-xs",
    strokeWidth: 5,
    radius: 40,
  },
  lg: {
    container: "w-32 h-32",
    scoreText: "text-3xl",
    label: "text-sm",
    strokeWidth: 6,
    radius: 54,
  },
};

// Default factors if none provided
const defaultFactors: ScoreFactor[] = [
  { name: "Market Demand", score: 0 },
  { name: "Skill Match", score: 0 },
  { name: "Budget Fit", score: 0 },
  { name: "Local Competition", score: 0 },
  { name: "Time Realistic", score: 0 },
  { name: "Regulatory Ease", score: 0 },
];

// Get color based on score (using HSL for better theming)
const getScoreColor = (score: number): string => {
  if (score >= 8) return "hsl(var(--success))"; // Forest Green
  if (score >= 5) return "hsl(38 92% 50%)"; // Amber/Orange
  return "hsl(var(--accent))"; // Maple Red
};

const getScoreColorClass = (score: number): string => {
  if (score >= 8) return "text-success";
  if (score >= 5) return "text-amber-500";
  return "text-accent";
};

const getBarColorClass = (score: number): string => {
  if (score >= 8) return "bg-success";
  if (score >= 5) return "bg-amber-500";
  return "bg-accent";
};

export const CanadianMarketFitScore = ({
  score,
  factors,
  size = "md",
  showBreakdown = false,
  animated = true,
  className,
}: CanadianMarketFitScoreProps) => {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const config = sizeConfig[size];
  
  // Calculate circumference for the circular progress
  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference - (displayScore / 10) * circumference;

  // Animate score on mount
  useEffect(() => {
    if (!animated) {
      setDisplayScore(score);
      return;
    }

    const duration = 1000;
    const steps = 30;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score, animated]);

  // Use provided factors or generate defaults
  const displayFactors = factors || defaultFactors.map((f, i) => ({
    ...f,
    score: Math.max(1, Math.min(10, score + (Math.random() * 2 - 1))),
  }));

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* Circular Score Display */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("relative", config.container)}>
            {/* Background circle */}
            <svg
              className="w-full h-full -rotate-90"
              viewBox={`0 0 ${(config.radius + config.strokeWidth) * 2} ${(config.radius + config.strokeWidth) * 2}`}
            >
              {/* Background track */}
              <circle
                cx={config.radius + config.strokeWidth}
                cy={config.radius + config.strokeWidth}
                r={config.radius}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={config.strokeWidth}
              />
              {/* Animated progress arc */}
              <motion.circle
                cx={config.radius + config.strokeWidth}
                cy={config.radius + config.strokeWidth}
                r={config.radius}
                fill="none"
                stroke={getScoreColor(score)}
                strokeWidth={config.strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: animated ? 1 : 0, ease: "easeOut" }}
              />
            </svg>
            
            {/* Score text in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="flex items-center gap-0.5">
                <span className="text-xs">🍁</span>
                <motion.span
                  className={cn(
                    "font-display font-bold",
                    config.scoreText,
                    getScoreColorClass(score)
                  )}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {displayScore.toFixed(1)}
                </motion.span>
              </div>
              <span className="text-[8px] text-muted-foreground">/10</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs">Based on 6 Canadian market factors</span>
          </div>
        </TooltipContent>
      </Tooltip>

      {/* Label */}
      <div className="text-center">
        <p className={cn("font-medium text-foreground", config.label)}>
          Canadian Market Fit Score™
        </p>
      </div>

      {/* Breakdown bars */}
      {showBreakdown && (
        <motion.div
          className="w-full mt-3 space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {displayFactors.map((factor, index) => (
            <div key={factor.name} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{factor.name}</span>
                <span className={cn("text-xs font-medium", getScoreColorClass(factor.score))}>
                  {factor.score.toFixed(1)}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", getBarColorClass(factor.score))}
                  initial={{ width: 0 }}
                  animate={{ width: `${(factor.score / 10) * 100}%` }}
                  transition={{ 
                    delay: animated ? 0.6 + index * 0.1 : 0, 
                    duration: animated ? 0.5 : 0 
                  }}
                />
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};
