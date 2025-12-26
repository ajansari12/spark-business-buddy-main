import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ActiveRegistration {
  id: string;
  idea_id: string;
  idea_title: string;
  province: string;
  business_structure: string;
  completed_steps: string[];
  total_steps: number;
  updated_at: string;
}

export function useActiveRegistrations() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<ActiveRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRegistrations = useCallback(async () => {
    if (!user) {
      setRegistrations([]);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch in-progress registrations with idea titles
      const { data, error } = await supabase
        .from("ft_registration_progress")
        .select(`
          id,
          idea_id,
          province,
          business_structure,
          completed_steps,
          updated_at,
          ft_ideas!inner(title)
        `)
        .eq("user_id", user.id)
        .eq("status", "in_progress")
        .order("updated_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching registrations:", error);
        setRegistrations([]);
        return;
      }

      // Get step counts per province
      const { getProvinceRegistration } = await import("@/data/provinceRegistration");

      // Type for the joined query result
      type RegistrationWithIdea = {
        id: string;
        idea_id: string;
        province: string;
        business_structure: string;
        completed_steps: unknown;
        updated_at: string;
        ft_ideas: { title: string } | null;
      };

      const mapped: ActiveRegistration[] = (data as RegistrationWithIdea[] || []).map((reg) => {
        const provinceData = getProvinceRegistration(reg.province);
        return {
          id: reg.id,
          idea_id: reg.idea_id,
          idea_title: reg.ft_ideas?.title || "Untitled",
          province: reg.province,
          business_structure: reg.business_structure,
          completed_steps: Array.isArray(reg.completed_steps) ? reg.completed_steps as string[] : [],
          total_steps: provinceData?.steps.length || 0,
          updated_at: reg.updated_at,
        };
      });

      setRegistrations(mapped);
    } catch (err) {
      console.error("Failed to fetch registrations:", err);
      setRegistrations([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  return { registrations, isLoading, refetch: fetchRegistrations };
}
