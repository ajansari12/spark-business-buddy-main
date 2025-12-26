import { Loader2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultsLoadingProps {
  type: "auth" | "generating" | "error";
  error?: string;
  onRetry?: () => void;
}

export const ResultsLoading = ({ type, error, onRetry }: ResultsLoadingProps) => {
  if (type === "auth") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Rocket className="w-8 h-8 animate-pulse text-primary" />
      </div>
    );
  }

  if (type === "error") {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <Rocket className="w-10 h-10 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2 text-center">
          Something Went Wrong
        </h2>
        <p className="text-muted-foreground text-center max-w-xs mb-6">
          {error}
        </p>
        {onRetry && <Button onClick={onRetry}>Try Again</Button>}
      </div>
    );
  }

  // Generating state
  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2 text-center">
        Crafting Your Ideas
      </h2>
      <p className="text-muted-foreground text-center max-w-xs">
        Our AI is analyzing your profile and finding the perfect business
        opportunities for you...
      </p>
    </div>
  );
};
