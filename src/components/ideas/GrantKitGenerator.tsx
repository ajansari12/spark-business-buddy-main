import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  FileText,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  DollarSign,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CanadianResource } from "@/types/ideas-enhanced";

interface BudgetItem {
  item: string;
  amount: number;
  justification: string;
}

interface GrantKit {
  id: string;
  cover_letter: string;
  budget_template: {
    categories: BudgetItem[];
    total: number;
    notes: string;
  };
  business_summary: string;
}

interface GrantKitGeneratorProps {
  ideaId: string;
  eligibleGrants: CanadianResource[];
}

export function GrantKitGenerator({ ideaId, eligibleGrants }: GrantKitGeneratorProps) {
  const [selectedGrantId, setSelectedGrantId] = useState<string>("");
  const [kit, setKit] = useState<GrantKit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [coverLetterOpen, setCoverLetterOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const generateKit = async () => {
    if (!selectedGrantId) {
      toast.error("Please select a grant first");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ft_generate_grant_kit", {
        body: { idea_id: ideaId, grant_id: selectedGrantId },
      });

      if (error) throw error;

      if (data.kit) {
        setKit(data.kit);
        if (data.cached) {
          toast.info("Showing previously generated kit");
        } else {
          toast.success("Grant application kit generated!");
        }
      }
    } catch (error) {
      console.error("Failed to generate kit:", error);
      toast.error("Failed to generate grant kit. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedSection(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const downloadAsText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
  };

  if (eligibleGrants.length === 0) {
    return (
      <div className="bg-muted/50 rounded-2xl p-4 text-center">
        <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          No eligible grants available for this idea.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Grant selector */}
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-foreground">Grant Application Starter Kit</h3>
          <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/30">VIP</Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Generate a personalized cover letter, budget template, and business summary for your grant application.
        </p>

        <div className="space-y-3">
          <Select value={selectedGrantId} onValueChange={setSelectedGrantId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a grant to apply for" />
            </SelectTrigger>
            <SelectContent>
              {eligibleGrants.map((grant) => (
                <SelectItem key={grant.name} value={grant.name}>
                  {grant.name} - {grant.type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={generateKit}
            disabled={!selectedGrantId || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Kit...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate Application Kit
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Generated kit display */}
      {kit && (
        <div className="space-y-3">
          {/* Cover Letter */}
          <Collapsible open={coverLetterOpen} onOpenChange={setCoverLetterOpen}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground">Cover Letter</span>
                </div>
                <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", coverLetterOpen && "rotate-180")} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="bg-muted/30 rounded-xl p-4">
                <div className="flex justify-end gap-2 mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(kit.cover_letter, "cover")}
                  >
                    {copiedSection === "cover" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadAsText(kit.cover_letter, "cover-letter.txt")}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
                <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
                  {kit.cover_letter}
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Budget Template */}
          <Collapsible open={budgetOpen} onOpenChange={setBudgetOpen}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-success" />
                  <span className="font-semibold text-foreground">Budget Template</span>
                  {kit.budget_template?.total > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      ${kit.budget_template.total.toLocaleString()}
                    </Badge>
                  )}
                </div>
                <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", budgetOpen && "rotate-180")} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="bg-muted/30 rounded-xl p-4">
                {kit.budget_template?.categories?.length > 0 ? (
                  <div className="space-y-3">
                    {kit.budget_template.categories.map((item, i) => (
                      <div key={i} className="bg-card rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-foreground">{item.item}</span>
                          <span className="text-success font-bold">${item.amount.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.justification}</p>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 border-t border-border">
                      <span className="font-bold text-foreground">Total</span>
                      <span className="font-bold text-success text-lg">
                        ${kit.budget_template.total.toLocaleString()}
                      </span>
                    </div>
                    {kit.budget_template.notes && (
                      <p className="text-xs text-muted-foreground italic mt-2">
                        {kit.budget_template.notes}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No budget data available</p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Business Summary */}
          <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-accent" />
                  <span className="font-semibold text-foreground">Business Summary</span>
                </div>
                <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", summaryOpen && "rotate-180")} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="bg-muted/30 rounded-xl p-4">
                <div className="flex justify-end gap-2 mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(kit.business_summary, "summary")}
                  >
                    {copiedSection === "summary" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {kit.business_summary}
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  );
}
