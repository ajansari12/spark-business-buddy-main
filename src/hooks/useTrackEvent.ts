// ============================================================================
// LEGACY TRACK EVENT HOOK - DEPRECATED
// This file re-exports from useEnhancedAnalytics for backwards compatibility
// New code should import directly from useEnhancedAnalytics
// ============================================================================

import { useAnalytics, trackEvent as enhancedTrackEvent, type AnalyticsEventName } from "./useEnhancedAnalytics";

// Legacy event types mapped to new analytics event names
export type EventName = AnalyticsEventName;

/**
 * @deprecated Use useAnalytics() from useEnhancedAnalytics instead
 * This hook is kept for backwards compatibility
 */
export const useTrackEvent = () => {
  const analytics = useAnalytics();
  
  return {
    track: analytics.track,
    flushEvents: analytics.flushEvents,
  };
};

/**
 * @deprecated Use trackEvent from useEnhancedAnalytics instead
 */
export const trackEvent = enhancedTrackEvent;
