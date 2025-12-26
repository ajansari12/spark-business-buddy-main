import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Loader2, Download } from "lucide-react";
import { BusinessIdeaDisplay } from "@/types/ideas-enhanced";
import { generateInvestorOnePager } from "@/utils/pdfExport";

interface InvestorOnePagerProps {
  idea: BusinessIdeaDisplay;
}

export function InvestorOnePager({ idea }: InvestorOnePagerProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateInvestorOnePager(idea);
      toast.success("Investor One-Pager downloaded!");
    } catch (error) {
      console.error("Failed to generate one-pager:", error);
      toast.error("Failed to generate one-pager");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-foreground">Investor One-Pager</h3>
        <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/30">VIP</Badge>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Generate a professional single-page PDF pitch document to share with potential investors or partners.
      </p>

      <div className="bg-card/50 rounded-xl p-3 mb-4">
        <p className="text-xs font-medium text-foreground mb-2">Includes:</p>
        <ul className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
          <li>• Business summary</li>
          <li>• Market opportunity</li>
          <li>• Financial snapshot</li>
          <li>• Competitive edge</li>
          <li>• Ask & use of funds</li>
          <li>• Contact info</li>
        </ul>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full"
        variant="secondary"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Download One-Pager PDF
          </>
        )}
      </Button>
    </div>
  );
}
