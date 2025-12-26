import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AdminFee {
  id: string;
  province_code: string;
  structure_type: string;
  verified_fee: string;
  fee_notes: string | null;
  perplexity_sources: string[] | null;
  last_verified: string | null;
  created_at: string;
  updated_at: string;
}

export function useAdminFees() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isVerifying, setIsVerifying] = useState(false);

  // Fetch all fees
  const {
    data: fees,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-fees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_structure_fees")
        .select("*")
        .order("province_code")
        .order("structure_type");

      if (error) throw error;
      return data as AdminFee[];
    },
  });

  // Calculate days since verification
  const getDaysSinceVerification = (lastVerified: string | null): number | null => {
    if (!lastVerified) return null;
    const diff = Date.now() - new Date(lastVerified).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  // Check if fee is stale (>30 days)
  const isStale = (fee: AdminFee): boolean => {
    const days = getDaysSinceVerification(fee.last_verified);
    return days === null || days >= 30;
  };

  // Batch verify all provinces
  const batchVerifyFees = async (provinceCode?: string) => {
    setIsVerifying(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      toast({
        title: provinceCode ? `Verifying ${provinceCode}...` : "Verifying All Provinces...",
        description: provinceCode 
          ? "Querying Perplexity for current fees..." 
          : "This may take 1-2 minutes for all 6 provinces...",
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ft_batch_verify_fees`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(provinceCode ? { province_code: provinceCode } : {}),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Verification failed");
      }

      const data = await response.json();

      toast({
        title: "Verification Complete",
        description: `Verified ${data.verified_count} fees across ${data.provinces_processed} province(s)`,
      });

      queryClient.invalidateQueries({ queryKey: ["admin-fees"] });
      return data;
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsVerifying(false);
    }
  };

  // Calculate stats
  const stats = {
    totalFees: fees?.length || 0,
    provincesWithFees: new Set(fees?.map(f => f.province_code) || []).size,
    staleFees: fees?.filter(f => isStale(f)).length || 0,
    neverVerified: fees?.filter(f => !f.last_verified).length || 0,
  };

  return {
    fees,
    isLoading,
    error,
    isVerifying,
    getDaysSinceVerification,
    isStale,
    batchVerifyFees,
    stats,
  };
}
