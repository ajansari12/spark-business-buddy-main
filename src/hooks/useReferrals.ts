import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  created_at: string;
}

interface Referral {
  id: string;
  referrer_id: string;
  referred_email: string;
  referred_user_id: string | null;
  status: string;
  reward_type: string | null;
  reward_amount: number | null;
  created_at: string;
  converted_at: string | null;
}

interface ReferralStats {
  invitesSent: number;
  signups: number;
  creditsEarned: number;
  nextRewardAt: number;
}

const REWARD_TIERS = [
  { referrals: 1, reward: "$5 credit", type: "credit" },
  { referrals: 3, reward: "Free regeneration", type: "feature" },
  { referrals: 5, reward: "Premium report", type: "report" },
  { referrals: 10, reward: "Lifetime access", type: "lifetime" },
];

export const useReferrals = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch or create referral code
  const { 
    data: referralCode, 
    isLoading: isLoadingCode,
    error: codeError,
    refetch: refetchCode,
  } = useQuery<ReferralCode | null>({
    queryKey: ["referral-code", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Try to get existing code
      const { data: existing, error: fetchError } = await supabase
        .from("ft_referral_codes")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      
      if (existing) return existing as ReferralCode;

      // Create new code if doesn't exist
      const newCode = generateCode();
      const { data: created, error: createError } = await supabase
        .from("ft_referral_codes")
        .insert({ user_id: user.id, code: newCode })
        .select()
        .single();

      if (createError) throw createError;
      return created as ReferralCode;
    },
    enabled: !!user?.id,
  });

  // Fetch referrals
  const { 
    data: referrals = [], 
    isLoading: isLoadingReferrals,
    error: referralsError,
    refetch: refetchReferrals,
  } = useQuery<Referral[]>({
    queryKey: ["referrals", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("ft_referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Referral[];
    },
    enabled: !!user?.id,
  });

  // Calculate stats
  const stats: ReferralStats = {
    invitesSent: referrals.length,
    signups: referrals.filter((r) => r.status === "converted").length,
    creditsEarned: referrals
      .filter((r) => r.reward_amount)
      .reduce((sum, r) => sum + (r.reward_amount || 0), 0),
    nextRewardAt: calculateNextReward(referrals.filter((r) => r.status === "converted").length),
  };

  // Send invite mutation
  const sendInvite = useMutation({
    mutationFn: async (email: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      if (!referralCode?.code) throw new Error("Referral code not ready");

      // Check for duplicate email
      const existingInvite = referrals.find(
        (r) => r.referred_email.toLowerCase() === email.toLowerCase()
      );
      if (existingInvite) {
        throw new Error("You've already invited this email address");
      }

      // Create the referral record
      const { data, error } = await supabase
        .from("ft_referrals")
        .insert({
          referrer_id: user.id,
          referred_email: email,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Send the referral email via edge function
      const referralLink = `${window.location.origin}/ref/${referralCode.code}`;
      const { error: emailError } = await supabase.functions.invoke("ft_send_referral_invite", {
        body: {
          to_email: email,
          referral_link: referralLink,
          referrer_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "A friend",
        },
      });

      if (emailError) {
        console.error("Failed to send referral email:", emailError);
        // Don't throw - the invite was created, just email failed
        toast.warning("Invite saved but email delivery failed. They can still use your link!");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals", user?.id] });
      toast.success("Invite sent!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send invite");
      console.error(error);
    },
  });

  // Combined error state
  const error = codeError || referralsError;

  // Refetch all data
  const refetch = () => {
    refetchCode();
    refetchReferrals();
  };

  return {
    referralCode: referralCode?.code || null,
    referralLink: referralCode?.code
      ? `${window.location.origin}/ref/${referralCode.code}`
      : null,
    referrals,
    stats,
    rewardTiers: REWARD_TIERS,
    isLoading: isLoadingCode || isLoadingReferrals,
    error,
    refetch,
    sendInvite: sendInvite.mutate,
    isSending: sendInvite.isPending,
  };
};

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function calculateNextReward(convertedCount: number): number {
  const tiers = [1, 3, 5, 10];
  for (const tier of tiers) {
    if (convertedCount < tier) {
      return tier - convertedCount;
    }
  }
  return 0;
}
