import { CheckCircle2 } from "lucide-react";

export interface WhyThisFitsData {
  skill_reference?: string;
  budget_reference?: string;
  time_reference?: string;
  location_reference?: string;
}

interface WhyThisFitsStructuredProps {
  data: WhyThisFitsData;
  fallbackText?: string;
  className?: string;
}

export const WhyThisFitsStructured = ({ 
  data, 
  fallbackText,
  className 
}: WhyThisFitsStructuredProps) => {
  const references = [
    { key: "skill_reference", label: "Skills Match", value: data.skill_reference },
    { key: "budget_reference", label: "Budget Fit", value: data.budget_reference },
    { key: "time_reference", label: "Time Commitment", value: data.time_reference },
    { key: "location_reference", label: "Location Advantage", value: data.location_reference },
  ].filter(ref => ref.value);

  // If no structured data, fall back to plain text
  if (references.length === 0) {
    if (!fallbackText) return null;
    return (
      <p className={`text-sm text-muted-foreground ${className || ""}`}>
        {fallbackText}
      </p>
    );
  }

  return (
    <div className={`space-y-2 ${className || ""}`}>
      {references.map((ref) => (
        <div key={ref.key} className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-foreground">{ref.label}:</span>
            <p className="text-xs text-muted-foreground">{ref.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
