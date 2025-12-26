import { BusinessStructure, BusinessStructureType } from "@/types/registration";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, XCircle, DollarSign, Users, Building2, User, ShieldCheck, AlertTriangle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { VerifiedFee } from "@/hooks/useBusinessStructureFees";
import { CitationText } from "@/components/ideas/CitationText";

interface BusinessStructureSelectorProps {
  structures: BusinessStructure[];
  selected: BusinessStructureType | null;
  onSelect: (type: BusinessStructureType) => void;
  recommendedType?: BusinessStructureType;
  personalizedExplanations?: Record<BusinessStructureType, string>;
  verifiedFees?: Record<string, VerifiedFee>;
  isLoadingFees?: boolean;
}

const structureIcons: Record<BusinessStructureType, React.ReactNode> = {
  sole_proprietorship: <User className="w-6 h-6" />,
  partnership: <Users className="w-6 h-6" />,
  corporation: <Building2 className="w-6 h-6" />,
};

function formatVerificationDate(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-CA", { month: "short", year: "numeric" });
}

export function BusinessStructureSelector({
  structures,
  selected,
  onSelect,
  recommendedType = "sole_proprietorship",
  personalizedExplanations,
  verifiedFees = {},
  isLoadingFees = false,
}: BusinessStructureSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Choose Your Business Structure</h2>
        <p className="text-muted-foreground">
          This affects your liability, taxes, and registration requirements
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {structures.map((structure) => {
          const isSelected = selected === structure.type;
          const isRecommended = structure.type === recommendedType;
          const verifiedFee = verifiedFees[structure.type];
          const displayFee = verifiedFee?.verified_fee || structure.registrationFee;
          const isVerified = !!verifiedFee;
          const explanation = personalizedExplanations?.[structure.type];

          return (
            <Card
              key={structure.type}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md relative",
                isSelected && "ring-2 ring-primary border-primary",
                isRecommended && !isSelected && "border-success/50"
              )}
              onClick={() => onSelect(structure.type)}
            >
              {isRecommended && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-success text-success-foreground">
                  Recommended
                </Badge>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {structureIcons[structure.type]}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{structure.label}</CardTitle>
                    <div className="flex items-center gap-1.5 mt-1">
                      <DollarSign className="w-3 h-3 text-muted-foreground" />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={cn(
                              "text-sm flex items-center gap-1",
                              isVerified ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {isLoadingFees ? (
                                <span className="animate-pulse">Loading...</span>
                              ) : (
                                <>
                                  {displayFee}
                                  {isVerified ? (
                                    <ShieldCheck className="w-3.5 h-3.5 text-success" />
                                  ) : (
                                    <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                                  )}
                                </>
                              )}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            {isVerified ? (
                              <div className="space-y-1">
                                <p className="font-medium text-success flex items-center gap-1">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  Verified {formatVerificationDate(verifiedFee.last_verified)}
                                </p>
                                {verifiedFee.fee_notes && (
                                  <p className="text-xs">
                                    <CitationText 
                                      text={verifiedFee.fee_notes} 
                                      citations={verifiedFee.perplexity_sources || []} 
                                    />
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-warning">
                                Unverified - fee may have changed
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{structure.description}</p>

                {/* Personalized Explanation */}
                {explanation && (
                  <div className={cn(
                    "p-2.5 rounded-lg text-xs flex items-start gap-2",
                  isRecommended 
                    ? "bg-success/10 text-foreground border border-success/20" 
                    : "bg-muted/50 text-muted-foreground"
                  )}>
                    <Lightbulb className={cn(
                      "w-3.5 h-3.5 mt-0.5 flex-shrink-0",
                      isRecommended ? "text-success" : "text-muted-foreground"
                    )} />
                    <span>
                      {isRecommended && <strong className="text-success">For you: </strong>}
                      {explanation}
                    </span>
                  </div>
                )}

                {/* Pros */}
                <div>
                  <h4 className="text-xs font-semibold text-success mb-1.5 uppercase tracking-wide">
                    Advantages
                  </h4>
                  <ul className="space-y-1">
                    {structure.pros.slice(0, 3).map((pro, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cons */}
                <div>
                  <h4 className="text-xs font-semibold text-destructive mb-1.5 uppercase tracking-wide">
                    Considerations
                  </h4>
                  <ul className="space-y-1">
                    {structure.cons.slice(0, 2).map((con, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <XCircle className="w-3 h-3 text-destructive mt-0.5 flex-shrink-0" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended For */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Best For
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {structure.recommendedFor.slice(0, 3).map((item, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Selection indicator */}
                <Button
                  variant={isSelected ? "default" : "outline"}
                  className="w-full mt-2"
                  size="sm"
                >
                  {isSelected ? "Selected" : "Select"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
