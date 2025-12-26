import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getTaxRequirements, TaxRequirement } from "@/data/taxRequirements";
import { cn } from "@/lib/utils";
import {
  Receipt,
  ChevronDown,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  Info,
} from "lucide-react";

interface TaxChecklistProps {
  provinceCode: string;
  businessStructure: 'sole_proprietorship' | 'partnership' | 'corporation';
  completedItems?: string[];
  onItemToggle?: (itemId: string, completed: boolean) => void;
}

export const TaxChecklist = ({
  provinceCode,
  businessStructure,
  completedItems = [],
  onItemToggle,
}: TaxChecklistProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [localCompleted, setLocalCompleted] = useState<string[]>(completedItems);

  useEffect(() => {
    setLocalCompleted(completedItems);
  }, [completedItems]);

  const requirements = getTaxRequirements(provinceCode, businessStructure);
  
  if (requirements.length === 0) {
    return null;
  }

  const completedCount = localCompleted.length;
  const totalRequired = requirements.filter(r => r.isRequired).length;

  const handleToggle = (itemId: string) => {
    const isCompleted = localCompleted.includes(itemId);
    const newCompleted = isCompleted 
      ? localCompleted.filter(id => id !== itemId)
      : [...localCompleted, itemId];
    
    setLocalCompleted(newCompleted);
    onItemToggle?.(itemId, !isCompleted);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6">
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between p-4 bg-warning/10 rounded-2xl hover:bg-warning/20 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center">
              <Receipt className="w-5 h-5 text-warning" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-foreground">Tax Requirements</h3>
              <p className="text-xs text-muted-foreground">
                {completedCount} of {totalRequired} required items completed
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "w-5 h-5 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4 space-y-3">
        <div className="bg-muted/50 rounded-xl p-3 mb-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              These are common tax obligations for a {businessStructure.replace(/_/g, ' ')} in {provinceCode}. 
              Consult a tax professional for your specific situation.
            </p>
          </div>
        </div>

        {requirements.map((req) => (
          <TaxRequirementItem
            key={req.id}
            requirement={req}
            isCompleted={localCompleted.includes(req.id)}
            onToggle={() => handleToggle(req.id)}
          />
        ))}

        {/* Progress indicator */}
        <div className="mt-4 p-4 bg-card border border-border rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedCount}/{requirements.length}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-success h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / requirements.length) * 100}%` }}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

interface TaxRequirementItemProps {
  requirement: TaxRequirement;
  isCompleted: boolean;
  onToggle: () => void;
}

const TaxRequirementItem = ({ requirement, isCompleted, onToggle }: TaxRequirementItemProps) => {
  return (
    <div 
      className={cn(
        "bg-card border rounded-xl p-4 transition-colors",
        isCompleted ? "border-success/50 bg-success/5" : "border-border"
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={onToggle}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className={cn(
              "font-medium text-sm",
              isCompleted ? "text-muted-foreground line-through" : "text-foreground"
            )}>
              {requirement.title}
            </h4>
            {requirement.isRequired ? (
              <Badge variant="outline" className="text-xs text-destructive border-destructive/30">
                Required
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Conditional
              </Badge>
            )}
          </div>
          
          <p className={cn(
            "text-sm mb-2",
            isCompleted ? "text-muted-foreground" : "text-muted-foreground"
          )}>
            {requirement.description}
          </p>

          <div className="flex flex-wrap gap-2">
            {requirement.threshold && (
              <div className="flex items-center gap-1 text-xs text-warning">
                <AlertCircle className="w-3 h-3" />
                <span>Threshold: {requirement.threshold}</span>
              </div>
            )}
            {requirement.deadline && (
              <div className="flex items-center gap-1 text-xs text-primary">
                <Clock className="w-3 h-3" />
                <span>{requirement.deadline}</span>
              </div>
            )}
          </div>

          {requirement.governmentUrl && (
            <a
              href={requirement.governmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
            >
              Official Guide <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        
        {isCompleted && (
          <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
        )}
      </div>
    </div>
  );
};

export default TaxChecklist;
