import { Shield, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import type React from "react";

interface SeverityScorePanelProps {
  score: number;
  grade: string;
  highestNF: string;
  violationCount: number;
}

const GRADE_CONFIG: Record<
  string,
  { color: string; label: string; icon: React.ReactNode }
> = {
  A: {
    color: "text-neon-green",
    label: "Excellent",
    icon: <ShieldCheck size={32} />,
  },
  B: { color: "text-neon-cyan", label: "Good", icon: <Shield size={32} /> },
  C: {
    color: "text-yellow-400",
    label: "Fair",
    icon: <ShieldAlert size={32} />,
  },
  D: {
    color: "text-orange-400",
    label: "Poor",
    icon: <ShieldAlert size={32} />,
  },
  F: {
    color: "text-destructive",
    label: "Critical",
    icon: <ShieldX size={32} />,
  },
};

export default function SeverityScorePanel({
  score,
  grade,
  highestNF,
  violationCount,
}: SeverityScorePanelProps) {
  const config = GRADE_CONFIG[grade] || GRADE_CONFIG.F;

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="panel-neon p-6 rounded-lg">
      <h2 className="text-sm font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Schema Health Score
      </h2>
      <div className="flex items-center gap-8">
        {/* Circular progress */}
        <div className="relative flex-shrink-0">
          <svg
            width="100"
            height="100"
            className="-rotate-90"
            role="img"
            aria-label={`Health score: ${score} out of 100`}
          >
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="oklch(0.20 0.01 220)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={
                score >= 80
                  ? "oklch(0.72 0.18 155)"
                  : score >= 60
                    ? "oklch(0.65 0.20 195)"
                    : score >= 40
                      ? "oklch(0.75 0.15 80)"
                      : "oklch(0.60 0.22 25)"
              }
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: "stroke-dashoffset 1s ease",
                filter: "drop-shadow(0 0 6px currentColor)",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-mono font-bold ${config.color}`}>
              {score}
            </span>
          </div>
        </div>

        {/* Grade */}
        <div className="flex-1">
          <div className={`flex items-center gap-3 ${config.color}`}>
            {config.icon}
            <div>
              <div
                className={`text-5xl font-mono font-black ${config.color}`}
                style={{ textShadow: "0 0 20px currentColor" }}
              >
                {grade}
              </div>
              <div className={`text-sm font-mono ${config.color}`}>
                {config.label}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex flex-col gap-2 text-right">
          <div>
            <div className="text-xs text-muted-foreground font-mono">
              Highest NF
            </div>
            <div className="text-sm font-mono font-semibold text-foreground">
              {highestNF}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-mono">
              Violations
            </div>
            <div
              className={`text-sm font-mono font-semibold ${violationCount > 0 ? "text-destructive" : "text-neon-green"}`}
            >
              {violationCount}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
