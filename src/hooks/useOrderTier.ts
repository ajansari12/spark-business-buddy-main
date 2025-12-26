import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type OrderTier = "starter" | "complete" | "vip" | null;

export function useOrderTier(sessionId?: string) {
  const { user } = useAuth();
  const [tier, setTier] = useState<OrderTier>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrderTier = async () => {
      if (!user) {
        setTier(null);
        setIsLoading(false);
        return;
      }

      try {
        // Build query - if sessionId provided, filter by it
        let query = supabase
          .from("ft_orders")
          .select("tier, tier_name")
          .eq("user_id", user.id)
          .eq("status", "paid")
          .order("created_at", { ascending: false })
          .limit(1);

        if (sessionId) {
          query = query.eq("session_id", sessionId);
        }

        const { data, error } = await query.single();

        if (error || !data) {
          // No paid order found, default to starter for testing
          // In production, this would be null
          setTier("starter");
        } else {
          // Use tier_name if available, fallback to tier field
          const tierValue = (data.tier_name || data.tier || "starter") as string;
          
          // Normalize tier values
          if (tierValue.includes("tier1") || tierValue === "starter") {
            setTier("starter");
          } else if (tierValue.includes("tier2") || tierValue === "complete") {
            setTier("complete");
          } else if (tierValue.includes("tier3") || tierValue === "vip") {
            setTier("vip");
          } else {
            setTier("starter");
          }
        }
      } catch (error) {
        console.error("Error fetching order tier:", error);
        setTier("starter"); // Default for testing
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderTier();
  }, [user, sessionId]);

  // Helper to check if user has access to a tier's features
  const hasAccess = (requiredTier: OrderTier): boolean => {
    if (!tier || !requiredTier) return false;
    
    const tierRank: Record<NonNullable<OrderTier>, number> = {
      starter: 1,
      complete: 2,
      vip: 3,
    };
    
    return tierRank[tier] >= tierRank[requiredTier];
  };

  return {
    tier,
    isLoading,
    hasAccess,
    isComplete: tier === "complete" || tier === "vip",
    isVip: tier === "vip",
  };
}
