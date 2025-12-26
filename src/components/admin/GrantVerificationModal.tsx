import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, AlertCircle, ExternalLink } from "lucide-react";
import type { Grant, VerificationResult } from "@/hooks/useAdminGrants";

interface GrantVerificationModalProps {
  grant: Grant | null;
  isOpen: boolean;
  onClose: () => void;
  onVerify: (grantId: string) => Promise<VerificationResult | null>;
  isVerifying: boolean;
}

export function GrantVerificationModal({
  grant,
  isOpen,
  onClose,
  onVerify,
  isVerifying,
}: GrantVerificationModalProps) {
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleVerify = async () => {
    if (!grant) return;
    const verificationResult = await onVerify(grant.id);
    setResult(verificationResult);
  };

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "closed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      high: "default",
      medium: "secondary",
      low: "outline",
    };
    return <Badge variant={variants[confidence] || "outline"}>{confidence} confidence</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Verify Grant Status</DialogTitle>
          <DialogDescription>
            Use AI-powered search to verify if this program is currently accepting applications.
          </DialogDescription>
        </DialogHeader>

        {grant && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
              <h3 className="font-semibold">{grant.name}</h3>
              <p className="text-sm text-muted-foreground">{grant.organization}</p>
              <div className="flex items-center gap-2 text-sm">
                <span>Current status:</span>
                <Badge variant={grant.status === "open" ? "default" : "secondary"}>
                  {grant.status || "unknown"}
                </Badge>
              </div>
              {grant.last_verified && (
                <p className="text-xs text-muted-foreground">
                  Last verified: {new Date(grant.last_verified).toLocaleDateString()}
                </p>
              )}
            </div>

            {!result && !isVerifying && (
              <p className="text-sm text-muted-foreground">
                Click "Verify with AI" to check the current status of this program using Perplexity search.
              </p>
            )}

            {isVerifying && (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Searching for current status...</span>
                </div>
              </div>
            )}

            {result && (
              <div className="rounded-lg border p-4 space-y-3 bg-muted/50">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Verification Result</h4>
                  {getConfidenceBadge(result.confidence)}
                </div>

                <div className="flex items-center gap-2">
                  {getStatusIcon(result.current_status)}
                  <span className="font-medium capitalize">{result.current_status}</span>
                </div>

                {result.deadline_found && (
                  <div className="text-sm">
                    <span className="font-medium">Deadline Found: </span>
                    {result.deadline_found}
                  </div>
                )}

                <div className="text-sm">
                  <span className="font-medium">Notes: </span>
                  <span className="text-muted-foreground">{result.notes}</span>
                </div>

                {result.sources && result.sources.length > 0 && (
                  <div className="text-sm space-y-1">
                    <span className="font-medium">Sources:</span>
                    <ul className="list-disc list-inside space-y-1">
                      {result.sources.slice(0, 3).map((source, i) => (
                        <li key={i} className="text-muted-foreground">
                          <a
                            href={source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            {new URL(source).hostname}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          {!result && (
            <Button onClick={handleVerify} disabled={isVerifying}>
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify with AI"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
