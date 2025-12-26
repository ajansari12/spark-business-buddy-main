import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRegistrationProgress } from "@/hooks/useRegistrationProgress";
import { useRegistrationPath } from "@/hooks/useRegistrationPath";
import { useBusinessStructureFees } from "@/hooks/useBusinessStructureFees";
import { getProvinceRegistration, getSupportedProvinces } from "@/data/provinceRegistration";
import { BusinessStructureType } from "@/types/registration";
import { BusinessStructureSelector } from "@/components/registration/BusinessStructureSelector";
import { RegistrationStepCard } from "@/components/registration/RegistrationStepCard";
import { IndustryStepCard } from "@/components/registration/IndustryStepCard";
import { RegistrationCopilot } from "@/components/registration/RegistrationCopilot";
import { TaxChecklist } from "@/components/registration/TaxChecklist";
import { getStructureRecommendation } from "@/utils/businessStructureRecommendation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Loader2,
  Wand2,
  RefreshCw,
} from "lucide-react";
import { cn, stripMarkdown } from "@/lib/utils";

type WizardStep = "province" | "structure" | "registration";

export default function Registration() {
  const { ideaId } = useParams<{ ideaId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [idea, setIdea] = useState<{ title: string; category: string; session_id: string } | null>(null);
  const [collectedData, setCollectedData] = useState<Record<string, any> | null>(null);
  const [isLoadingIdea, setIsLoadingIdea] = useState(true);
  const [wizardStep, setWizardStep] = useState<WizardStep>("province");
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedStructure, setSelectedStructure] = useState<BusinessStructureType | null>(null);
  const [currentStepId, setCurrentStepId] = useState<string | undefined>();
  const [localBusinessName, setLocalBusinessName] = useState("");
  const [completedTaxItems, setCompletedTaxItems] = useState<string[]>([]);

  const { progress, isLoading, isSaving, createProgress, completeStep, uncompleteStep, saveStepNote, updateBusinessName, completeRegistration } =
    useRegistrationProgress(ideaId);

  const { customSteps, isGenerating, isGenerated, generatePath, refreshPath } = useRegistrationPath({
    ideaId: ideaId || "",
    province: selectedProvince || progress?.province || "",
    businessStructure: selectedStructure || progress?.business_structure || "sole_proprietorship",
  });

  const { fees: verifiedFees, isLoading: isLoadingFees } = useBusinessStructureFees(selectedProvince);

  const provinceData = selectedProvince ? getProvinceRegistration(selectedProvince) : null;
  const supportedProvinces = getSupportedProvinces();

  // Get smart recommendation based on user's intake data
  const { recommendedType, explanations } = getStructureRecommendation(collectedData);

  // Load idea details and session collected_data
  useEffect(() => {
    if (!ideaId || !user) return;

    const loadIdea = async () => {
      // Fetch idea with session_id
      const { data: ideaData, error: ideaError } = await supabase
        .from("ft_ideas")
        .select("title, category, session_id")
        .eq("id", ideaId)
        .eq("user_id", user.id)
        .single();

      if (!ideaError && ideaData) {
        setIdea(ideaData);

        // Fetch session's collected_data for personalized recommendations
        const { data: sessionData } = await supabase
          .from("ft_sessions")
          .select("collected_data")
          .eq("id", ideaData.session_id)
          .single();

        if (sessionData?.collected_data) {
          setCollectedData(sessionData.collected_data as Record<string, any>);
        }
      }
      setIsLoadingIdea(false);
    };

    loadIdea();
  }, [ideaId, user]);

  // Initialize from existing progress or profile
  useEffect(() => {
    if (isLoading) return;

    if (progress) {
      setSelectedProvince(progress.province);
      setSelectedStructure(progress.business_structure);
      setWizardStep("registration");
    } else if (profile?.province) {
      const provinceCode = getProvinceCodeFromName(profile.province);
      if (provinceCode && supportedProvinces.includes(provinceCode)) {
        setSelectedProvince(provinceCode);
      }
    }
  }, [progress, profile, isLoading, supportedProvinces]);

  // Auto-generate path when entering registration step
  useEffect(() => {
    if (wizardStep === "registration" && progress && !isGenerated && !isGenerating) {
      generatePath();
    }
  }, [wizardStep, progress, isGenerated, isGenerating, generatePath]);

  // Sync local business name from progress when it loads
  useEffect(() => {
    if (progress?.business_name && localBusinessName === "") {
      setLocalBusinessName(progress.business_name);
    }
  }, [progress?.business_name]);

  // Debounced save - only updates DB after user stops typing
  useEffect(() => {
    if (!progress) return;
    if (localBusinessName === (progress.business_name || "")) return;
    
    const timeoutId = setTimeout(() => {
      updateBusinessName(localBusinessName);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [localBusinessName, progress, updateBusinessName]);

  const getProvinceCodeFromName = (name: string): string | null => {
    const mapping: Record<string, string> = {
      "Ontario": "ON",
      "British Columbia": "BC",
      "Alberta": "AB",
      "Quebec": "QC",
      "Saskatchewan": "SK",
      "Manitoba": "MB",
    };
    return mapping[name] || null;
  };

  const handleStartRegistration = async () => {
    if (!selectedProvince || !selectedStructure) return;

    const result = await createProgress(selectedProvince, selectedStructure);
    if (result) {
      setWizardStep("registration");
    }
  };

  const calculateTotalCost = (): string => {
    if (!provinceData) return "$0";

    let total = 0;
    const structure = provinceData.businessStructures.find(s => s.type === (progress?.business_structure || selectedStructure));

    if (structure) {
      const fee = structure.registrationFee.match(/\$(\d+)/);
      if (fee) total += parseInt(fee[1]);
    }

    provinceData.steps.forEach(step => {
      if (!step.isOptional || progress?.completed_steps.includes(step.id)) {
        const cost = step.cost.match(/\$(\d+)/);
        if (cost) total += parseInt(cost[1]);
      }
    });

    return `$${total}`;
  };

  const calculateProgress = (): number => {
    if (!progress || !provinceData) return 0;
    const requiredSteps = provinceData.steps.filter(s => !s.isOptional);
    const completedRequired = requiredSteps.filter(s => progress.completed_steps.includes(s.id));
    return Math.round((completedRequired.length / requiredSteps.length) * 100);
  };

  if (isLoadingIdea || isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-3xl mx-auto text-center py-12">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Idea Not Found</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't find this business idea in your account.
          </p>
          <Button onClick={() => navigate("/app/ideas")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Ideas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/app/ideas")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          {progress && (
            <Badge variant="outline" className="text-xs">
              {progress.status === "completed" ? "Completed" : "In Progress"}
            </Badge>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Idea context */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">{stripMarkdown(idea.title)}</h1>
              <p className="text-sm text-muted-foreground">
                Registration Guide • {idea.category}
              </p>
            </div>
          </div>
        </div>

        {/* Province Selection Step */}
        {wizardStep === "province" && (
          <div className="space-y-6">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-3" />
              <h2 className="text-xl font-bold text-foreground mb-2">
                Where will you register?
              </h2>
              <p className="text-muted-foreground">
                Business registration requirements vary by province
              </p>
            </div>

            <div className="max-w-sm mx-auto space-y-4">
              <div>
                <Label>Province</Label>
                <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your province" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ON">Ontario</SelectItem>
                    <SelectItem value="BC">British Columbia</SelectItem>
                    <SelectItem value="AB">Alberta</SelectItem>
                    <SelectItem value="QC">Quebec</SelectItem>
                    <SelectItem value="SK">Saskatchewan</SelectItem>
                    <SelectItem value="MB">Manitoba</SelectItem>
                    <SelectItem value="NS" disabled>Nova Scotia (Guide launching Q1 2026)</SelectItem>
                    <SelectItem value="NB" disabled>New Brunswick (Guide launching Q1 2026)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedProvince && !supportedProvinces.includes(selectedProvince) && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        Registration Guide Coming Soon
                      </p>
                      <p className="text-blue-700 dark:text-blue-300">
                        We're currently developing the registration guide for {selectedProvince === 'NS' ? 'Nova Scotia' : 'New Brunswick'}.
                        Expected launch: <strong>Q1 2026</strong>
                      </p>
                      <p className="text-blue-600 dark:text-blue-400 text-xs">
                        In the meantime, you can still generate business ideas and explore other features.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                disabled={!selectedProvince || !supportedProvinces.includes(selectedProvince)}
                onClick={() => setWizardStep("structure")}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Business Structure Step */}
        {wizardStep === "structure" && provinceData && (
          <div className="space-y-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWizardStep("province")}
              className="-ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Change Province
            </Button>

            <BusinessStructureSelector
              structures={provinceData.businessStructures}
              selected={selectedStructure}
              onSelect={setSelectedStructure}
              recommendedType={recommendedType}
              personalizedExplanations={explanations}
              verifiedFees={verifiedFees}
              isLoadingFees={isLoadingFees}
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setWizardStep("province")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleStartRegistration}
                disabled={!selectedStructure || isSaving}
                className="flex-1"
              >
                Start Guide
              </Button>
            </div>
          </div>
        )}

        {/* Registration Steps */}
        {wizardStep === "registration" && provinceData && progress && (
          <div className="space-y-6">
            {/* Progress header */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-bold text-foreground">
                    {provinceData.provinceName} Registration
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {provinceData.businessStructures.find(s => s.type === progress.business_structure)?.label}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">{calculateProgress()}%</p>
                  <p className="text-xs text-muted-foreground">Complete</p>
                </div>
              </div>
              <Progress value={calculateProgress()} className="h-2" />

              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {progress.completed_steps.length}/{provinceData.steps.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Steps Done</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-bold text-foreground">{calculateTotalCost()}</p>
                  <p className="text-xs text-muted-foreground">Est. Cost</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-bold text-foreground">1-2 wks</p>
                  <p className="text-xs text-muted-foreground">Timeline</p>
                </div>
              </div>
            </div>

            {/* Business Name Input */}
            <div className="bg-card border border-border rounded-xl p-4">
              <Label className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" />
                Your Business Name
              </Label>
              <div className="relative">
                <Input
                  placeholder="Enter your chosen business name"
                  value={localBusinessName}
                  onChange={(e) => setLocalBusinessName(e.target.value)}
                />
                {isSaving && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    Saving...
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Track the name you're registering (you'll confirm availability in Step 1)
              </p>
            </div>

            {/* Industry-Specific Requirements (AI Generated) */}
            {(isGenerating || customSteps.length > 0) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-warning" />
                    Industry-Specific Requirements
                  </h3>
                  <div className="flex items-center gap-2">
                    {isGenerating && (
                      <Badge variant="outline" className="text-xs">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Analyzing your business...
                      </Badge>
                    )}
                    {!isGenerating && isGenerated && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={refreshPath}
                        className="text-xs h-7"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Refresh
                      </Button>
                    )}
                  </div>
                </div>
                
                {isGenerating ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : customSteps.length > 0 ? (
                  <div className="space-y-3">
                    {customSteps.map((step, index) => (
                      <IndustryStepCard key={step.id} step={step} stepNumber={index + 1} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-muted/50 rounded-xl p-4 text-center text-sm text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-success" />
                    No additional industry-specific requirements found for your business type.
                  </div>
                )}
              </div>
            )}

            {/* Baseline Registration Steps */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Registration Steps</h3>
              {provinceData.steps.map((step, index) => (
                <RegistrationStepCard
                  key={step.id}
                  step={step}
                  stepNumber={index + 1}
                  isCompleted={progress.completed_steps.includes(step.id)}
                  isCurrent={index === progress.current_step - 1}
                  note={progress.step_notes[step.id]}
                  onComplete={() => {
                    setCurrentStepId(step.id);
                    completeStep(step.id);
                  }}
                  onUncomplete={() => uncompleteStep(step.id)}
                  onSaveNote={(note) => saveStepNote(step.id, note)}
                  isSaving={isSaving}
                />
              ))}
            </div>

            {/* Tax Requirements Checklist */}
            <TaxChecklist
              provinceCode={progress.province}
              businessStructure={progress.business_structure as 'sole_proprietorship' | 'partnership' | 'corporation'}
              completedItems={completedTaxItems}
              onItemToggle={(itemId, completed) => {
                setCompletedTaxItems(prev => 
                  completed ? [...prev, itemId] : prev.filter(id => id !== itemId)
                );
              }}
            />

            {/* Additional Notes */}
            {provinceData.additionalNotes.length > 0 && (
              <div className="bg-muted/50 rounded-xl p-4">
                <h3 className="font-semibold text-foreground mb-2">Important Notes</h3>
                <ul className="space-y-2">
                  {provinceData.additionalNotes.map((note, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Complete Registration */}
            {calculateProgress() === 100 && progress.status !== "completed" && (
              <Button
                onClick={completeRegistration}
                disabled={isSaving}
                className="w-full"
                size="lg"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Mark Registration Complete
              </Button>
            )}

            {progress.status === "completed" && (
              <div className="bg-success/10 border border-success/20 rounded-xl p-4 text-center">
                <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-2" />
                <h3 className="font-bold text-success">Registration Complete!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Congratulations on officially registering your business!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Copilot FAB */}
      {wizardStep === "registration" && ideaId && (
        <RegistrationCopilot
          ideaId={ideaId}
          province={progress?.province}
          businessStructure={progress?.business_structure}
          currentStep={currentStepId}
        />
      )}
    </div>
  );
}
