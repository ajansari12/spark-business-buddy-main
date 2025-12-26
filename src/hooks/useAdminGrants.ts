import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Grant {
  id: string;
  name: string;
  organization: string;
  type: string;
  province: string | null;
  status: string | null;
  description: string | null;
  why_apply: string | null;
  application_url: string;
  amount_min: number | null;
  amount_max: number | null;
  eligibility_notes: string | null;
  eligibility_sectors: string[] | null;
  eligibility_age_min: number | null;
  eligibility_age_max: number | null;
  eligibility_citizen_required: boolean | null;
  eligibility_pr_eligible: boolean | null;
  eligibility_newcomer_max_years: number | null;
  eligibility_indigenous_only: boolean | null;
  deadline: string | null;
  last_verified: string | null;
  verification_notes: string | null;
  verification_source: string | null;
  auto_verified_at: string | null;
  url_status: "accessible" | "broken" | "timeout" | "unchecked" | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface VerificationResult {
  grant_id: string;
  grant_name: string;
  current_status: "open" | "closed" | "unknown";
  confidence: "high" | "medium" | "low";
  sources: string[];
  deadline_found?: string;
  notes: string;
  raw_response?: string;
}

export function useAdminGrants() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [verifyingGrants, setVerifyingGrants] = useState<Set<string>>(new Set());

  // Fetch all grants
  const {
    data: grants,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-grants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("canadian_grants")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Grant[];
    },
  });

  // Calculate days since last manual verification
  const getDaysSinceVerification = (lastVerified: string | null): number | null => {
    if (!lastVerified) return null;
    const diff = Date.now() - new Date(lastVerified).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  // NEW: Calculate days since AI (Perplexity) verification
  const getDaysSinceAutoVerification = (autoVerifiedAt: string | null): number | null => {
    if (!autoVerifiedAt) return null;
    const diff = Date.now() - new Date(autoVerifiedAt).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  // NEW: Check if grant is unverified by Perplexity (never AI-verified or stale)
  const isUnverifiedByPerplexity = (grant: Grant, staleDays: number = 30): boolean => {
    if (!grant.auto_verified_at) return true;
    const days = getDaysSinceAutoVerification(grant.auto_verified_at);
    return days === null || days >= staleDays;
  };

  // Verify single grant
  const verifySingleGrant = async (grantId: string): Promise<VerificationResult | null> => {
    setVerifyingGrants((prev) => new Set(prev).add(grantId));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ft_verify_grants`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ grant_id: grantId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Verification failed");
      }

      const data = await response.json();
      const result = data.results?.[0];

      if (result) {
        toast({
          title: "Verification Complete",
          description: `${result.grant_name}: ${result.current_status} (${result.confidence} confidence)`,
        });
        queryClient.invalidateQueries({ queryKey: ["admin-grants"] });
      }

      return result;
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      return null;
    } finally {
      setVerifyingGrants((prev) => {
        const next = new Set(prev);
        next.delete(grantId);
        return next;
      });
    }
  };

  // Batch verify stale grants (using auto_verified_at)
  const verifyStaleGrants = async (staleDays: number = 30): Promise<VerificationResult[]> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      toast({
        title: "Batch Verification Started",
        description: `Verifying grants not AI-verified in ${staleDays}+ days...`,
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ft_verify_grants`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ batch: true, stale_days: staleDays }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Batch verification failed");
      }

      const data = await response.json();

      toast({
        title: "Batch Verification Complete",
        description: `Verified ${data.verified_count} grants`,
      });

      queryClient.invalidateQueries({ queryKey: ["admin-grants"] });
      return data.results || [];
    } catch (error) {
      toast({
        title: "Batch Verification Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      return [];
    }
  };

  // Verify ALL grants regardless of last verification (with 5-minute timeout)
  const verifyAllGrants = async (): Promise<VerificationResult[]> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      toast({
        title: "Full Verification Started",
        description: `Verifying ALL ${grants?.length || 0} grants with Perplexity AI. This may take 3-4 minutes...`,
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ft_verify_grants`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ verify_all: true }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Full verification failed");
      }

      const data = await response.json();

      toast({
        title: "Full Verification Complete",
        description: `Verified ${data.verified_count} grants with Perplexity AI`,
      });

      queryClient.invalidateQueries({ queryKey: ["admin-grants"] });
      return data.results || [];
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        toast({
          title: "Verification Timed Out",
          description: "The request took too long. Grants may still be processing in the background. Refresh the page to check progress.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Full Verification Failed",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      }
      return [];
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Verify selected grants by IDs
  const verifySelectedGrants = async (grantIds: string[]): Promise<VerificationResult[]> => {
    if (grantIds.length === 0) return [];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      toast({
        title: "Verification Started",
        description: `Verifying ${grantIds.length} selected grant(s) with Perplexity AI...`,
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ft_verify_grants`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ grant_ids: grantIds }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Verification failed");
      }

      const data = await response.json();

      toast({
        title: "Verification Complete",
        description: `Verified ${data.verified_count} grant(s) with Perplexity AI`,
      });

      queryClient.invalidateQueries({ queryKey: ["admin-grants"] });
      return data.results || [];
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      return [];
    }
  };

  // Update grant mutation
  const updateGrant = useMutation({
    mutationFn: async (grant: Partial<Grant> & { id: string }) => {
      const { id, ...updateData } = grant;
      const { error } = await supabase
        .from("canadian_grants")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Grant Updated", description: "Changes saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin-grants"] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Could not update grant",
        variant: "destructive",
      });
    },
  });

  // Add new grant mutation
  const addGrant = useMutation({
    mutationFn: async (grant: Omit<Grant, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase.from("canadian_grants").insert(grant);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Grant Added", description: "New grant created successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin-grants"] });
    },
    onError: (error) => {
      toast({
        title: "Add Failed",
        description: error instanceof Error ? error.message : "Could not add grant",
        variant: "destructive",
      });
    },
  });

  // Delete grant mutation
  const deleteGrant = useMutation({
    mutationFn: async (grantId: string) => {
      const { error } = await supabase
        .from("canadian_grants")
        .delete()
        .eq("id", grantId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Grant Deleted", description: "Grant removed successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin-grants"] });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Could not delete grant",
        variant: "destructive",
      });
    },
  });

  // Bulk update URLs mutation
  const bulkUpdateUrls = useMutation({
    mutationFn: async (updates: { id: string; application_url: string }[]) => {
      const results = await Promise.allSettled(
        updates.map(async ({ id, application_url }) => {
          const { error } = await supabase
            .from("canadian_grants")
            .update({
              application_url,
              url_status: "unchecked",
              updated_at: new Date().toISOString(),
            })
            .eq("id", id);
          if (error) throw error;
          return id;
        })
      );

      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        throw new Error(`Failed to update ${failed.length} grant(s)`);
      }
      return results.length;
    },
    onSuccess: (count) => {
      toast({
        title: "URLs Updated",
        description: `Successfully updated ${count} URL(s). URL status reset to "unchecked".`,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-grants"] });
    },
    onError: (error) => {
      toast({
        title: "Bulk Update Failed",
        description: error instanceof Error ? error.message : "Could not update URLs",
        variant: "destructive",
      });
    },
  });

  return {
    grants,
    isLoading,
    error,
    verifyingGrants,
    getDaysSinceVerification,
    getDaysSinceAutoVerification,
    isUnverifiedByPerplexity,
    verifySingleGrant,
    verifyStaleGrants,
    verifyAllGrants,
    verifySelectedGrants,
    updateGrant,
    addGrant,
    deleteGrant,
    bulkUpdateUrls,
  };
}
