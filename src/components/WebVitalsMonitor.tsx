import { useEffect } from "react";
import { onCLS, onFID, onLCP, onFCP, onTTFB, reportWebVital, Metric } from "@/lib/webVitals";

export function WebVitalsMonitor() {
  useEffect(() => {
    // Register all Web Vitals observers
    onCLS(reportWebVital);
    onFID(reportWebVital);
    onLCP(reportWebVital);
    onFCP(reportWebVital);
    onTTFB(reportWebVital);
  }, []);

  return null; // This component doesn't render anything
}

