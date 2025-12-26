import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Clock,
  DollarSign,
  ExternalLink,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Link,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomStep {
  id: string;
  title: string;
  description: string;
  cost_estimate?: string;
  time_estimate?: string;
  government_url?: string;
  is_industry_specific: boolean;
  source_verified?: boolean;
  url_status?: string;
  perplexity_sources?: string[];
}

interface IndustryStepCardProps {
  step: CustomStep;
  stepNumber: number;
}

export function IndustryStepCard({ step, stepNumber }: IndustryStepCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border border-warning/50 bg-warning/5 rounded-xl overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-3 p-4 text-left hover:bg-warning/10 transition-colors">
            <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground">{step.title}</h3>
                <Badge variant="outline" className="text-xs bg-warning/20 text-warning border-warning/30">
                  Industry-Specific
                </Badge>
                {step.source_verified === true && (
                  <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {step.source_verified === false && step.government_url && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Verify Required
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                {step.time_estimate && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {step.time_estimate}
                  </span>
                )}
                {step.cost_estimate && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {step.cost_estimate}
                  </span>
                )}
              </div>
            </div>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            <p className="text-muted-foreground">{step.description}</p>

            {step.government_url ? (
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={step.government_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-warning text-warning-foreground rounded-lg hover:bg-warning/90 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Learn More
                </a>
                {step.source_verified ? (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    URL Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Verify URL Manually
                  </Badge>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>No official link available - please research this requirement independently</span>
              </div>
            )}

            {step.perplexity_sources && step.perplexity_sources.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Sources:</p>
                <div className="flex flex-wrap gap-2">
                  {step.perplexity_sources.slice(0, 3).map((source, i) => (
                    <a
                      key={i}
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Link className="w-3 h-3" />
                      {(() => {
                        try {
                          return new URL(source).hostname.replace("www.", "");
                        } catch {
                          return "Source";
                        }
                      })()}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-warning/10 rounded-lg p-3 text-sm text-warning-foreground">
              <p className="font-medium mb-1">AI-Generated Requirement</p>
              <p className="text-xs opacity-80">
                This requirement was identified by AI based on your specific business type.
                Always verify with official government sources before proceeding.
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
