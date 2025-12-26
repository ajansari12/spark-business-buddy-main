import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTrackEvent } from "@/hooks/useTrackEvent";

/**
 * A/B Testing Hook for Wizard vs Chat experiment
 *
 * Usage:
 * const { variant, assignVariant } = useABTest('onboarding_mode');
 *
 * Variants:
 * - 'wizard': Visual wizard flow (new)
 * - 'chat': Traditional chat flow (control)
 */

export interface ABTestConfig {
  testName: string;
  variants: string[];
  weights?: number[]; // Optional weights for each variant (must sum to 100)
  enabled?: boolean;  // Feature flag to enable/disable test
}

const AB_TESTS: Record<string, ABTestConfig> = {
  onboarding_mode: {
    testName: "onboarding_mode",
    variants: ["wizard", "chat"],
    weights: [50, 50], // 50/50 split
    enabled: true,
  },
  // Add more experiments here
};

const STORAGE_KEY_PREFIX = "ab_test_";

export const useABTest = (testName: string) => {
  const { user } = useAuth();
  const { track } = useTrackEvent();
  const testConfig = AB_TESTS[testName];

  const [variant, setVariant] = useState<string | null>(null);

  useEffect(() => {
    if (!testConfig || !testConfig.enabled) {
      // Test not configured or disabled - return first variant as default
      setVariant(testConfig?.variants[0] || null);
      return;
    }

    // Check if user already assigned to a variant
    const storageKey = `${STORAGE_KEY_PREFIX}${testName}`;
    const savedVariant = localStorage.getItem(storageKey);

    if (savedVariant && testConfig.variants.includes(savedVariant)) {
      setVariant(savedVariant);
      return;
    }

    // Assign new variant based on weights
    const assignedVariant = assignVariant(testConfig);
    setVariant(assignedVariant);
    localStorage.setItem(storageKey, assignedVariant);

    // Track variant assignment
    track("ab_test_assigned", {
      test_name: testName,
      variant: assignedVariant,
      user_id: user?.id,
    });
  }, [testName, testConfig, user?.id, track]);

  const assignVariant = (config: ABTestConfig): string => {
    const { variants, weights } = config;

    if (!weights || weights.length !== variants.length) {
      // No weights defined - use equal distribution
      const randomIndex = Math.floor(Math.random() * variants.length);
      return variants[randomIndex];
    }

    // Weighted random selection
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < variants.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return variants[i];
      }
    }

    // Fallback to first variant
    return variants[0];
  };

  const forceVariant = (newVariant: string) => {
    if (!testConfig || !testConfig.variants.includes(newVariant)) {
      console.warn(`Invalid variant ${newVariant} for test ${testName}`);
      return;
    }

    const storageKey = `${STORAGE_KEY_PREFIX}${testName}`;
    localStorage.setItem(storageKey, newVariant);
    setVariant(newVariant);

    track("ab_test_forced", {
      test_name: testName,
      variant: newVariant,
      user_id: user?.id,
    });
  };

  const trackConversion = (conversionName: string, metadata?: Record<string, any>) => {
    if (!variant) return;

    track("ab_test_conversion", {
      test_name: testName,
      variant,
      conversion_name: conversionName,
      user_id: user?.id,
      ...metadata,
    });
  };

  return {
    variant,
    forceVariant,
    trackConversion,
    isLoading: variant === null,
  };
};

/**
 * Hook for managing multiple A/B tests
 */
export const useABTests = (testNames: string[]) => {
  const tests = testNames.map((name) => ({
    name,
    ...useABTest(name),
  }));

  return {
    tests,
    getVariant: (testName: string) => {
      const test = tests.find((t) => t.name === testName);
      return test?.variant || null;
    },
    isLoading: tests.some((t) => t.isLoading),
  };
};

/**
 * Get all active A/B tests configuration
 */
export const getABTestsConfig = () => {
  return Object.entries(AB_TESTS)
    .filter(([, config]) => config.enabled)
    .map(([name, config]) => ({ name, ...config }));
};

/**
 * Reset all A/B test assignments (for testing/debugging)
 */
export const resetAllABTests = () => {
  Object.keys(AB_TESTS).forEach((testName) => {
    const storageKey = `${STORAGE_KEY_PREFIX}${testName}`;
    localStorage.removeItem(storageKey);
  });
};

/**
 * Get user's current A/B test assignments
 */
export const getUserABTestAssignments = (): Record<string, string> => {
  const assignments: Record<string, string> = {};

  Object.keys(AB_TESTS).forEach((testName) => {
    const storageKey = `${STORAGE_KEY_PREFIX}${testName}`;
    const variant = localStorage.getItem(storageKey);
    if (variant) {
      assignments[testName] = variant;
    }
  });

  return assignments;
};
