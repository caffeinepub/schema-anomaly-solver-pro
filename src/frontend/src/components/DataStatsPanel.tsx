import { AlertTriangle, Columns, Rows } from "lucide-react";
import React from "react";
import type { TableData } from "../types/schema";
import { countNulls } from "../utils/primaryKeyDetection";

interface DataStatsPanelProps {
  table: TableData;
}

export default function DataStatsPanel({ table }: DataStatsPanelProps) {
  const nullCounts = countNulls(table);
  const totalNulls = Object.values(nullCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="panel-neon p-3 rounded text-center">
          <div className="flex items-center justify-center gap-1 text-neon-green mb-1">
            <Rows size={14} />
          </div>
          <div className="text-2xl font-mono font-bold text-neon-green">
            {table.rows.length}
          </div>
          <div className="text-xs text-muted-foreground font-mono">Rows</div>
        </div>
        <div className="panel p-3 rounded text-center border border-neon-cyan/30">
          <div className="flex items-center justify-center gap-1 text-neon-cyan mb-1">
            <Columns size={14} />
          </div>
          <div className="text-2xl font-mono font-bold text-neon-cyan">
            {table.columns.length}
          </div>
          <div className="text-xs text-muted-foreground font-mono">Columns</div>
        </div>
        <div
          className={`panel p-3 rounded text-center ${totalNulls > 0 ? "border border-destructive/30" : "border border-border"}`}
        >
          <div
            className={`flex items-center justify-center gap-1 mb-1 ${totalNulls > 0 ? "text-destructive" : "text-muted-foreground"}`}
          >
            <AlertTriangle size={14} />
          </div>
          <div
            className={`text-2xl font-mono font-bold ${totalNulls > 0 ? "text-destructive" : "text-muted-foreground"}`}
          >
            {totalNulls}
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            Null Values
          </div>
        </div>
      </div>

      {/* Per-column null counts */}
      {table.columns.length > 0 && (
        <div className="panel p-3 rounded space-y-2">
          <h4 className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
            Column Null Analysis
          </h4>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {table.columns.map((col) => {
              const nullCount = nullCounts[col.name] || 0;
              const pct =
                table.rows.length > 0
                  ? (nullCount / table.rows.length) * 100
                  : 0;
              return (
                <div key={col.name} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-foreground w-32 truncate">
                    {col.name}
                  </span>
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background:
                          pct > 50
                            ? "oklch(0.60 0.22 25)"
                            : pct > 20
                              ? "oklch(0.75 0.15 80)"
                              : "oklch(0.72 0.18 155)",
                      }}
                    />
                  </div>
                  <span
                    className={`text-xs font-mono w-8 text-right ${nullCount > 0 ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {nullCount}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
