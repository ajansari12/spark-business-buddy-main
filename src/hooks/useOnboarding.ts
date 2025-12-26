import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface OnboardingData {
  fullName: string;
  province: string;
  city: string;
  phone: string;
}

export const useOnboarding = (userId: string | undefined, onComplete: () => void) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    fullName: "",
    province: "",
    city: "",
    phone: "",
  });
  const { toast } = useToast();

  const updateData = (field: keyof OnboardingData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const completeOnboarding = async (skipPhone = false) => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.fullName,
          province: data.province,
          city: data.city,
          phone: skipPhone ? null : data.phone || null,
          onboarding_complete: true,
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Welcome aboard!",
        description: "Your profile is all set up.",
      });
      
      onComplete();
    } catch (error) {
      console.error("Onboarding error:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    step,
    data,
    isLoading,
    updateData,
    nextStep,
    prevStep,
    completeOnboarding,
  };
};
