/**
 * Performance Monitoring
 * Tracks Core Web Vitals and custom performance metrics
 */

import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType?: string;
}

// Thresholds for Core Web Vitals ratings
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 }, // Interaction to Next Paint (replaces FID)
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

/**
 * Get performance rating based on value and metric type
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report metric to analytics
 */
function reportMetric(metric: PerformanceMetric) {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log('[Performance]', metric);
  }

  // Send to analytics service
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_rating: metric.rating,
      metric_navigation_type: metric.navigationType,
    });
  }

  // Can also send to custom analytics endpoint
  // fetch('/api/analytics/performance', {
  //   method: 'POST',
  //   body: JSON.stringify(metric),
  // });
}

/**
 * Convert web-vitals Metric to our PerformanceMetric format
 */
function convertMetric(metric: Metric): PerformanceMetric {
  return {
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    navigationType: metric.navigationType,
  };
}

/**
 * Initialize Core Web Vitals monitoring
 */
export function initPerformanceMonitoring() {
  // Largest Contentful Paint (LCP)
  // Measures loading performance
  // Good: < 2.5s, Poor: > 4.0s
  onLCP((metric) => {
    reportMetric(convertMetric(metric));
  });

  // Interaction to Next Paint (INP)
  // Measures interactivity (replaces FID)
  // Good: < 200ms, Poor: > 500ms
  onINP((metric) => {
    reportMetric(convertMetric(metric));
  });

  // Cumulative Layout Shift (CLS)
  // Measures visual stability
  // Good: < 0.1, Poor: > 0.25
  onCLS((metric) => {
    reportMetric(convertMetric(metric));
  });

  // First Contentful Paint (FCP)
  // Measures perceived load speed
  // Good: < 1.8s, Poor: > 3.0s
  onFCP((metric) => {
    reportMetric(convertMetric(metric));
  });

  // Time to First Byte (TTFB)
  // Measures server response time
  // Good: < 800ms, Poor: > 1800ms
  onTTFB((metric) => {
    reportMetric(convertMetric(metric));
  });
}

/**
 * Track custom performance mark
 */
export function trackPerformanceMark(name: string) {
  if (typeof window !== 'undefined' && window.performance) {
    performance.mark(name);
  }
}

/**
 * Track custom performance measure
 */
export function trackPerformanceMeasure(
  name: string,
  startMark: string,
  endMark?: string
) {
  if (typeof window !== 'undefined' && window.performance) {
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }

      const measure = performance.getEntriesByName(name, 'measure')[0];
      if (measure) {
        reportMetric({
          name: `custom_${name}`,
          value: measure.duration,
          rating: measure.duration < 1000 ? 'good' : measure.duration < 3000 ? 'needs-improvement' : 'poor',
        });
      }
    } catch (error) {
      console.warn('Failed to measure performance:', error);
    }
  }
}

/**
 * Track route change performance
 */
export function trackRouteChange(route: string, startTime: number) {
  const duration = Date.now() - startTime;

  reportMetric({
    name: 'route_change',
    value: duration,
    rating: duration < 200 ? 'good' : duration < 500 ? 'needs-improvement' : 'poor',
  });

  if (import.meta.env.DEV) {
    console.log(`[Route Change] ${route} took ${duration}ms`);
  }
}

/**
 * Track API call performance
 */
export function trackAPICall(endpoint: string, duration: number, success: boolean) {
  reportMetric({
    name: 'api_call',
    value: duration,
    rating: duration < 500 ? 'good' : duration < 2000 ? 'needs-improvement' : 'poor',
  });

  if (window.gtag) {
    window.gtag('event', 'api_call', {
      endpoint,
      duration: Math.round(duration),
      success,
    });
  }
}

/**
 * Get current performance metrics
 */
export function getCurrentPerformanceMetrics() {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');

  return {
    // Navigation timing
    domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
    loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,

    // Paint timing
    firstPaint: paint.find((entry) => entry.name === 'first-paint')?.startTime,
    firstContentfulPaint: paint.find((entry) => entry.name === 'first-contentful-paint')?.startTime,

    // Resource timing
    totalResources: performance.getEntriesByType('resource').length,
  };
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
