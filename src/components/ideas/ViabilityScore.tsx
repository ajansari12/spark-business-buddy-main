import { cn } from "@/lib/utils";

interface ViabilityScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ViabilityScore = ({ score, size = "md", className }: ViabilityScoreProps) => {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-20 h-20",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  };

  const radius = size === "sm" ? 16 : size === "md" ? 24 : 34;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const strokeWidth = size === "sm" ? 3 : 4;

  // Color based on score
  const getColorClass = () => {
    if (score >= 8) return "text-success";
    if (score >= 6) return "text-primary";
    if (score >= 4) return "text-accent";
    return "text-muted-foreground";
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <svg className="w-full h-full -rotate-90">
        {/* Background circle */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted"
        />
        {/* Progress circle */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className={getColorClass()}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center font-bold",
          textSizeClasses[size],
          getColorClass()
        )}
      >
        {score.toFixed(1)}
      </span>
    </div>
  );
};
