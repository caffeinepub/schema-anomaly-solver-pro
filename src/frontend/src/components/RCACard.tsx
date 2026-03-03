import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  RefreshCw,
  Trash2,
  Wrench,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { Anomaly } from "../types/analysis";

const ANOMALY_ICONS: Record<string, React.ReactNode> = {
  Update: <RefreshCw size={14} />,
  Insert: <PlusCircle size={14} />,
  Delete: <Trash2 size={14} />,
};

const ANOMALY_COLORS: Record<string, string> = {
  Update: "text-neon-cyan border-neon-cyan/30 bg-neon-cyan/5",
  Insert: "text-neon-green border-neon-green/30 bg-neon-green/5",
  Delete: "text-destructive border-destructive/30 bg-destructive/5",
};

const NF_CAUSE_COLORS: Record<string, string> = {
  "2NF": "text-orange-400 bg-orange-400/10 border-orange-400/30",
  "3NF": "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  BCNF: "text-blue-400 bg-blue-400/10 border-blue-400/30",
};

interface RCACardProps {
  anomaly: Anomaly;
  index: number;
}

function SampleTable({
  rows,
  label,
  isGood,
}: { rows: Record<string, string>[]; label: string; isGood: boolean }) {
  if (rows.length === 0) return null;
  const cols = Object.keys(rows[0]);
  return (
    <div className="space-y-1">
      <div
        className={`text-xs font-mono font-semibold ${isGood ? "text-neon-green" : "text-destructive"}`}
      >
        {isGood ? "✓" : "✗"} {label}
      </div>
      <div className="overflow-x-auto">
        <table className="text-xs font-mono w-full">
          <thead>
            <tr className="border-b border-border/50">
              {cols.map((c) => (
                <th
                  key={c}
                  className="px-2 py-1 text-left text-muted-foreground font-normal"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={`${cols.map((c) => row[c] ?? "").join("|")}|${i}`}
                className={`border-b border-border/20 ${!isGood ? "bg-destructive/5" : ""}`}
              >
                {cols.map((c) => (
                  <td key={c} className="px-2 py-1 text-foreground/80">
                    {row[c] || (
                      <span className="text-muted-foreground/40 italic">
                        NULL
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function RCACard({ anomaly, index }: RCACardProps) {
  const [expanded, setExpanded] = useState(index === 0);
  const colorClass = ANOMALY_COLORS[anomaly.type] || ANOMALY_COLORS.Update;
  const nfCauseColor = anomaly.normalFormCause
    ? (NF_CAUSE_COLORS[anomaly.normalFormCause] ?? "")
    : "";

  return (
    <div
      data-ocid={`rca.anomaly_card.${index + 1}`}
      className={`panel rounded-lg border ${colorClass} overflow-hidden`}
    >
      <button
        type="button"
        data-ocid={`rca.anomaly_toggle.${index + 1}`}
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`flex items-center gap-1.5 text-xs font-mono font-bold px-2 py-0.5 rounded border ${colorClass}`}
          >
            {ANOMALY_ICONS[anomaly.type]}
            {anomaly.type} Anomaly
          </span>
          {anomaly.normalFormCause && (
            <span
              className={`text-xs font-mono px-1.5 py-0.5 rounded border ${nfCauseColor}`}
            >
              {anomaly.cause ?? anomaly.normalFormCause}
            </span>
          )}
          <span className="text-sm font-mono text-foreground/80">
            <span className="text-neon-green">
              {anomaly.fd.determinant.join(", ")}
            </span>
            {" → "}
            <span className="text-neon-cyan">
              {anomaly.fd.dependent.join(", ")}
            </span>
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/30">
          <p className="text-sm font-mono text-muted-foreground mt-3">
            {anomaly.description}
          </p>

          <div className="panel p-3 rounded space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground mb-1">
              <AlertTriangle size={12} />
              Root Cause
            </div>
            <p className="text-sm font-mono text-foreground/80">
              {anomaly.reason}
            </p>
          </div>

          {anomaly.affectedRows && anomaly.affectedRows.length > 0 && (
            <div className="panel p-3 rounded">
              <div className="text-xs font-mono text-muted-foreground mb-1">
                Affected Rows
              </div>
              <div className="flex flex-wrap gap-1">
                {anomaly.affectedRows.map((r) => (
                  <span
                    key={r}
                    className="text-xs font-mono px-1.5 py-0.5 rounded border border-border bg-muted/20 text-foreground/70"
                  >
                    #{r}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SampleTable
              rows={anomaly.goodSamples}
              label="Good Samples (Conforming)"
              isGood={true}
            />
            <SampleTable
              rows={anomaly.badSamples}
              label="Bad Samples (Violating)"
              isGood={false}
            />
          </div>

          {anomaly.fix && (
            <div className="panel p-3 rounded border border-neon-green/20 bg-neon-green/5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-mono text-neon-green mb-1">
                <Wrench size={12} />
                Suggested Fix
              </div>
              <p className="text-xs font-mono text-foreground/80">
                {anomaly.fix}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
