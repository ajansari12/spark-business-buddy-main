/**
 * Payment Tier Limits and Validation
 * Defines limits for each subscription tier and provides validation functions
 */

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface TierLimits {
  ideas_per_month: number;
  documents_per_month: number;
  pdf_exports: boolean;
  word_exports: boolean;
  priority_support: boolean;
  custom_templates: boolean;
  api_access: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    ideas_per_month: 5,
    documents_per_month: 3,
    pdf_exports: true,
    word_exports: false,
    priority_support: false,
    custom_templates: false,
    api_access: false,
  },
  pro: {
    ideas_per_month: -1, // Unlimited
    documents_per_month: -1, // Unlimited
    pdf_exports: true,
    word_exports: true,
    priority_support: true,
    custom_templates: true,
    api_access: false,
  },
  enterprise: {
    ideas_per_month: -1, // Unlimited
    documents_per_month: -1, // Unlimited
    pdf_exports: true,
    word_exports: true,
    priority_support: true,
    custom_templates: true,
    api_access: true,
  },
};

/**
 * Check if user can generate more ideas
 */
export const canGenerateIdeas = (
  tier: SubscriptionTier,
  currentCount: number
): { allowed: boolean; limit: number; remaining: number } => {
  const limit = TIER_LIMITS[tier].ideas_per_month;

  if (limit === -1) {
    return { allowed: true, limit: -1, remaining: -1 };
  }

  const remaining = Math.max(0, limit - currentCount);
  return {
    allowed: remaining > 0,
    limit,
    remaining,
  };
};

/**
 * Check if user can generate more documents
 */
export const canGenerateDocuments = (
  tier: SubscriptionTier,
  currentCount: number
): { allowed: boolean; limit: number; remaining: number } => {
  const limit = TIER_LIMITS[tier].documents_per_month;

  if (limit === -1) {
    return { allowed: true, limit: -1, remaining: -1 };
  }

  const remaining = Math.max(0, limit - currentCount);
  return {
    allowed: remaining > 0,
    limit,
    remaining,
  };
};

/**
 * Check if user has access to a specific feature
 */
export const hasFeatureAccess = (
  tier: SubscriptionTier,
  feature: keyof TierLimits
): boolean => {
  const value = TIER_LIMITS[tier][feature];
  return typeof value === 'boolean' ? value : value !== 0;
};

/**
 * Get user's monthly usage period
 * Returns start and end dates of current billing period
 */
export const getCurrentBillingPeriod = (
  accountCreatedAt: Date
): { start: Date; end: Date } => {
  const now = new Date();
  const dayOfMonth = accountCreatedAt.getDate();

  // Calculate current period start
  const periodStart = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);

  // If we haven't reached the billing day this month, use last month
  if (periodStart > now) {
    periodStart.setMonth(periodStart.getMonth() - 1);
  }

  // Calculate period end (one month later)
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  periodEnd.setSeconds(periodEnd.getSeconds() - 1); // Last second of period

  return { start: periodStart, end: periodEnd };
};

/**
 * Get tier display information
 */
export const getTierInfo = (tier: SubscriptionTier) => {
  const info = {
    free: {
      name: 'Free',
      color: 'text-gray-600',
      badge: 'Free',
    },
    pro: {
      name: 'Pro',
      color: 'text-primary',
      badge: 'Pro',
    },
    enterprise: {
      name: 'Enterprise',
      color: 'text-purple-600',
      badge: 'Enterprise',
    },
  };

  return info[tier];
};

/**
 * Format limit display (handles unlimited)
 */
export const formatLimit = (limit: number): string => {
  return limit === -1 ? 'Unlimited' : limit.toString();
};

/**
 * Calculate usage percentage
 */
export const getUsagePercentage = (current: number, limit: number): number => {
  if (limit === -1) return 0; // Unlimited
  return Math.min(100, Math.round((current / limit) * 100));
};
