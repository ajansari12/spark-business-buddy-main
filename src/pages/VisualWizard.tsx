import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LocationSelector } from "@/components/wizard/LocationSelector";
import { IndustrySwiper } from "@/components/wizard/IndustrySwiper";
import { ResourceSelector } from "@/components/wizard/ResourceSelector";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, X, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTrackEvent } from "@/hooks/useTrackEvent";
import { toast } from "sonner";
import { getLocalStorage, setLocalStorage, removeLocalStorage } from "@/utils/safeParse";
import { GenerateIdeasResponseSchema, validateOrThrow } from "@/schemas/apiSchemas";
import { canGenerateIdeas } from "@/utils/tierLimits";
import { PaywallModal } from "@/components/PaywallModal";

type WizardStep = "location" | "industries" | "resources" | "generating";

interface WizardData {
  province: string | null;
  city: string | null;
  selectedIndustries: string[];
  budget: number | null;
  timeCommitment: string | null;
  incomeGoal: number | null;
}

const WIZARD_STORAGE_KEY = "spark_wizard_progress";

const VisualWizard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { track } = useTrackEvent();

  const [currentStep, setCurrentStep] = useState<WizardStep>("location");
  const [wizardData, setWizardData] = useState<WizardData>({
    province: profile?.province || null,
    city: profile?.city || null,
    selectedIndustries: [],
    budget: null,
    timeCommitment: null,
    incomeGoal: null,
  });
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Load saved progress from localStorage
  useEffect(() => {
    const savedProgress = getLocalStorage<{ data: WizardData; step: WizardStep } | null>(
      WIZARD_STORAGE_KEY,
      null
    );

    if (savedProgress) {
      setWizardData(savedProgress.data);
      setCurrentStep(savedProgress.step);
      track("wizard_resumed", { step: savedProgress.step, user_id: user?.id });
    }
  }, [user?.id, track]);

  // Save progress to localStorage whenever data changes
  useEffect(() => {
    if (wizardData.province || wizardData.selectedIndustries.length > 0 || wizardData.budget) {
      setLocalStorage(WIZARD_STORAGE_KEY, { data: wizardData, step: currentStep });
    }
  }, [wizardData, currentStep]);

  // Track wizard started
  useEffect(() => {
    track("wizard_started", { user_id: user?.id });
  }, [track, user?.id]);

  const getStepNumber = (step: WizardStep): number => {
    const steps = { location: 1, industries: 2, resources: 3, generating: 4 };
    return steps[step];
  };

  const getProgress = (): number => {
    const stepNumber = getStepNumber(currentStep);
    return (stepNumber / 3) * 100;
  };

  const handleLocationComplete = (province: string, city: string) => {
    setWizardData((prev) => ({ ...prev, province, city }));
    track("wizard_step_completed", { step: "location", province, city });
    setCurrentStep("industries");
  };

  const handleIndustriesComplete = (selectedIndustries: string[]) => {
    setWizardData((prev) => ({ ...prev, selectedIndustries }));
    track("wizard_step_completed", {
      step: "industries",
      count: selectedIndustries.length,
      industries: selectedIndustries,
    });
    setCurrentStep("resources");
  };

  const handleResourcesComplete = async (data: {
    budget: number;
    timeCommitment: string;
    incomeGoal: number;
  }) => {
    setWizardData((prev) => ({
      ...prev,
      budget: data.budget,
      timeCommitment: data.timeCommitment,
      incomeGoal: data.incomeGoal,
    }));

    track("wizard_step_completed", { step: "resources", ...data });
    setCurrentStep("generating");

    // Generate business ideas
    await generateIdeas({
      ...wizardData,
      ...data,
    });
  };

  const generateIdeas = async (data: WizardData, isRetry: boolean = false) => {
    if (!user) {
      toast.error("Please sign in to continue");
      navigate("/auth", { state: { returnTo: "/wizard" } });
      return;
    }

    // Check tier limits
    const tier = profile?.subscription_tier || 'free';
    const currentIdeasCount = profile?.ideas_generated || 0;
    const limitCheck = canGenerateIdeas(tier, currentIdeasCount);

    if (!limitCheck.allowed) {
      track("paywall_shown", {
        reason: "ideas_limit",
        tier,
        current_count: currentIdeasCount,
        limit: limitCheck.limit,
      });
      setShowPaywall(true);
      setCurrentStep("resources");
      return;
    }

    try {
      if (isRetry) {
        setIsRetrying(true);
      }

      track("ideas_generation_started", {
        source: "visual_wizard",
        data_collected: data,
        retry_attempt: retryCount,
      });

      // Create a new chat session
      const { data: sessionData, error: sessionError } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: user.id,
          status: "ready_to_generate",
          extracted_data: {
            province: data.province,
            city: data.city,
            preferred_industries: data.selectedIndustries,
            budget_min: data.budget ? data.budget * 0.8 : null,
            budget_max: data.budget,
            time_commitment_hours: data.timeCommitment,
            income_goal: data.incomeGoal,
          },
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Call the generate ideas function with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 60000)
      );

      const generatePromise = supabase.functions.invoke("ft_generate_ideas", {
        body: {
          session_id: sessionData.id,
          user_id: user.id,
          profile_data: {
            province: data.province,
            city: data.city,
          },
          extracted_data: sessionData.extracted_data,
        },
      });

      const { data: ideasResponse, error: ideasError } = await Promise.race([
        generatePromise,
        timeoutPromise,
      ]) as any;

      if (ideasError) throw ideasError;

      // Validate API response
      const validatedResponse = validateOrThrow(
        GenerateIdeasResponseSchema,
        ideasResponse,
        'Invalid response from idea generation service'
      );

      track("ideas_generated", {
        session_id: sessionData.id,
        count: validatedResponse.ideas.length,
        source: "visual_wizard",
        retry_attempt: retryCount,
      });

      toast.success(`Generated ${validatedResponse.ideas.length} business ideas!`);

      // Clear saved progress on success
      removeLocalStorage(WIZARD_STORAGE_KEY);
      setRetryCount(0);
      setIsRetrying(false);

      // Navigate to results
      navigate("/results", {
        state: {
          sessionId: sessionData.id,
          extractedData: sessionData.extracted_data,
        },
      });
    } catch (error: any) {
      console.error("Error generating ideas:", error);
      setIsRetrying(false);

      const errorMessage = error.message || "Unknown error";
      track("ideas_generation_failed", {
        error: errorMessage,
        source: "visual_wizard",
        retry_attempt: retryCount,
      });

      // Show retry option if under 3 attempts
      if (retryCount < 3) {
        toast.error(
          <div className="flex flex-col gap-2">
            <p>Failed to generate ideas: {errorMessage}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRetry(data)}
              className="w-fit"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry ({3 - retryCount} attempts left)
            </Button>
          </div>,
          { duration: 10000 }
        );
      } else {
        toast.error(
          "Failed to generate ideas after multiple attempts. Please try again later or contact support."
        );
      }

      setCurrentStep("resources");
    }
  };

  const handleRetry = async (data: WizardData) => {
    setRetryCount((prev) => prev + 1);
    setCurrentStep("generating");
    await generateIdeas(data, true);
  };

  const handleBack = () => {
    const stepOrder: WizardStep[] = ["location", "industries", "resources"];
    const currentIndex = stepOrder.indexOf(currentStep);

    if (currentIndex > 0) {
      track("wizard_back_clicked", { from_step: currentStep });
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleExit = () => {
    track("wizard_exited", { at_step: currentStep });
    navigate("/");
  };

  const handleSaveAndExit = () => {
    // Progress is already saved via useEffect
    toast.success("Progress saved! You can resume anytime.");
    track("wizard_saved", { at_step: currentStep, data: wizardData });
    navigate("/");
  };

  const clearProgress = () => {
    removeLocalStorage(WIZARD_STORAGE_KEY);
    track("wizard_progress_cleared", { at_step: currentStep });
  };

  // Page variants for smooth transitions
  const pageVariants = {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with progress */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {currentStep !== "location" && currentStep !== "generating" && (
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
            </div>

            <div className="text-center flex-1">
              <p className="text-sm font-medium">
                {currentStep === "location" && "Step 1 of 3: Location"}
                {currentStep === "industries" && "Step 2 of 3: Interests"}
                {currentStep === "resources" && "Step 3 of 3: Resources"}
                {currentStep === "generating" && (isRetrying ? "Retrying..." : "Generating Ideas...")}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {currentStep !== "generating" && (
                <Button variant="ghost" size="sm" onClick={handleSaveAndExit}>
                  Save & Exit
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleExit}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Progress value={getProgress()} className="h-2" />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto">
        <AnimatePresence mode="wait">
          {currentStep === "location" && (
            <motion.div
              key="location"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <LocationSelector
                onComplete={handleLocationComplete}
                initialProvince={wizardData.province || undefined}
                initialCity={wizardData.city || undefined}
              />
            </motion.div>
          )}

          {currentStep === "industries" && (
            <motion.div
              key="industries"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <IndustrySwiper
                onComplete={handleIndustriesComplete}
                initialSelections={wizardData.selectedIndustries}
              />
            </motion.div>
          )}

          {currentStep === "resources" && (
            <motion.div
              key="resources"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <ResourceSelector
                onComplete={handleResourcesComplete}
                initialBudget={wizardData.budget || undefined}
                initialTimeCommitment={wizardData.timeCommitment || undefined}
                initialIncomeGoal={wizardData.incomeGoal || undefined}
              />
            </motion.div>
          )}

          {currentStep === "generating" && (
            <motion.div
              key="generating"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center min-h-[60vh] px-4"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-24 h-24 mb-8"
              >
                <div className="text-8xl">✨</div>
              </motion.div>

              <h2 className="text-3xl font-bold mb-4 text-center">
                Generating Your Business Ideas
              </h2>

              <p className="text-muted-foreground text-center max-w-md mb-8">
                Our AI is analyzing market trends in {wizardData.city}, {wizardData.province} and
                creating personalized business ideas just for you...
              </p>

              <div className="flex gap-2 mb-4">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                  className="w-3 h-3 rounded-full bg-primary"
                />
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  className="w-3 h-3 rounded-full bg-primary"
                />
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                  className="w-3 h-3 rounded-full bg-primary"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Paywall Modal */}
      <PaywallModal
        open={showPaywall}
        onOpenChange={setShowPaywall}
        reason="ideas_limit"
        currentTier={profile?.subscription_tier || 'free'}
        limitReached={profile?.ideas_generated || 0}
      />
    </div>
  );
};

export default VisualWizard;
