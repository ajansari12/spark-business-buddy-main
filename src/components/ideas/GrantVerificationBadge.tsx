import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle, Clock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface GrantVerificationBadgeProps {
  status?: string | null;
  deadline?: string | null;
  lastVerified?: string | null;
  autoVerifiedAt?: string | null; // NEW: Perplexity AI verification timestamp
  className?: string;
}

export const GrantVerificationBadge = ({ 
  status, 
  deadline, 
  lastVerified,
  autoVerifiedAt,
  className 
}: GrantVerificationBadgeProps) => {
  const normalizedStatus = status?.toLowerCase();
  
  // Check if this was verified by Perplexity AI (auto_verified_at is populated)
  const isAIVerified = !!autoVerifiedAt;
  
  const getStatusBadge = () => {
    if (normalizedStatus === "open" || normalizedStatus === "active") {
      if (isAIVerified) {
        // Verified by Perplexity AI - show confident green badge
        return (
          <Badge variant="outline" className={cn("text-xs bg-success/10 text-success border-success/30", className)}>
            <ShieldCheck className="w-3 h-3 mr-1" />
            Verified Open
          </Badge>
        );
      } else {
        // Status is "open" but not verified by AI - show warning yellow
        return (
          <Badge variant="outline" className={cn("text-xs bg-warning/10 text-warning border-warning/30", className)}>
            <AlertTriangle className="w-3 h-3 mr-1" />
            Listed as Open
          </Badge>
        );
      }
    }
    
    if (normalizedStatus === "closed" || normalizedStatus === "expired") {
      return (
        <Badge variant="outline" className={cn("text-xs bg-destructive/10 text-destructive border-destructive/30", className)}>
          <XCircle className="w-3 h-3 mr-1" />
          Closed
        </Badge>
      );
    }
    
    if (normalizedStatus === "upcoming") {
      return (
        <Badge variant="outline" className={cn("text-xs bg-primary/10 text-primary border-primary/30", className)}>
          <Clock className="w-3 h-3 mr-1" />
          Upcoming
        </Badge>
      );
    }
    
    // Unverified or unknown status
    return (
      <Badge variant="outline" className={cn("text-xs bg-warning/10 text-warning border-warning/30", className)}>
        <AlertTriangle className="w-3 h-3 mr-1" />
        Unverified
      </Badge>
    );
  };

  const getDeadlineBadge = () => {
    if (!deadline) return null;
    
    try {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntil < 0) return null; // Past deadline
      
      const isUrgent = daysUntil <= 30;
      
      return (
        <Badge 
          variant="outline" 
          className={cn(
            "text-xs",
            isUrgent 
              ? "bg-destructive/10 text-destructive border-destructive/30" 
              : "bg-muted text-muted-foreground border-border"
          )}
        >
          <Clock className="w-3 h-3 mr-1" />
          Deadline: {format(deadlineDate, "MMM d, yyyy")}
        </Badge>
      );
    } catch {
      return null;
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {getStatusBadge()}
      {getDeadlineBadge()}
    </div>
  );
};
