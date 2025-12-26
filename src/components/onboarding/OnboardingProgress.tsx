import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export const OnboardingProgress = ({ currentStep, totalSteps }: OnboardingProgressProps) => {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 w-2 rounded-full transition-all duration-300",
            i + 1 === currentStep
              ? "w-6 bg-primary"
              : i + 1 < currentStep
              ? "bg-primary"
              : "bg-muted"
          )}
        />
      ))}
    </div>
  );
};
