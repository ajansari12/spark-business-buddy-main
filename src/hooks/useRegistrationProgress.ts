import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RegistrationProgress, BusinessStructureType } from "@/types/registration";
import { toast } from "sonner";

export function useRegistrationProgress(ideaId: string | undefined) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<RegistrationProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing progress
  useEffect(() => {
    if (!user || !ideaId) {
      setIsLoading(false);
      return;
    }

    const loadProgress = async () => {
      try {
        const { data, error } = await supabase
          .from("ft_registration_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("idea_id", ideaId)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setProgress({
            ...data,
            completed_steps: (data.completed_steps as string[]) || [],
            step_notes: (data.step_notes as Record<string, string>) || {},
            business_structure: data.business_structure as BusinessStructureType,
            status: data.status as "in_progress" | "completed" | "abandoned",
          });
        }
      } catch (error) {
        console.error("Error loading registration progress:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [user, ideaId]);

  // Create new progress
  const createProgress = useCallback(async (
    province: string,
    businessStructure: BusinessStructureType
  ) => {
    if (!user || !ideaId) return null;

    setIsSaving(true);
    try {
      const newProgress = {
        user_id: user.id,
        idea_id: ideaId,
        province,
        business_structure: businessStructure,
        current_step: 1,
        completed_steps: [],
        step_notes: {},
        status: "in_progress" as const,
      };

      const { data, error } = await supabase
        .from("ft_registration_progress")
        .insert(newProgress)
        .select()
        .single();

      if (error) throw error;

      const progressData: RegistrationProgress = {
        ...data,
        completed_steps: [],
        step_notes: {},
        business_structure: data.business_structure as BusinessStructureType,
        status: data.status as "in_progress" | "completed" | "abandoned",
      };

      setProgress(progressData);
      toast.success("Registration guide started!");
      return progressData;
    } catch (error) {
      console.error("Error creating registration progress:", error);
      toast.error("Failed to start registration guide");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [user, ideaId]);

  // Mark step as complete
  const completeStep = useCallback(async (stepId: string) => {
    if (!progress) return;

    const updatedSteps = [...progress.completed_steps];
    if (!updatedSteps.includes(stepId)) {
      updatedSteps.push(stepId);
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("ft_registration_progress")
        .update({
          completed_steps: updatedSteps,
          current_step: progress.current_step + 1,
        })
        .eq("id", progress.id);

      if (error) throw error;

      setProgress({
        ...progress,
        completed_steps: updatedSteps,
        current_step: progress.current_step + 1,
      });
      
      toast.success("Step completed!");
    } catch (error) {
      console.error("Error completing step:", error);
      toast.error("Failed to save progress");
    } finally {
      setIsSaving(false);
    }
  }, [progress]);

  // Uncomplete step
  const uncompleteStep = useCallback(async (stepId: string) => {
    if (!progress) return;

    const updatedSteps = progress.completed_steps.filter(id => id !== stepId);

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("ft_registration_progress")
        .update({
          completed_steps: updatedSteps,
        })
        .eq("id", progress.id);

      if (error) throw error;

      setProgress({
        ...progress,
        completed_steps: updatedSteps,
      });
    } catch (error) {
      console.error("Error uncompleting step:", error);
      toast.error("Failed to save progress");
    } finally {
      setIsSaving(false);
    }
  }, [progress]);

  // Save note for step
  const saveStepNote = useCallback(async (stepId: string, note: string) => {
    if (!progress) return;

    const updatedNotes = { ...progress.step_notes, [stepId]: note };

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("ft_registration_progress")
        .update({
          step_notes: updatedNotes,
        })
        .eq("id", progress.id);

      if (error) throw error;

      setProgress({
        ...progress,
        step_notes: updatedNotes,
      });
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note");
    } finally {
      setIsSaving(false);
    }
  }, [progress]);

  // Update business name
  const updateBusinessName = useCallback(async (name: string) => {
    if (!progress) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("ft_registration_progress")
        .update({ business_name: name })
        .eq("id", progress.id);

      if (error) throw error;

      setProgress({ ...progress, business_name: name });
    } catch (error) {
      console.error("Error updating business name:", error);
      toast.error("Failed to save business name");
    } finally {
      setIsSaving(false);
    }
  }, [progress]);

  // Mark registration as complete
  const completeRegistration = useCallback(async () => {
    if (!progress) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("ft_registration_progress")
        .update({ status: "completed" })
        .eq("id", progress.id);

      if (error) throw error;

      setProgress({ ...progress, status: "completed" });
      toast.success("Congratulations! Registration guide completed!");
    } catch (error) {
      console.error("Error completing registration:", error);
      toast.error("Failed to mark as complete");
    } finally {
      setIsSaving(false);
    }
  }, [progress]);

  return {
    progress,
    isLoading,
    isSaving,
    createProgress,
    completeStep,
    uncompleteStep,
    saveStepNote,
    updateBusinessName,
    completeRegistration,
  };
}
