// ============================================================================
// ENHANCED ANALYTICS TRACKING
// Comprehensive event tracking for measuring UX improvements
// ============================================================================

import { useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ============================================================================
// EVENT DEFINITIONS
// ============================================================================

export type AnalyticsEventName =
  // Legacy Events (backwards compatibility)
  | "landing_visit"
  | "cta_clicked"
  | "session_resumed"
  | "quick_preview_shown"
  | "quick_preview_continued"
  | "trending_business_selected"
  | "trending_skipped"
  | "pdf_exported"
  | "pdf_downloaded"
  | "app_installed"
  | "checkout_paid"
  | "checkout_cancelled"
  
  // Chat Flow Events
  | "chat_opened"
  | "chat_message_sent"
  | "chat_message_received"
  | "intake_completed"
  | "chat_abandoned"
  | "chat_error"
  | "chat_saved"
  | "chat_reset"
  
  // Progress Events
  | "progress_section_completed"
  | "progress_milestone_reached"
  
  // Profile Summary Events
  | "profile_summary_shown"
  | "profile_summary_expanded"
  | "profile_summary_collapsed"
  | "profile_edit_clicked"
  | "profile_field_edited"
  | "profile_confirmed"
  
  // Viability Events
  | "viability_breakdown_shown"
  | "viability_breakdown_expanded"
  | "viability_factor_tooltip_viewed"
  
  // Idea Events
  | "ideas_generated"
  | "idea_viewed"
  | "idea_favorited"
  | "idea_unfavorited"
  | "idea_expanded"
  | "idea_collapsed"
  
  // Idea Chat Events
  | "idea_chat_opened"
  | "idea_chat_closed"
  | "idea_question_asked"
  | "idea_question_suggested_clicked"
  
  // Comparison Events
  | "comparison_opened"
  | "comparison_idea_added"
  | "comparison_idea_removed"
  | "comparison_completed"
  
  // What-If Events
  | "whatif_opened"
  | "whatif_parameter_changed"
  | "whatif_regenerate_clicked"
  | "whatif_completed"
  
  // Quick Win Events
  | "quickwin_shown"
  | "quickwin_started"
  | "quickwin_completed"
  | "quickwin_help_requested"
  | "quickwin_skipped"
  
  // Registration Events
  | "registration_started"
  | "registration_step_completed"
  | "registration_completed"
  | "registration_abandoned"
  
  // Payment Events
  | "checkout_started"
  | "checkout_completed"
  | "checkout_abandoned"
  
  // Engagement Events
  | "session_started"
  | "session_ended"
  | "page_viewed"
  | "feature_discovered"
  
  // A/B Test Events
  | "experiment_assigned"
  | "experiment_converted"
  
  // Email Events
  | "email_sent"
  | "email_opened"
  | "email_clicked"
  | "email_unsubscribed";

export interface AnalyticsEventData {
  // Chat events
  message_length?: number;
  response_time_ms?: number;
  progress_percent?: number;
  section_id?: string;
  
  // Profile events
  completeness_percent?: number;
  field_name?: string;
  previous_value?: string;
  new_value?: string;
  missing_fields?: string[];
  
  // Viability events
  factor_name?: string;
  factor_score?: number;
  overall_score?: number;
  
  // Idea events
  idea_id?: string;
  idea_title?: string;
  idea_rank?: number;
  idea_category?: string;
  viability_score?: number;
  
  // Comparison events
  idea_ids?: string[];
  comparison_count?: number;
  winner_id?: string;
  
  // What-if events
  parameter_name?: string;
  original_value?: string | number | null;
  new_value_whatif?: string | number | null;
  ideas_changed?: number;
  
  // Quick win events
  quickwin_text?: string;
  time_to_complete_ms?: number;
  
  // Registration events
  step_name?: string;
  step_number?: number;
  province?: string;
  business_structure?: string;
  
  // A/B test events
  experiment_id?: string;
  variant?: string;
  
  // Email events
  email_type?: string;
  email_id?: string;
  
  // General
  error_message?: string;
  error_code?: string;
  duration_ms?: number;
  source?: string;
  
  // Custom properties
  [key: string]: unknown;
}

// ============================================================================
// ANALYTICS HOOK
// ============================================================================

const BATCH_INTERVAL_MS = 5000;
const DEBOUNCE_MS = 300;
const STORAGE_KEY = "ft_pending_events";
const SESSION_KEY = "ft_session_id";

interface PendingEvent {
  event_name: AnalyticsEventName;
  event_data: AnalyticsEventData | null;
  session_id: string | null;
  ft_session_id: string | null;
  timestamp: number;
  page_url: string;
  referrer: string;
}

// Get or create browser session ID
function getBrowserSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `bs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

// Get pending events from localStorage
function getPendingEvents(): PendingEvent[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save pending events to localStorage
function savePendingEvents(events: PendingEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-100))); // Keep last 100
  } catch {
    // Storage full, clear old events
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const useEnhancedAnalytics = () => {
  const { user } = useAuth();
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastEventRef = useRef<{ name: string; time: number }>({ name: "", time: 0 });
  const sessionStartRef = useRef<number>(Date.now());
  const pageViewsRef = useRef<Set<string>>(new Set());

  // Flush pending events to database
  const flushEvents = useCallback(async () => {
    if (!user?.id) return;

    const pending = getPendingEvents();
    if (pending.length === 0) return;

    try {
      // Batch insert events
      const eventsToInsert = pending.map((e) => ({
        user_id: user.id,
        event_name: e.event_name,
        event_data: {
          ...e.event_data,
          browser_session_id: getBrowserSessionId(),
          page_url: e.page_url,
          referrer: e.referrer,
        },
        session_id: e.ft_session_id,
        created_at: new Date(e.timestamp).toISOString(),
      }));

      const { error } = await supabase.from("ft_events").insert(eventsToInsert as any);

      if (!error) {
        savePendingEvents([]);
      }
    } catch (err) {
      console.error("Failed to flush analytics events:", err);
    }
  }, [user?.id]);

  // Schedule batch flush
  const scheduleBatchFlush = useCallback(() => {
    if (batchTimeoutRef.current) return;

    batchTimeoutRef.current = setTimeout(() => {
      batchTimeoutRef.current = null;
      flushEvents();
    }, BATCH_INTERVAL_MS);
  }, [flushEvents]);

  // Main track function
  const track = useCallback(
    (
      eventName: AnalyticsEventName,
      eventData: AnalyticsEventData | null = null,
      ftSessionId: string | null = null
    ) => {
      // Debounce same event within threshold
      const now = Date.now();
      if (
        lastEventRef.current.name === eventName &&
        now - lastEventRef.current.time < DEBOUNCE_MS
      ) {
        return;
      }
      lastEventRef.current = { name: eventName, time: now };

      const event: PendingEvent = {
        event_name: eventName,
        event_data: {
          ...eventData,
          session_duration_ms: now - sessionStartRef.current,
        },
        session_id: getBrowserSessionId(),
        ft_session_id: ftSessionId,
        timestamp: now,
        page_url: typeof window !== "undefined" ? window.location.href : "",
        referrer: typeof document !== "undefined" ? document.referrer : "",
      };

      // If online and authenticated, send immediately
      if (navigator.onLine && user?.id) {
        supabase
          .from("ft_events")
          .insert({
            user_id: user.id,
            event_name: event.event_name,
            event_data: event.event_data as Record<string, unknown>,
            session_id: event.ft_session_id,
          } as any)
          .then(({ error }) => {
            if (error) {
              // Queue for retry
              const pending = getPendingEvents();
              pending.push(event);
              savePendingEvents(pending);
              scheduleBatchFlush();
            }
          });
      } else {
        // Queue for later
        const pending = getPendingEvents();
        pending.push(event);
        savePendingEvents(pending);
        scheduleBatchFlush();
      }
    },
    [user?.id, scheduleBatchFlush]
  );

  // Track page view (with deduplication)
  const trackPageView = useCallback(
    (pageName: string, pageData?: AnalyticsEventData) => {
      const pageKey = `${pageName}_${Date.now().toString().slice(0, -4)}`; // Dedupe within 10s
      if (pageViewsRef.current.has(pageKey)) return;
      pageViewsRef.current.add(pageKey);

      track("page_viewed", {
        page_name: pageName,
        ...pageData,
      });
    },
    [track]
  );

  // Track timing
  const trackTiming = useCallback(
    (
      eventName: AnalyticsEventName,
      startTime: number,
      eventData?: AnalyticsEventData,
      ftSessionId?: string
    ) => {
      track(
        eventName,
        {
          ...eventData,
          duration_ms: Date.now() - startTime,
        },
        ftSessionId || null
      );
    },
    [track]
  );

  // Create timing helper
  const startTiming = useCallback(() => {
    return Date.now();
  }, []);

  // Flush on unmount and online event
  useEffect(() => {
    const handleOnline = () => flushEvents();
    const handleBeforeUnload = () => {
      // Attempt sync flush before page unload
      const pending = getPendingEvents();
      if (pending.length > 0 && user?.id) {
        navigator.sendBeacon?.(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/ft_events`,
          JSON.stringify(
            pending.map((e) => ({
              user_id: user.id,
              event_name: e.event_name,
              event_data: e.event_data,
              session_id: e.ft_session_id,
            }))
          )
        );
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, [flushEvents, user?.id]);

  return {
    track,
    trackPageView,
    trackTiming,
    startTiming,
    flushEvents,
  };
};

// ============================================================================
// ANALYTICS CONTEXT (for global access)
// ============================================================================

import { createContext, useContext, ReactNode } from "react";

interface AnalyticsContextValue {
  track: (
    eventName: AnalyticsEventName,
    eventData?: AnalyticsEventData | null,
    ftSessionId?: string | null
  ) => void;
  trackPageView: (pageName: string, pageData?: AnalyticsEventData) => void;
  trackTiming: (
    eventName: AnalyticsEventName,
    startTime: number,
    eventData?: AnalyticsEventData,
    ftSessionId?: string
  ) => void;
  startTiming: () => number;
  flushEvents: () => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export const AnalyticsProvider = ({ children }: { children: ReactNode }) => {
  const analytics = useEnhancedAnalytics();
  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within AnalyticsProvider");
  }
  return context;
};

// ============================================================================
// STANDALONE TRACK FUNCTION (for use outside React)
// ============================================================================

export const trackEvent = async (
  userId: string | null,
  eventName: AnalyticsEventName,
  eventData: AnalyticsEventData | null = null,
  sessionId: string | null = null
) => {
  if (!userId) return;

  try {
    await supabase.from("ft_events").insert({
      user_id: userId,
      event_name: eventName,
      event_data: eventData as Record<string, unknown>,
      session_id: sessionId,
    } as any);
  } catch (err) {
    console.error("Failed to track event:", err);
  }
};
