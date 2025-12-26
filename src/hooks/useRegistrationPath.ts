import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CustomStep {
  id: string;
  title: string;
  description: string;
  cost_estimate?: string;
  time_estimate?: string;
  government_url?: string;
  is_industry_specific: boolean;
  is_baseline: boolean;
  source_verified?: boolean;
  perplexity_sources?: string[];
}

interface UseRegistrationPathOptions {
  ideaId: string;
  province: string;
  businessStructure: string;
}

export function useRegistrationPath({
  ideaId,
  province,
  businessStructure,
}: UseRegistrationPathOptions) {
  const [customSteps, setCustomSteps] = useState<CustomStep[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePath = useCallback(async (forceRefresh = false) => {
    if (!ideaId || !province || !businessStructure) return;

    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "ft_generate_registration_path",
        {
          body: {
            idea_id: ideaId,
            province,
            business_structure: businessStructure,
            force_refresh: forceRefresh,
          },
        }
      );

      if (fnError) throw fnError;

      if (data?.error) {
        setError(data.error);
        return;
      }

      setCustomSteps(data.custom_steps || []);
      setIsGenerated(true);

      return data;
    } catch (err) {
      console.error("Error generating registration path:", err);
      setError(err instanceof Error ? err.message : "Failed to generate path");
    } finally {
      setIsGenerating(false);
    }
  }, [ideaId, province, businessStructure]);

  const refreshPath = useCallback(async () => {
    setIsGenerated(false);
    return generatePath(true);
  }, [generatePath]);

  return {
    customSteps,
    isGenerating,
    isGenerated,
    error,
    generatePath,
    refreshPath,
  };
}
