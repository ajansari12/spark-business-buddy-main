/**
 * Referral Reward Fulfillment System
 * Handles automatic reward processing when referrals are completed
 */

import { supabase } from '@/integrations/supabase/client';

export interface ReferralReward {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  reward_amount: number;
  reward_type: 'credits' | 'discount' | 'free_month';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processed_at?: string;
  error_message?: string;
}

const REWARD_AMOUNTS = {
  free_tier_referral: 10, // $10 credit for free user referral
  paid_tier_referral: 25, // $25 credit for paid user referral
  first_referral_bonus: 5, // Extra $5 for first successful referral
};

/**
 * Process pending referral rewards
 * Called when a referred user completes signup or makes first payment
 */
export async function processReferralReward(
  referralId: string,
  referredUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get referral details
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select('*')
      .eq('id', referralId)
      .single();

    if (referralError) throw referralError;
    if (!referral) throw new Error('Referral not found');

    // Check if reward already processed
    if (referral.status === 'rewarded') {
      return { success: true }; // Already processed
    }

    // Get referred user's subscription status
    const { data: referredProfile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', referredUserId)
      .single();

    if (profileError) throw profileError;

    // Calculate reward amount
    let rewardAmount = REWARD_AMOUNTS.free_tier_referral;
    if (referredProfile.subscription_tier === 'pro' || referredProfile.subscription_tier === 'enterprise') {
      rewardAmount = REWARD_AMOUNTS.paid_tier_referral;
    }

    // Check if this is referrer's first successful referral
    const { data: previousReferrals, error: prevError } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', referral.referrer_id)
      .eq('status', 'rewarded');

    if (prevError) throw prevError;

    // Add first referral bonus
    if (!previousReferrals || previousReferrals.length === 0) {
      rewardAmount += REWARD_AMOUNTS.first_referral_bonus;
    }

    // Update referrer's credits
    const { error: updateError } = await supabase.rpc('add_user_credits', {
      user_id: referral.referrer_id,
      amount: rewardAmount,
    });

    if (updateError) throw updateError;

    // Mark referral as rewarded
    const { error: statusError } = await supabase
      .from('referrals')
      .update({
        status: 'rewarded',
        reward_amount: rewardAmount,
        rewarded_at: new Date().toISOString(),
      })
      .eq('id', referralId);

    if (statusError) throw statusError;

    // Send notification email to referrer
    await sendRewardNotification(referral.referrer_id, rewardAmount);

    // Track analytics
    if (window.gtag) {
      window.gtag('event', 'referral_reward_processed', {
        referrer_id: referral.referrer_id,
        referred_user_id: referredUserId,
        reward_amount: rewardAmount,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error processing referral reward:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send email notification about reward
 */
async function sendRewardNotification(userId: string, amount: number): Promise<void> {
  try {
    await supabase.functions.invoke('send-email', {
      body: {
        to: userId,
        template: 'referral_reward',
        data: {
          reward_amount: amount,
          currency: 'CAD',
        },
      },
    });
  } catch (error) {
    console.error('Error sending reward notification:', error);
    // Don't throw - reward was still processed
  }
}

/**
 * Check and process all pending referral rewards for a user
 * Useful for batch processing or recovery
 */
export async function processPendingRewards(userId: string): Promise<number> {
  try {
    // Get all completed but unrewarded referrals
    const { data: pendingReferrals, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId)
      .eq('status', 'completed')
      .is('rewarded_at', null);

    if (error) throw error;
    if (!pendingReferrals || pendingReferrals.length === 0) return 0;

    let processedCount = 0;

    for (const referral of pendingReferrals) {
      if (referral.referred_user_id) {
        const result = await processReferralReward(referral.id, referral.referred_user_id);
        if (result.success) {
          processedCount++;
        }
      }
    }

    return processedCount;
  } catch (error) {
    console.error('Error processing pending rewards:', error);
    return 0;
  }
}

/**
 * Get referral statistics for a user
 */
export async function getReferralStats(userId: string) {
  try {
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId);

    if (error) throw error;

    const stats = {
      total: referrals?.length || 0,
      pending: referrals?.filter((r) => r.status === 'pending').length || 0,
      completed: referrals?.filter((r) => r.status === 'completed').length || 0,
      rewarded: referrals?.filter((r) => r.status === 'rewarded').length || 0,
      totalEarned: referrals
        ?.filter((r) => r.status === 'rewarded')
        .reduce((sum, r) => sum + (r.reward_amount || 0), 0) || 0,
      pendingRewards: referrals
        ?.filter((r) => r.status === 'completed' && !r.rewarded_at).length || 0,
    };

    return { success: true, stats };
  } catch (error) {
    console.error('Error getting referral stats:', error);
    return {
      success: false,
      stats: {
        total: 0,
        pending: 0,
        completed: 0,
        rewarded: 0,
        totalEarned: 0,
        pendingRewards: 0,
      },
    };
  }
}

/**
 * Validate referral code
 */
export async function validateReferralCode(code: string): Promise<{
  valid: boolean;
  referrerId?: string;
  error?: string;
}> {
  try {
    // Get user by referral code
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('referral_code', code)
      .single();

    if (error || !profile) {
      return { valid: false, error: 'Invalid referral code' };
    }

    return {
      valid: true,
      referrerId: profile.id,
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Error validating referral code',
    };
  }
}

/**
 * Create referral record
 */
export async function createReferral(
  referrerId: string,
  referredEmail: string
): Promise<{ success: boolean; referralId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referred_email: referredEmail,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      referralId: data.id,
    };
  } catch (error) {
    console.error('Error creating referral:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
