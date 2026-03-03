import { Check } from "lucide-react";
import React from "react";

interface Step {
  number: number;
  label: string;
  sublabel: string;
}

const STEPS: Step[] = [
  { number: 1, label: "Data Input", sublabel: "Ingest Schema" },
  { number: 2, label: "Preview", sublabel: "Configure PKs" },
  { number: 3, label: "Analysis", sublabel: "Run Engine" },
  { number: 4, label: "Results", sublabel: "View Report" },
];

interface ProgressIndicatorProps {
  currentStep: number;
}

export default function ProgressIndicator({
  currentStep,
}: ProgressIndicatorProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        {/* Connector line */}
        <div className="absolute top-5 left-0 right-0 h-px bg-border z-0" />
        <div
          className="absolute top-5 left-0 h-px z-0 transition-all duration-500"
          style={{
            width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
            background: "oklch(0.72 0.18 155)",
            boxShadow: "0 0 8px oklch(0.72 0.18 155 / 0.6)",
          }}
        />

        {STEPS.map((step) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;
          const _isPending = step.number > currentStep;

          return (
            <div
              key={step.number}
              className="flex flex-col items-center z-10 flex-1"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                  isCompleted
                    ? "bg-neon-green border-neon-green text-background"
                    : isActive
                      ? "bg-background border-neon-green text-neon-green"
                      : "bg-background border-border text-muted-foreground"
                }`}
                style={
                  isActive
                    ? { boxShadow: "0 0 16px oklch(0.72 0.18 155 / 0.5)" }
                    : isCompleted
                      ? { boxShadow: "0 0 8px oklch(0.72 0.18 155 / 0.3)" }
                      : {}
                }
              >
                {isCompleted ? <Check size={16} /> : step.number}
              </div>
              <div className="mt-2 text-center hidden sm:block">
                <div
                  className={`text-xs font-semibold font-mono ${
                    isActive
                      ? "text-neon-green"
                      : isCompleted
                        ? "text-neon-green/70"
                        : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </div>
                <div className="text-xs text-muted-foreground/60">
                  {step.sublabel}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
