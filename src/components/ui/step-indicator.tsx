/**
 * Step Indicator Component
 * 
 * Reusable multi-step progress indicator
 */

import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function StepIndicator({ 
  currentStep, 
  totalSteps, 
  className = "" 
}: StepIndicatorProps) {
  return (
    <div className={`flex items-center justify-center mb-8 gap-2 ${className}`} role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        return (
          <div key={step} className="flex items-center">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                isCompleted
                  ? "bg-primary text-primary-foreground"
                  : isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
              aria-current={isActive ? "step" : undefined}
            >
              {isCompleted ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                step
              )}
            </div>
            {step < totalSteps && (
              <div
                className={`h-0.5 w-12 ${
                  isCompleted ? "bg-primary" : "bg-muted"
                }`}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

