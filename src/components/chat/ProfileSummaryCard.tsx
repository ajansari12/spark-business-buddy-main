import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Target,
  Sparkles,
  Edit3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FTExtractedData } from "@/types/chat";

interface ProfileSummaryCardProps {
  extractedData: Partial<FTExtractedData>;
  onEdit: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

interface ProfileField {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  category: "location" | "background" | "commitment" | "goals";
}

export const ProfileSummaryCard = ({
  extractedData,
  onEdit,
  onConfirm,
  isLoading = false,
}: ProfileSummaryCardProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Format budget display
  const formatBudget = () => {
    const min = extractedData.budget_min;
    const max = extractedData.budget_max;
    if (min && max) {
      return `$${min.toLocaleString()} - $${max.toLocaleString()} CAD`;
    } else if (min) {
      return `$${min.toLocaleString()}+ CAD`;
    } else if (max) {
      return `Up to $${max.toLocaleString()} CAD`;
    }
    return null;
  };

  // Format time commitment
  const formatTime = () => {
    const hours = extractedData.time_commitment_hours;
    if (hours) {
      return `${hours} hours/week`;
    }
    return extractedData.time_commitment || null;
  };

  // Format location
  const formatLocation = () => {
    const city = extractedData.city;
    const province = extractedData.province;
    if (city && province) {
      return `${city}, ${province}`;
    }
    return city || province || null;
  };

  // Build profile fields
  const profileFields: ProfileField[] = [
    {
      icon: <MapPin className="w-4 h-4" />,
      label: "Location",
      value: formatLocation(),
      category: "location",
    },
    {
      icon: <Briefcase className="w-4 h-4" />,
      label: "Background",
      value: extractedData.skills_background,
      category: "background",
    },
    {
      icon: <Sparkles className="w-4 h-4" />,
      label: "Interests",
      value: extractedData.interests,
      category: "background",
    },
    {
      icon: <Clock className="w-4 h-4" />,
      label: "Time Available",
      value: formatTime(),
      category: "commitment",
    },
    {
      icon: <DollarSign className="w-4 h-4" />,
      label: "Budget",
      value: formatBudget(),
      category: "commitment",
    },
    {
      icon: <Target className="w-4 h-4" />,
      label: "Income Goal",
      value: extractedData.income_goal,
      category: "goals",
    },
  ];

  // Filter out empty fields
  const filledFields = profileFields.filter((field) => field.value);
  const emptyFields = profileFields.filter((field) => !field.value);

  // Calculate completeness
  const completenessPercent = Math.round(
    (filledFields.length / profileFields.length) * 100
  );

  // Group fields by category
  const groupedFields = filledFields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = [];
    }
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, ProfileField[]>);

  const categoryLabels = {
    location: "Where You Are",
    background: "Your Experience",
    commitment: "Your Resources",
    goals: "Your Goals",
  };

  // Get profile strength label
  const getStrengthLabel = () => {
    if (completenessPercent === 100) return { text: "Complete", color: "text-green-600" };
    if (completenessPercent >= 75) return { text: "Strong", color: "text-primary" };
    if (completenessPercent >= 50) return { text: "Good", color: "text-yellow-600" };
    return { text: "Needs more info", color: "text-orange-600" };
  };

  const strengthLabel = getStrengthLabel();

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Your Profile</CardTitle>
              <p className="text-xs text-muted-foreground">
                Here's what I know about you
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end">
              <span className={cn("text-xs font-medium", strengthLabel.color)}>
                {strengthLabel.text}
              </span>
              <span className="text-xs text-muted-foreground">
                {completenessPercent}%
              </span>
            </div>
            <Badge
              variant={completenessPercent === 100 ? "default" : "secondary"}
              className="text-xs sm:hidden"
            >
              {completenessPercent}%
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? "Collapse profile" : "Expand profile"}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Strength indicator bar */}
        <div className="mt-3">
          <Progress value={completenessPercent} className="h-1.5" />
        </div>
      </CardHeader>

      {/* Animated expand/collapse using CSS transition */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <CardContent className="pt-0">
          {/* Grouped Profile Fields */}
          <div className="space-y-4 mb-4">
            {Object.entries(groupedFields).map(([category, fields]) => (
              <div key={category} className="space-y-2 animate-fade-in">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </p>
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-2 rounded-lg bg-background/50 transition-colors hover:bg-background/80"
                    >
                      <div className="text-primary mt-0.5">{field.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">
                          {field.label}
                        </p>
                        <p className="text-sm font-medium text-foreground truncate">
                          {field.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Missing fields warning */}
          {emptyFields.length > 0 && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                  Missing information
                </p>
                <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80">
                  {emptyFields.map((f) => f.label).join(", ")}
                </p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onEdit}
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-accent hover:bg-accent/90"
              onClick={onConfirm}
              disabled={isLoading || filledFields.length < 4}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate My Ideas
                </>
              )}
            </Button>
          </div>

          {filledFields.length < 4 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Please provide at least 4 profile details to generate personalized
              ideas
            </p>
          )}
        </CardContent>
      </div>
    </Card>
  );
};

export default ProfileSummaryCard;
