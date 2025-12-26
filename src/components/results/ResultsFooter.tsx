import { Button } from "@/components/ui/button";
import { Download, Loader2, TrendingUp } from "lucide-react";

interface ResultsFooterProps {
  onExportPDF: () => void;
  onRefreshMarketData: () => void;
  isRefreshingMarketData: boolean;
  canExport: boolean;
}

export const ResultsFooter = ({
  onExportPDF,
  onRefreshMarketData,
  isRefreshingMarketData,
  canExport,
}: ResultsFooterProps) => {
  return (
    <div className="p-4 border-t border-border bg-background safe-bottom space-y-3">
      <div className="flex gap-2">
        <Button
          onClick={onExportPDF}
          className="flex-1 touch-target"
          variant="default"
          disabled={!canExport}
        >
          <Download className="mr-2 w-5 h-5" />
          Download PDF
        </Button>
        <Button
          onClick={onRefreshMarketData}
          variant="outline"
          disabled={isRefreshingMarketData}
          className="touch-target"
        >
          {isRefreshingMarketData ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <TrendingUp className="w-5 h-5" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        {isRefreshingMarketData
          ? "Refreshing market data..."
          : "Download report or refresh market signals"}
      </p>
    </div>
  );
};
