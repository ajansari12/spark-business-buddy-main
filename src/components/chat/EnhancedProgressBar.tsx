import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, MapPin, Briefcase, Clock, Target, Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProgressSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  fields: string[];
  startPercent: number;
  endPercent: number;
  description: string;
}

const PROGRESS_SECTIONS: ProgressSection[] = [
  {
    id: "location",
    label: "Location",
    icon: <MapPin className="w-3 h-3" />,
    fields: ["province", "city"],
    startPercent: 0,
    endPercent: 20,
    description: "Your province and city",
  },
  {
    id: "background",
    label: "Background",
    icon: <Briefcase className="w-3 h-3" />,
    fields: ["skills_background", "interests"],
    startPercent: 20,
    endPercent: 45,
    description: "Skills and interests",
  },
  {
    id: "commitment",
    label: "Resources",
    icon: <Clock className="w-3 h-3" />,
    fields: ["time_commitment_hours", "budget_min", "budget_max"],
    startPercent: 45,
    endPercent: 75,
    description: "Time and budget available",
  },
  {
    id: "goals",
    label: "Goals",
    icon: <Target className="w-3 h-3" />,
    fields: ["income_goal"],
    startPercent: 75,
    endPercent: 90,
    description: "Your income target",
  },
  {
    id: "confirm",
    label: "Confirm",
    icon: <Sparkles className="w-3 h-3" />,
    fields: ["user_confirmed"],
    startPercent: 90,
    endPercent: 100,
    description: "Ready to generate ideas",
  },
];

interface EnhancedProgressBarProps {
  progress: number;
  collectedData?: Record<string, unknown>;
  showSections?: boolean;
  className?: string;
}

export const EnhancedProgressBar = ({
  progress,
  collectedData = {},
  showSections = true,
  className,
}: EnhancedProgressBarProps) => {
  // Calculate section completions based on actual data
  const sectionStatuses = useMemo(() => {
    return PROGRESS_SECTIONS.map((section) => {
      const filledFields = section.fields.filter((field) => {
        const value = collectedData[field];
        return value !== null && value !== undefined && value !== "";
      });

      const isComplete = filledFields.length === section.fields.length;
      const isPartial = filledFields.length > 0 && !isComplete;
      const isCurrent = !isComplete && progress >= section.startPercent && progress < section.endPercent;

      // Get collected values for tooltip
      const collectedValues = section.fields
        .filter((field) => {
          const value = collectedData[field];
          return value !== null && value !== undefined && value !== "";
        })
        .map((field) => {
          const value = collectedData[field];
          if (typeof value === "number") {
            return field.includes("budget") ? `$${value.toLocaleString()}` : `${value}`;
          }
          return String(value);
        });

      return {
        ...section,
        isComplete,
        isPartial,
        isCurrent,
        filledCount: filledFields.length,
        totalCount: section.fields.length,
        collectedValues,
      };
    });
  }, [progress, collectedData]);

  // Get current section for label
  const currentSection = sectionStatuses.find((s) => s.isCurrent) || sectionStatuses[0];

  if (!showSections) {
    // Simple progress bar
    return (
      <div className={cn("w-full", className)}>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-2", className)}>
      {/* Section indicators with tooltips */}
      <TooltipProvider delayDuration={200}>
        <div className="flex items-center justify-between px-1" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          {sectionStatuses.map((section) => (
            <Tooltip key={section.id}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex flex-col items-center gap-1 transition-all duration-300 cursor-pointer",
                    section.isComplete
                      ? "text-primary"
                      : section.isCurrent
                      ? "text-primary"
                      : section.isPartial
                      ? "text-primary/50"
                      : "text-muted-foreground/50"
                  )}
                  aria-label={`${section.label}: ${section.isComplete ? "Complete" : section.isCurrent ? "In progress" : "Not started"}`}
                >
                  {/* Icon with completion state and animation */}
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                      section.isComplete
                        ? "bg-primary text-primary-foreground animate-scale-in"
                        : section.isCurrent
                        ? "bg-primary/20 text-primary ring-2 ring-primary ring-offset-1 ring-offset-background"
                        : section.isPartial
                        ? "bg-primary/10 text-primary/70"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {section.isComplete ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      section.icon
                    )}
                  </div>

                  {/* Label - hidden on mobile except current */}
                  <span
                    className={cn(
                      "text-[10px] font-medium transition-opacity duration-300",
                      section.isCurrent ? "opacity-100" : "opacity-0 sm:opacity-100"
                    )}
                  >
                    {section.label}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px]">
                <div className="space-y-1">
                  <p className="font-medium text-sm">{section.label}</p>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                  {section.collectedValues.length > 0 && (
                    <div className="pt-1 border-t border-border mt-1">
                      <p className="text-xs text-primary">
                        Collected: {section.collectedValues.join(", ")}
                      </p>
                    </div>
                  )}
                  {!section.isComplete && section.filledCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {section.filledCount}/{section.totalCount} fields complete
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      {/* Progress bar with section markers */}
      <div className="relative h-2 bg-muted rounded-full overflow-visible">
        {/* Section dividers */}
        {PROGRESS_SECTIONS.slice(1).map((section) => (
          <div
            key={`divider-${section.id}`}
            className="absolute top-0 bottom-0 w-px bg-background z-10"
            style={{ left: `${section.startPercent}%` }}
          />
        ))}

        {/* Filled progress with animation */}
        <div
          className="h-full bg-primary transition-all duration-500 ease-out rounded-full relative z-0"
          style={{ width: `${Math.min(100, progress)}%` }}
        >
          {/* Animated pulse on current progress edge */}
          {progress > 0 && progress < 100 && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* Current step label - mobile only */}
      <div className="sm:hidden text-center">
        <span className="text-xs text-muted-foreground">
          {currentSection.isComplete ? (
            progress >= 100 ? (
              "Ready to generate ideas!"
            ) : (
              `${currentSection.label} ✓`
            )
          ) : (
            `Step: ${currentSection.label}`
          )}
        </span>
      </div>
    </div>
  );
};

// Simple version for backwards compatibility
interface SimpleProgressBarProps {
  progress: number;
  className?: string;
}

export const ProgressBar = ({ progress, className }: SimpleProgressBarProps) => {
  return (
    <div className={cn("w-full bg-background border-b border-border px-4 py-2", className)}>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground min-w-[3ch]">
          {progress}%
        </span>
      </div>
    </div>
  );
};

// Export both for flexibility
export default EnhancedProgressBar;
