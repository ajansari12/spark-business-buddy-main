import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatErrorProps {
  type: "network" | "rate_limit";
  onRetry?: () => void;
}

export const ChatError = ({ type, onRetry }: ChatErrorProps) => {
  if (type === "rate_limit") {
    return (
      <div className="flex items-center gap-3 p-4 mx-4 bg-muted/50 rounded-2xl animate-fade-in">
        <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-foreground font-medium">Taking a breather</p>
          <p className="text-xs text-muted-foreground">
            You're moving fast! Please wait a moment before sending another message.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-4 mx-4 bg-destructive/10 rounded-2xl animate-fade-in">
      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-foreground font-medium">Failed to send</p>
        <p className="text-xs text-muted-foreground">
          Something went wrong. Please try again.
        </p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="flex-shrink-0"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
};
