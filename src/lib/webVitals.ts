// Core Web Vitals monitoring for performance tracking

export interface Metric {
  name: string;
  value: number;
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

// CLS (Cumulative Layout Shift)
export function onCLS(onPerfEntry?: (metric: Metric) => void) {
  if (!onPerfEntry) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      let clsValue = 0;
      
      for (const entry of entries) {
        // Check if entry has the value property (LayoutShift)
        if ('value' in entry && typeof entry.value === 'number') {
          clsValue += entry.value as number;
        }
      }
      
      const metric: Metric = {
        name: 'CLS',
        value: clsValue,
        rating: getRating('CLS', clsValue),
        delta: clsValue,
      };
      onPerfEntry(metric);
    });
    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    console.warn('CLS observer not supported:', e);
  }
}

// FID (First Input Delay)
export function onFID(onPerfEntry?: (metric: Metric) => void) {
  if (!onPerfEntry) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      for (const entry of entries) {
        // Check if entry has processingStart and startTime
        if ('processingStart' in entry && 'startTime' in entry) {
          const fid = (entry.processingStart as number) - (entry.startTime as number);
          const metric: Metric = {
            name: 'FID',
            value: fid,
            rating: getRating('FID', fid),
            delta: fid,
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

// LCP (Largest Contentful Paint)
export function onLCP(onPerfEntry?: (metric: Metric) => void) {
  if (!onPerfEntry) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      // Get the last entry (most recent LCP)
      const lastEntry = entries[entries.length - 1];
      
      if (lastEntry && 'startTime' in lastEntry) {
        const metric: Metric = {
          name: 'LCP',
          value: lastEntry.startTime as number,
          rating: getRating('LCP', lastEntry.startTime as number),
          delta: lastEntry.startTime as number,
        };
        onPerfEntry(metric);
      }
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    console.warn('LCP observer not supported:', e);
  }
}

// FCP (First Contentful Paint)
export function onFCP(onPerfEntry?: (metric: Metric) => void) {
  if (!onPerfEntry) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      for (const entry of entries) {
        // Check for first-contentful-paint
        if ('name' in entry && entry.name === 'first-contentful-paint' && 'startTime' in entry) {
          const metric: Metric = {
            name: 'FCP',
            value: entry.startTime as number,
            rating: getRating('FCP', entry.startTime as number),
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

// TTFB (Time to First Byte)
export function onTTFB(onPerfEntry?: (metric: Metric) => void) {
  if (!onPerfEntry) return;

  try {
    // For TTFB, we use navigation timing
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    
    if (navigationEntry) {
      const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
      const metric: Metric = {
        name: 'TTFB',
        value: ttfb,
        rating: getRating('TTFB', ttfb),
        navigationType: navigationEntry.type,
      };
      onPerfEntry(metric);
    }
  } catch (e) {
    console.warn('TTFB calculation not supported:', e);
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
  const isProd = typeof window !== 'undefined' && 
    (window.location.hostname === 'kobcash.com' || 
     window.location.hostname.includes('netlify') ||
     window.location.hostname.includes('vercel'));
  
  if (isProd) {
    // Example: send to analytics
    // analytics.track('web_vital', metric);
  }
}
