import { useState } from "react";
import { FileText, Copy, Download, RefreshCw, Eye, Loader2, Check, AlertCircle, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { generatePitchPDF } from "@/utils/pitchPdfExport";

interface PitchGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ideaId: string;
  ideaName: string;
}

interface PitchContent {
  business_name: string;
  elevator_pitch: string;
  problem: string;
  solution: string;
  target_customer: string;
  market_opportunity: string;
  revenue_model: string;
  why_now: string;
  action_plan: string[];
  prompt_used: string;
  market_data_sources?: string[];
  market_research_date?: string;
}

export function PitchGeneratorModal({ open, onOpenChange, ideaId, ideaName }: PitchGeneratorModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("pitch");

  // Fetch existing pitch content
  const { data: existingContent, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['pitch-content', ideaId],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('ft_generated_content')
        .select('content, created_at, updated_at')
        .eq('idea_id', ideaId)
        .eq('user_id', user.id)
        .eq('content_type', 'pitch')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user && open,
  });

  const pitchContent = existingContent?.content as unknown as PitchContent | undefined;

  // Generate pitch mutation
  const generateMutation = useMutation({
    mutationFn: async (regenerate: boolean) => {
      const { data, error } = await supabase.functions.invoke('ft_generate_pitch', {
        body: { idea_id: ideaId, regenerate }
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pitch-content', ideaId] });
      queryClient.invalidateQueries({ queryKey: ['generated-content', ideaId] });
      toast.success("Pitch generated with real-time market data!");
    },
    onError: (error: Error) => {
      console.error('Pitch generation error:', error);
      toast.error(error.message || "Failed to generate pitch");
    },
  });

  const handleGenerate = (regenerate = false) => {
    generateMutation.mutate(regenerate);
  };

  const handleCopyToClipboard = async () => {
    if (!pitchContent) return;

    const sourcesText = pitchContent.market_data_sources?.length 
      ? `\n\nDATA SOURCES\n${pitchContent.market_data_sources.join('\n')}`
      : '';

    const formattedText = `
${pitchContent.business_name}
${'='.repeat(pitchContent.business_name.length)}

ELEVATOR PITCH
${pitchContent.elevator_pitch}

THE PROBLEM
${pitchContent.problem}

THE SOLUTION
${pitchContent.solution}

TARGET CUSTOMER
${pitchContent.target_customer}

MARKET OPPORTUNITY (Canadian Context)
${pitchContent.market_opportunity}

REVENUE MODEL
${pitchContent.revenue_model}

WHY NOW
${pitchContent.why_now}

30-DAY ACTION PLAN
${pitchContent.action_plan.map((step, i) => `${i + 1}. ${step}`).join('\n')}${sourcesText}
`.trim();

    try {
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDownloadPDF = async () => {
    if (!pitchContent) return;
    
    try {
      await generatePitchPDF(pitchContent, ideaName);
      toast.success("PDF downloaded!");
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error("Failed to generate PDF");
    }
  };

  const isGenerating = generateMutation.isPending;
  const hasPitch = !!pitchContent;

  // Extract domain from URL for display
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            One-Page Pitch Generator
          </DialogTitle>
          <DialogDescription>
            {hasPitch 
              ? `Generated pitch for "${ideaName}"`
              : `Generate a professional one-page pitch for "${ideaName}"`
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pitch" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Pitch Content
            </TabsTrigger>
            <TabsTrigger value="prompt" className="flex items-center gap-2" disabled={!hasPitch}>
              <FileText className="w-4 h-4" />
              Prompt Used
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pitch" className="flex-1 mt-4 min-h-0">
            {isLoadingExisting ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : isGenerating ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-lg font-medium text-foreground">Generating your pitch...</p>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Searching for real-time Canadian market data and crafting your pitch. This may take 15-30 seconds.
                </p>
                <div className="space-y-2 w-full max-w-md">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </div>
            ) : hasPitch ? (
              <ScrollArea className="h-[50vh] pr-4">
                <div className="space-y-6">
                  {/* Business Name */}
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{pitchContent.business_name}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">AI Suggested Name</Badge>
                      {pitchContent.market_data_sources && pitchContent.market_data_sources.length > 0 && (
                        <Badge variant="outline" className="text-xs bg-primary/5">
                          📊 Real-time Market Data
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Elevator Pitch */}
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">Elevator Pitch</h3>
                    <p className="text-lg text-foreground leading-relaxed">{pitchContent.elevator_pitch}</p>
                  </div>

                  {/* Problem */}
                  <PitchSection title="The Problem" content={pitchContent.problem} />

                  {/* Solution */}
                  <PitchSection title="The Solution" content={pitchContent.solution} />

                  {/* Target Customer */}
                  <PitchSection title="Target Customer" content={pitchContent.target_customer} />

                  {/* Market Opportunity */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Market Opportunity</h3>
                      <Badge variant="outline" className="text-xs">🇨🇦 Canadian Context</Badge>
                    </div>
                    <p className="text-muted-foreground">{pitchContent.market_opportunity}</p>
                  </div>

                  {/* Revenue Model */}
                  <PitchSection title="Revenue Model" content={pitchContent.revenue_model} />

                  {/* Why Now */}
                  <PitchSection title="Why Now" content={pitchContent.why_now} />

                  {/* 30-Day Action Plan */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">30-Day Action Plan</h3>
                    <ol className="space-y-2">
                      {pitchContent.action_plan.map((step, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="text-muted-foreground pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Market Data Sources */}
                  {pitchContent.market_data_sources && pitchContent.market_data_sources.length > 0 && (
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <ExternalLink className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Data Sources</h3>
                        {pitchContent.market_research_date && (
                          <Badge variant="outline" className="text-xs ml-auto">
                            {new Date(pitchContent.market_research_date).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {pitchContent.market_data_sources.map((source, index) => (
                          <a
                            key={index}
                            href={source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs bg-background px-2 py-1 rounded border hover:bg-muted transition-colors"
                          >
                            <span className="text-primary font-medium">[{index + 1}]</span>
                            <span className="text-muted-foreground">{getDomain(source)}</span>
                            <ExternalLink className="w-3 h-3 text-muted-foreground" />
                          </a>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Market data sourced via Perplexity AI real-time search
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Pitch Generated Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Click "Generate Pitch" to create a professional one-page pitch document enriched with real-time Canadian market data.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="prompt" className="flex-1 mt-4">
            {hasPitch && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">Transparency: How This Was Generated</h3>
                </div>
                <p className="text-sm text-muted-foreground">{pitchContent?.prompt_used}</p>
                <p className="text-xs text-muted-foreground mt-4">
                  This pitch was generated using AI based on the idea details, your profile information, and real-time market research from Perplexity. 
                  Results may vary and should be reviewed for accuracy.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t mt-4">
          {hasPitch ? (
            <>
              <Button onClick={handleCopyToClipboard} variant="outline" className="flex-1 sm:flex-none">
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Copied!" : "Copy to Clipboard"}
              </Button>
              <Button onClick={handleDownloadPDF} variant="outline" className="flex-1 sm:flex-none">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button 
                onClick={() => handleGenerate(true)} 
                variant="secondary"
                disabled={isGenerating}
                className="flex-1 sm:flex-none"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => handleGenerate(false)} 
              disabled={isGenerating}
              className="w-full sm:w-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Pitch
                </>
              )}
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="ml-auto">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PitchSection({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-2">{title}</h3>
      <p className="text-muted-foreground">{content}</p>
    </div>
  );
}
