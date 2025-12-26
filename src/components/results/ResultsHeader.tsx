import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ResultsHeaderProps {
  ideasCount: number;
  isGenerating: boolean;
  onRegenerate: () => void;
}

export const ResultsHeader = ({
  ideasCount,
  isGenerating,
  onRegenerate,
}: ResultsHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="flex items-center gap-3 px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-10">
      <button
        onClick={() => navigate("/app/dashboard")}
        className="touch-target flex items-center justify-center"
      >
        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
      </button>
      <div className="flex-1">
        <h1 className="font-semibold text-foreground">Your Business Ideas</h1>
        <p className="text-xs text-muted-foreground">
          {ideasCount} ideas tailored for you
        </p>
      </div>
      {ideasCount > 0 && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onRegenerate}
          disabled={isGenerating}
          className="touch-target"
        >
          <RefreshCw className={`w-5 h-5 ${isGenerating ? "animate-spin" : ""}`} />
        </Button>
      )}
    </header>
  );
};
