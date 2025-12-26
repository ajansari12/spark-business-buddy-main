import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Globe,
  ExternalLink,
  Loader2,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BusinessNameSuggestion {
  name: string;
  tagline: string;
  domain_suggestions: string[];
  rationale: string;
}

interface BusinessNameGeneratorProps {
  ideaId: string;
  ideaTitle: string;
  initialNames?: BusinessNameSuggestion[];
  onNamesGenerated?: (names: BusinessNameSuggestion[]) => void;
}

export function BusinessNameGenerator({
  ideaId,
  ideaTitle,
  initialNames,
  onNamesGenerated,
}: BusinessNameGeneratorProps) {
  const [names, setNames] = useState<BusinessNameSuggestion[]>(initialNames || []);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const generateNames = async (regenerate = false) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ft_generate_business_names", {
        body: { idea_id: ideaId, regenerate },
      });

      if (error) {
        throw error;
      }

      if (data.names) {
        setNames(data.names);
        onNamesGenerated?.(data.names);
        
        if (data.cached) {
          toast.info("Showing previously generated names");
        } else {
          toast.success(`Generated ${data.names.length} business name ideas!`);
        }
      }
    } catch (error) {
      console.error("Failed to generate names:", error);
      toast.error("Failed to generate business names. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (name: string, index: number) => {
    try {
      await navigator.clipboard.writeText(name);
      setCopiedIndex(index);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const openDomainCheck = (domain: string) => {
    // Use GoDaddy for domain checking
    const url = `https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=${encodeURIComponent(domain)}`;
    window.open(url, "_blank");
  };

  const openSocialCheck = (platform: string, name: string) => {
    const cleanName = name.replace(/\s+/g, "").toLowerCase();
    const urls: Record<string, string> = {
      instagram: `https://www.instagram.com/${cleanName}`,
      twitter: `https://twitter.com/${cleanName}`,
      facebook: `https://www.facebook.com/search/top?q=${encodeURIComponent(name)}`,
      linkedin: `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(name)}`,
    };
    window.open(urls[platform], "_blank");
  };

  if (names.length === 0 && !isLoading) {
    return (
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-2xl p-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">AI Business Name Generator</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get 10-15 creative business name suggestions tailored to your "{ideaTitle}" business idea.
          </p>
          <Button onClick={() => generateNames()} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Business Names
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with regenerate button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Business Name Ideas</h3>
          <Badge variant="secondary" className="text-xs">{names.length}</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => generateNames(true)}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-1" />
              Regenerate
            </>
          )}
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Generating creative names...</p>
          </div>
        </div>
      )}

      {/* Name cards */}
      {!isLoading && (
        <div className="grid gap-3">
          {names.map((suggestion, index) => (
            <div
              key={index}
              className={cn(
                "bg-card border border-border rounded-xl p-4 transition-all",
                expandedIndex === index && "ring-2 ring-primary/20"
              )}
            >
              {/* Name and copy button */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <button
                    onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                    className="text-left w-full"
                  >
                    <h4 className="font-semibold text-foreground text-lg hover:text-primary transition-colors">
                      {suggestion.name}
                    </h4>
                    <p className="text-sm text-accent font-medium">{suggestion.tagline}</p>
                  </button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={() => copyToClipboard(suggestion.name, index)}
                >
                  {copiedIndex === index ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Expanded content */}
              {expandedIndex === index && (
                <div className="mt-3 pt-3 border-t border-border space-y-3">
                  {/* Rationale */}
                  <p className="text-sm text-muted-foreground">{suggestion.rationale}</p>

                  {/* Domain suggestions */}
                  <div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <Globe className="w-3 h-3" />
                      <span>Check domain availability:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {suggestion.domain_suggestions.map((domain, i) => (
                        <button
                          key={i}
                          onClick={() => openDomainCheck(domain)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-muted hover:bg-muted/80 rounded text-xs text-foreground transition-colors"
                        >
                          {domain}
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Social handle check */}
                  <div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <span>Check social handles:</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openSocialCheck("instagram", suggestion.name)}
                        className="p-2 bg-muted hover:bg-muted/80 rounded transition-colors"
                        title="Check Instagram"
                      >
                        <Instagram className="w-4 h-4 text-pink-500" />
                      </button>
                      <button
                        onClick={() => openSocialCheck("twitter", suggestion.name)}
                        className="p-2 bg-muted hover:bg-muted/80 rounded transition-colors"
                        title="Check Twitter/X"
                      >
                        <Twitter className="w-4 h-4 text-sky-500" />
                      </button>
                      <button
                        onClick={() => openSocialCheck("facebook", suggestion.name)}
                        className="p-2 bg-muted hover:bg-muted/80 rounded transition-colors"
                        title="Search Facebook"
                      >
                        <Facebook className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => openSocialCheck("linkedin", suggestion.name)}
                        className="p-2 bg-muted hover:bg-muted/80 rounded transition-colors"
                        title="Search LinkedIn"
                      >
                        <Linkedin className="w-4 h-4 text-blue-700" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Click to expand hint */}
              {expandedIndex !== index && (
                <p className="text-xs text-muted-foreground mt-2">
                  Click to see domain suggestions
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
