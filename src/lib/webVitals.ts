// Core Web Vitals monitoring for performance tracking

export interface Metric {
  name: string;
  value: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  navigationType?: string;
}

// Performance thresholds based on Web Vitals
const WEB_VITALS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

export function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = WEB_VITALS[name as keyof typeof WEB_VITALS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

export function onCLS(onPerfEntry?: (metric: Metric) => void) {
  if (!onPerfEntry) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry instanceof PerformanceObserverEntryList) {
          for (const clsEntry of entry) {
            if ('value' in clsEntry) {
              const metric: Metric = {
                name: 'CLS',
                value: clsEntry.value as number,
                id: clsEntry.id || '',
                rating: getRating('CLS', clsEntry.value as number),
                delta: clsEntry.delta || undefined,
              };
              onPerfEntry(metric);
            }
          }
        }
      }
    });
    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    console.warn('CLS observer not supported:', e);
  }
}

export function onFID(onPerfEntry?: (metric: Metric) => void) {
  if (!onPerfEntry) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry instanceof PerformanceEventTiming && 'processingStart' in entry) {
          const fid = entry.processingStart - entry.startTime;
          const metric: Metric = {
            name: 'FID',
            value: fid,
            id: entry.id || '',
            rating: getRating('FID', fid),
            delta: entry.delta || undefined,
          };
          onPerfEntry(metric);
        }
      }
    });
    observer.observe({ type: 'first-input', buffered: true });
  } catch (e) {
    console.warn('FID observer not supported:', e);
  }
}

export function onLCP(onPerfEntry?: (metric: Metric) => void) {
  if (!onPerfEntry) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformancePaintTiming | PerformanceResourceTiming;
      
      const metric: Metric = {
        name: 'LCP',
        value: lastEntry.startTime,
        id: lastEntry.id || '',
        rating: getRating('LCP', lastEntry.startTime),
        delta: 'renderTime' in lastEntry ? lastEntry.renderTime : undefined,
      };
      onPerfEntry(metric);
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    console.warn('LCP observer not supported:', e);
  }
}

export function onFCP(onPerfEntry?: (metric: Metric) => void) {
  if (!onPerfEntry) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry instanceof PerformancePaintTiming && entry.name === 'first-contentful-paint') {
          const metric: Metric = {
            name: 'FCP',
            value: entry.startTime,
            id: entry.id || '',
            rating: getRating('FCP', entry.startTime),
          };
          onPerfEntry(metric);
        }
      }
    });
    observer.observe({ type: 'paint', buffered: true });
  } catch (e) {
    console.warn('FCP observer not supported:', e);
  }
}

export function onTTFB(onPerfEntry?: (metric: Metric) => void) {
  if (!onPerfEntry) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry instanceof PerformanceNavigationTiming) {
          const ttfb = entry.responseStart - entry.requestStart;
          const metric: Metric = {
            name: 'TTFB',
            value: ttfb,
            id: entry.id || '',
            rating: getRating('TTFB', ttfb),
            navigationType: entry.type,
          };
          onPerfEntry(metric);
        }
      }
    });
    observer.observe({ type: 'navigation', buffered: true });
  } catch (e) {
    console.warn('TTFB observer not supported:', e);
  }
}

// Helper to log metrics
export function reportWebVital(metric: Metric) {
  console.log(`[Web Vitals] ${metric.name}:`, {
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
  });

  // In production, send to analytics service
  if (import.meta.env.PROD) {
    // Example: send to analytics
    // analytics.track('web_vital', metric);
  }
}

