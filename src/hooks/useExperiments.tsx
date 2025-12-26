// ============================================================================
// A/B TESTING INFRASTRUCTURE
// Simple, robust A/B testing for FastTrack features
// ============================================================================

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ============================================================================
// EXPERIMENT DEFINITIONS
// ============================================================================

export interface Experiment {
  id: string;
  name: string;
  description: string;
  variants: ExperimentVariant[];
  status: "draft" | "running" | "paused" | "completed";
  traffic_percentage: number; // 0-100, percentage of users in experiment
  start_date?: string;
  end_date?: string;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  weight: number; // 0-100, relative weight for assignment
  is_control: boolean;
}

export interface UserAssignment {
  experiment_id: string;
  variant_id: string;
  variant_name: string;
  assigned_at: string;
}

// ============================================================================
// PREDEFINED EXPERIMENTS
// ============================================================================

export const EXPERIMENTS: Record<string, Experiment> = {
  // Chat flow experiment
  progressive_profiling: {
    id: "progressive_profiling_v1",
    name: "Progressive Profiling",
    description: "Test progressive value exchange vs traditional intake flow",
    variants: [
      { id: "control", name: "control", weight: 50, is_control: true },
      { id: "progressive", name: "progressive", weight: 50, is_control: false },
    ],
    status: "running",
    traffic_percentage: 100,
  },

  // Viability display experiment
  viability_breakdown: {
    id: "viability_breakdown_v1",
    name: "Viability Breakdown",
    description: "Test transparent viability scoring vs simple score",
    variants: [
      { id: "simple", name: "simple", weight: 50, is_control: true },
      { id: "detailed", name: "detailed", weight: 50, is_control: false },
    ],
    status: "running",
    traffic_percentage: 100,
  },

  // Profile summary experiment
  profile_summary: {
    id: "profile_summary_v1",
    name: "Profile Summary Card",
    description: "Test profile summary before payment vs direct payment",
    variants: [
      { id: "no_summary", name: "no_summary", weight: 50, is_control: true },
      { id: "with_summary", name: "with_summary", weight: 50, is_control: false },
    ],
    status: "running",
    traffic_percentage: 100,
  },

  // Idea chat experiment
  idea_chat: {
    id: "idea_chat_v1",
    name: "Post-Idea Chat",
    description: "Test post-idea conversation feature",
    variants: [
      { id: "disabled", name: "disabled", weight: 50, is_control: true },
      { id: "enabled", name: "enabled", weight: 50, is_control: false },
    ],
    status: "running",
    traffic_percentage: 50, // Only 50% of users in experiment
  },

  // Quick win tracking experiment
  quickwin_tracking: {
    id: "quickwin_tracking_v1",
    name: "Quick Win Tracking",
    description: "Test quick win checklist vs static display",
    variants: [
      { id: "static", name: "static", weight: 50, is_control: true },
      { id: "interactive", name: "interactive", weight: 50, is_control: false },
    ],
    status: "running",
    traffic_percentage: 100,
  },
};

// ============================================================================
// ASSIGNMENT LOGIC
// ============================================================================

// Deterministic hash for consistent assignment
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Assign user to variant deterministically
function assignVariant(
  userId: string,
  experiment: Experiment
): ExperimentVariant | null {
  // Check if user should be in experiment
  const trafficHash = hashString(`${userId}_${experiment.id}_traffic`) % 100;
  if (trafficHash >= experiment.traffic_percentage) {
    return null; // User not in experiment
  }

  // Assign to variant based on weights
  const variantHash = hashString(`${userId}_${experiment.id}_variant`) % 100;
  let cumulative = 0;

  for (const variant of experiment.variants) {
    cumulative += variant.weight;
    if (variantHash < cumulative) {
      return variant;
    }
  }

  // Fallback to control
  return experiment.variants.find((v) => v.is_control) || experiment.variants[0];
}

// ============================================================================
// STORAGE
// ============================================================================

const ASSIGNMENTS_KEY = "ft_experiment_assignments";

function getStoredAssignments(): Record<string, UserAssignment> {
  try {
    const stored = localStorage.getItem(ASSIGNMENTS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function storeAssignment(assignment: UserAssignment): void {
  try {
    const assignments = getStoredAssignments();
    assignments[assignment.experiment_id] = assignment;
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
  } catch {
    // Storage full, ignore
  }
}

// ============================================================================
// HOOK
// ============================================================================

interface UseExperimentResult {
  variant: string | null;
  isControl: boolean;
  isInExperiment: boolean;
  isLoading: boolean;
}

export function useExperiment(experimentKey: string): UseExperimentResult {
  const { user } = useAuth();
  const [result, setResult] = useState<UseExperimentResult>({
    variant: null,
    isControl: true,
    isInExperiment: false,
    isLoading: true,
  });

  useEffect(() => {
    if (!user?.id) {
      setResult({
        variant: null,
        isControl: true,
        isInExperiment: false,
        isLoading: false,
      });
      return;
    }

    const experiment = EXPERIMENTS[experimentKey];
    if (!experiment || experiment.status !== "running") {
      setResult({
        variant: null,
        isControl: true,
        isInExperiment: false,
        isLoading: false,
      });
      return;
    }

    // Check for existing assignment
    const stored = getStoredAssignments();
    const existingAssignment = stored[experiment.id];

    if (existingAssignment) {
      const variant = experiment.variants.find(
        (v) => v.id === existingAssignment.variant_id
      );
      setResult({
        variant: existingAssignment.variant_name,
        isControl: variant?.is_control ?? true,
        isInExperiment: true,
        isLoading: false,
      });
      return;
    }

    // Assign new variant
    const assignedVariant = assignVariant(user.id, experiment);

    if (!assignedVariant) {
      // User not in experiment
      setResult({
        variant: null,
        isControl: true,
        isInExperiment: false,
        isLoading: false,
      });
      return;
    }

    // Store assignment
    const assignment: UserAssignment = {
      experiment_id: experiment.id,
      variant_id: assignedVariant.id,
      variant_name: assignedVariant.name,
      assigned_at: new Date().toISOString(),
    };
    storeAssignment(assignment);

    // Track assignment event
    supabase.from("ft_events").insert({
      user_id: user.id,
      event_name: "experiment_assigned",
      event_data: {
        experiment_id: experiment.id,
        experiment_name: experiment.name,
        variant_id: assignedVariant.id,
        variant_name: assignedVariant.name,
        is_control: assignedVariant.is_control,
      },
    });

    setResult({
      variant: assignedVariant.name,
      isControl: assignedVariant.is_control,
      isInExperiment: true,
      isLoading: false,
    });
  }, [user?.id, experimentKey]);

  return result;
}

// ============================================================================
// CONVERSION TRACKING
// ============================================================================

export function useExperimentConversion(experimentKey: string) {
  const { user } = useAuth();
  const { variant, isInExperiment } = useExperiment(experimentKey);

  const trackConversion = useCallback(
    async (conversionType: string, conversionData?: Record<string, unknown>) => {
      if (!user?.id || !isInExperiment) return;

      const experiment = EXPERIMENTS[experimentKey];
      if (!experiment) return;

      await supabase.from("ft_events").insert({
        user_id: user.id,
        event_name: "experiment_converted",
        event_data: {
          experiment_id: experiment.id,
          experiment_name: experiment.name,
          variant,
          conversion_type: conversionType,
          ...conversionData,
        },
      });
    },
    [user?.id, experimentKey, variant, isInExperiment]
  );

  return { trackConversion };
}

// ============================================================================
// FEATURE FLAG HELPER
// ============================================================================

export function useFeatureFlag(
  experimentKey: string,
  enabledVariants: string[] = []
): boolean {
  const { variant, isInExperiment, isLoading } = useExperiment(experimentKey);

  if (isLoading) return false; // Default to off while loading
  if (!isInExperiment) return false; // Not in experiment

  return enabledVariants.includes(variant || "");
}

// ============================================================================
// CONTEXT FOR GLOBAL ACCESS
// ============================================================================

interface ExperimentsContextValue {
  getExperiment: (key: string) => UseExperimentResult;
  isFeatureEnabled: (key: string, enabledVariants?: string[]) => boolean;
  trackConversion: (
    experimentKey: string,
    conversionType: string,
    data?: Record<string, unknown>
  ) => Promise<void>;
}

const ExperimentsContext = createContext<ExperimentsContextValue | null>(null);

export function ExperimentsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Record<string, UserAssignment>>({});

  // Load assignments on mount
  useEffect(() => {
    setAssignments(getStoredAssignments());
  }, []);

  // Initialize all experiments for user
  useEffect(() => {
    if (!user?.id) return;

    const newAssignments: Record<string, UserAssignment> = { ...assignments };
    let updated = false;

    for (const [key, experiment] of Object.entries(EXPERIMENTS)) {
      if (experiment.status !== "running") continue;
      if (newAssignments[experiment.id]) continue;

      const variant = assignVariant(user.id, experiment);
      if (variant) {
        newAssignments[experiment.id] = {
          experiment_id: experiment.id,
          variant_id: variant.id,
          variant_name: variant.name,
          assigned_at: new Date().toISOString(),
        };
        updated = true;

        // Track assignment
        supabase.from("ft_events").insert({
          user_id: user.id,
          event_name: "experiment_assigned",
          event_data: {
            experiment_id: experiment.id,
            variant_id: variant.id,
            variant_name: variant.name,
          },
        });
      }
    }

    if (updated) {
      localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(newAssignments));
      setAssignments(newAssignments);
    }
  }, [user?.id]);

  const getExperiment = useCallback(
    (key: string): UseExperimentResult => {
      const experiment = EXPERIMENTS[key];
      if (!experiment || experiment.status !== "running") {
        return { variant: null, isControl: true, isInExperiment: false, isLoading: false };
      }

      const assignment = assignments[experiment.id];
      if (!assignment) {
        return { variant: null, isControl: true, isInExperiment: false, isLoading: false };
      }

      const variant = experiment.variants.find((v) => v.id === assignment.variant_id);
      return {
        variant: assignment.variant_name,
        isControl: variant?.is_control ?? true,
        isInExperiment: true,
        isLoading: false,
      };
    },
    [assignments]
  );

  const isFeatureEnabled = useCallback(
    (key: string, enabledVariants: string[] = ["enabled", "treatment", "progressive", "detailed", "with_summary", "interactive"]): boolean => {
      const { variant, isInExperiment } = getExperiment(key);
      if (!isInExperiment) return false;
      return enabledVariants.includes(variant || "");
    },
    [getExperiment]
  );

  const trackConversion = useCallback(
    async (experimentKey: string, conversionType: string, data?: Record<string, unknown>) => {
      if (!user?.id) return;

      const experiment = EXPERIMENTS[experimentKey];
      if (!experiment) return;

      const assignment = assignments[experiment.id];
      if (!assignment) return;

      await supabase.from("ft_events").insert({
        user_id: user.id,
        event_name: "experiment_converted",
        event_data: {
          experiment_id: experiment.id,
          variant: assignment.variant_name,
          conversion_type: conversionType,
          ...data,
        },
      });
    },
    [user?.id, assignments]
  );

  return (
    <ExperimentsContext.Provider value={{ getExperiment, isFeatureEnabled, trackConversion }}>
      {children}
    </ExperimentsContext.Provider>
  );
}

export function useExperiments() {
  const context = useContext(ExperimentsContext);
  if (!context) {
    throw new Error("useExperiments must be used within ExperimentsProvider");
  }
  return context;
}
