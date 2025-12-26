import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface VerifiedFee {
  structure_type: string;
  verified_fee: string;
  fee_notes: string | null;
  last_verified: string | null;
  perplexity_sources: string[] | null;
}

interface UseBusinessStructureFeesReturn {
  fees: Record<string, VerifiedFee>;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useBusinessStructureFees(provinceCode: string): UseBusinessStructureFeesReturn {
  const [fees, setFees] = useState<Record<string, VerifiedFee>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFees = useCallback(async () => {
    if (!provinceCode) {
      setFees({});
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("business_structure_fees")
        .select("structure_type, verified_fee, fee_notes, last_verified, perplexity_sources")
        .eq("province_code", provinceCode);

      if (fetchError) {
        throw fetchError;
      }

      const feesMap: Record<string, VerifiedFee> = {};
      if (data) {
        data.forEach((fee) => {
          feesMap[fee.structure_type] = {
            structure_type: fee.structure_type,
            verified_fee: fee.verified_fee,
            fee_notes: fee.fee_notes,
            last_verified: fee.last_verified,
            perplexity_sources: fee.perplexity_sources,
          };
        });
      }
      setFees(feesMap);
    } catch (err) {
      console.error("Error fetching business structure fees:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch fees");
    } finally {
      setIsLoading(false);
    }
  }, [provinceCode]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  return {
    fees,
    isLoading,
    error,
    refetch: fetchFees,
  };
}
