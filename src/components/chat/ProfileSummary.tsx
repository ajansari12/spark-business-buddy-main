import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FTExtractedData } from "@/types/chat";
import { 
  MapPin, 
  Briefcase, 
  Clock, 
  DollarSign, 
  Target, 
  Building2,
  Pencil,
  CheckCircle2
} from "lucide-react";

interface ProfileSummaryProps {
  extractedData: Partial<FTExtractedData>;
  onEdit: (field: string) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

interface SummaryRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  field: string;
  onEdit: (field: string) => void;
}

const SummaryRow = ({ icon, label, value, field, onEdit }: SummaryRowProps) => {
  if (!value) return null;
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-medium text-foreground">{value}</p>
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onEdit(field)}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const ProfileSummary = ({ 
  extractedData, 
  onEdit, 
  onConfirm,
  isLoading = false 
}: ProfileSummaryProps) => {
  // Format location
  const location = [extractedData.city, extractedData.province]
    .filter(Boolean)
    .join(", ") || null;
  
  // Format budget
  const budget = extractedData.budget_min && extractedData.budget_max
    ? `$${extractedData.budget_min.toLocaleString()} - $${extractedData.budget_max.toLocaleString()} CAD`
    : extractedData.budget || null;
  
  // Format time commitment
  const timeCommitment = extractedData.time_commitment_hours
    ? `${extractedData.time_commitment_hours} hours/week`
    : extractedData.time_commitment || null;
  
  // Format industries
  const industries = extractedData.preferred_industries?.length 
    ? extractedData.preferred_industries.join(", ")
    : null;

  return (
    <div className="p-4 bg-background border-t border-border safe-bottom">
      <Card className="p-4 bg-muted/30 border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Your Profile Summary</h3>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Review your information before we generate your personalized business ideas.
        </p>
        
        <div className="space-y-1">
          <SummaryRow
            icon={<MapPin className="h-4 w-4" />}
            label="Location"
            value={location}
            field="location"
            onEdit={onEdit}
          />
          
          <SummaryRow
            icon={<Briefcase className="h-4 w-4" />}
            label="Skills & Background"
            value={extractedData.skills_background}
            field="skills"
            onEdit={onEdit}
          />
          
          <SummaryRow
            icon={<Clock className="h-4 w-4" />}
            label="Time Available"
            value={timeCommitment}
            field="time"
            onEdit={onEdit}
          />
          
          <SummaryRow
            icon={<DollarSign className="h-4 w-4" />}
            label="Startup Budget"
            value={budget}
            field="budget"
            onEdit={onEdit}
          />
          
          <SummaryRow
            icon={<Target className="h-4 w-4" />}
            label="Income Goal"
            value={extractedData.income_goal}
            field="income"
            onEdit={onEdit}
          />
          
          {industries && (
            <SummaryRow
              icon={<Building2 className="h-4 w-4" />}
              label="Industry Preferences"
              value={industries}
              field="industries"
              onEdit={onEdit}
            />
          )}
        </div>
        
        {extractedData.constraints && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <Badge variant="outline" className="text-xs">
              Constraints: {extractedData.constraints}
            </Badge>
          </div>
        )}
      </Card>
      
      <div className="mt-4 space-y-3">
        <p className="text-center text-sm text-muted-foreground">
          Unlock your personalized ideas for just <span className="font-semibold text-foreground">$49 CAD</span>
        </p>
        <Button
          onClick={onConfirm}
          disabled={isLoading}
          className="w-full touch-target bg-accent hover:bg-accent/90"
        >
          {isLoading ? "Processing..." : "Unlock My Business Ideas"}
        </Button>
      </div>
    </div>
  );
};
