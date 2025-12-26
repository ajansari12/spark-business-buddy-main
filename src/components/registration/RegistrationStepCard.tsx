import { useState } from "react";
import { RegistrationStep } from "@/types/registration";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Clock,
  DollarSign,
  ExternalLink,
  ChevronDown,
  Check,
  FileText,
  Lightbulb,
  Circle,
  CheckCircle2,
  MessageCircle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RegistrationStepCardProps {
  step: RegistrationStep;
  stepNumber: number;
  isCompleted: boolean;
  isCurrent: boolean;
  note?: string;
  onComplete: () => void;
  onUncomplete: () => void;
  onSaveNote: (note: string) => void;
  isSaving?: boolean;
  onAskAI?: (question: string) => void;
}

export function RegistrationStepCard({
  step,
  stepNumber,
  isCompleted,
  isCurrent,
  note = "",
  onComplete,
  onUncomplete,
  onSaveNote,
  isSaving,
  onAskAI,
}: RegistrationStepCardProps) {
  const [isOpen, setIsOpen] = useState(isCurrent);
  const [localNote, setLocalNote] = useState(note);

  const handleSaveNote = () => {
    onSaveNote(localNote);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          "border rounded-xl overflow-hidden transition-colors",
          isCompleted && "border-success/50 bg-success/5",
          isCurrent && !isCompleted && "border-primary/50 bg-primary/5",
          !isCompleted && !isCurrent && "border-border bg-card"
        )}
      >
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                isCompleted && "bg-success text-success-foreground",
                isCurrent && !isCompleted && "bg-primary text-primary-foreground",
                !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <span className="text-sm font-bold">{stepNumber}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate">{step.title}</h3>
                {step.isOptional && (
                  <Badge variant="outline" className="text-xs">
                    Optional
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {step.estimatedTime}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {step.cost}
                </span>
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
            {/* Description */}
            <p className="text-muted-foreground">{step.description}</p>

            {/* Government Link */}
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={step.governmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Go to Official Website
              </a>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700">
                <Check className="w-3 h-3 mr-1" />
                Official Source
              </Badge>
            </div>

            {/* Required Documents */}
            <div>
              <h4 className="font-medium text-foreground flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-primary" />
                Required Documents
              </h4>
              <ul className="space-y-1.5">
                {step.requiredDocuments.map((doc, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Circle className="w-2 h-2 mt-1.5 fill-current" />
                    {doc}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tips */}
            <div>
              <h4 className="font-medium text-foreground flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-warning" />
                Tips
              </h4>
              <ul className="space-y-1.5">
                {step.tips.map((tip, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-muted-foreground bg-warning/10 rounded-lg p-2"
                  >
                    <span className="text-warning">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Notes */}
            <div>
              <h4 className="font-medium text-foreground mb-2">Your Notes</h4>
              <Textarea
                value={localNote}
                onChange={(e) => setLocalNote(e.target.value)}
                placeholder="Add notes about this step (confirmation numbers, dates, etc.)"
                className="min-h-[80px]"
              />
              {localNote !== note && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveNote}
                  disabled={isSaving}
                  className="mt-2"
                >
                  Save Note
                </Button>
              )}
            </div>

            {/* Complete Button */}
            <div className="pt-2">
              {isCompleted ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onUncomplete}
                  disabled={isSaving}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Completed — Click to Undo
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={onComplete}
                  disabled={isSaving}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Complete
                </Button>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
