/**
 * Analytics Event Batching System
 * Queues analytics events and sends them in batches to reduce API calls
 */

import { supabase } from '@/integrations/supabase/client';

interface AnalyticsEvent {
  event_name: string;
  properties?: Record<string, any>;
  user_id?: string;
  session_id?: string;
  timestamp: string;
}

class AnalyticsQueue {
  private queue: AnalyticsEvent[] = [];
  private batchSize = 10; // Send after 10 events
  private flushInterval = 10000; // Send every 10 seconds
  private timer: NodeJS.Timeout | null = null;
  private isFlushing = false;

  constructor() {
    // Start the flush timer
    this.startTimer();

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush());
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
    }
  }

  /**
   * Add event to queue
   */
  public enqueue(event: Omit<AnalyticsEvent, 'timestamp'>) {
    const queuedEvent: AnalyticsEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    this.queue.push(queuedEvent);

    // Log in development
    if (import.meta.env.DEV) {
      console.log('[Analytics Queue] Event added:', event.event_name, this.queue.length);
    }

    // Flush if batch size reached
    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Start flush timer
   */
  private startTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  /**
   * Flush queue to database
   */
  public async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) {
      return;
    }

    this.isFlushing = true;
    const eventsToSend = [...this.queue];
    this.queue = []; // Clear queue immediately

    try {
      // Send batch to database
      const { error } = await supabase.from('analytics_events').insert(eventsToSend);

      if (error) {
        console.error('[Analytics Queue] Failed to send batch:', error);
        // Re-add failed events to queue
        this.queue.unshift(...eventsToSend);
      } else if (import.meta.env.DEV) {
        console.log('[Analytics Queue] Flushed', eventsToSend.length, 'events');
      }
    } catch (error) {
      console.error('[Analytics Queue] Error flushing queue:', error);
      // Re-add failed events
      this.queue.unshift(...eventsToSend);
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Get current queue size
   */
  public getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Clear queue without sending
   */
  public clear(): void {
    this.queue = [];
  }

  /**
   * Update configuration
   */
  public configure(options: { batchSize?: number; flushInterval?: number }) {
    if (options.batchSize !== undefined) {
      this.batchSize = options.batchSize;
    }

    if (options.flushInterval !== undefined) {
      this.flushInterval = options.flushInterval;
      this.startTimer(); // Restart timer with new interval
    }
  }
}

// Singleton instance
const analyticsQueue = new AnalyticsQueue();

/**
 * Track event (adds to queue instead of sending immediately)
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, any>,
  userId?: string,
  sessionId?: string
): void {
  analyticsQueue.enqueue({
    event_name: eventName,
    properties,
    user_id: userId,
    session_id: sessionId,
  });
}

/**
 * Flush all pending events immediately
 */
export function flushEvents(): Promise<void> {
  return analyticsQueue.flush();
}

/**
 * Get current queue size
 */
export function getQueueSize(): number {
  return analyticsQueue.getQueueSize();
}

/**
 * Clear queue without sending
 */
export function clearQueue(): void {
  analyticsQueue.clear();
}

/**
 * Configure batching behavior
 */
export function configureAnalytics(options: {
  batchSize?: number;
  flushInterval?: number;
}): void {
  analyticsQueue.configure(options);
}

/**
 * Higher-order function to wrap existing tracking hooks
 */
export function withBatchedTracking<T extends (...args: any[]) => any>(
  trackFn: T
): (...args: Parameters<T>) => void {
  return (...args: Parameters<T>) => {
    try {
      trackFn(...args);
    } catch (error) {
      console.error('[Analytics] Error in tracking function:', error);
    }
  };
}

export default analyticsQueue;
