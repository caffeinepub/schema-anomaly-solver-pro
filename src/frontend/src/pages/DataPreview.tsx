import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Key, Wand2 } from "lucide-react";
import React, { useState } from "react";
import DataStatsPanel from "../components/DataStatsPanel";
import PreviewGrid from "../components/PreviewGrid";
import ProgressIndicator from "../components/ProgressIndicator";
import type { TableData } from "../types/schema";
import { detectPrimaryKeys } from "../utils/primaryKeyDetection";

interface DataPreviewProps {
  table: TableData;
  onTableUpdated: (table: TableData) => void;
  onAnalysisReady: (result: never) => void;
}

export default function DataPreview({
  table,
  onTableUpdated,
}: DataPreviewProps) {
  const navigate = useNavigate();
  const [localTable, setLocalTable] = useState<TableData>(table);

  const pkCandidates = detectPrimaryKeys(localTable);

  const handleAutoDetect = () => {
    const candidates = detectPrimaryKeys(localTable);
    const suggestedPKs = candidates
      .filter((c) => c.isCandidate)
      .map((c) => c.column);

    const updatedCols = localTable.columns.map((col) => ({
      ...col,
      isPrimaryKey: suggestedPKs.includes(col.name),
    }));

    const updated = { ...localTable, columns: updatedCols };
    setLocalTable(updated);
    onTableUpdated(updated);
  };

  const togglePK = (colName: string) => {
    const updatedCols = localTable.columns.map((col) =>
      col.name === colName ? { ...col, isPrimaryKey: !col.isPrimaryKey } : col,
    );
    const updated = { ...localTable, columns: updatedCols };
    setLocalTable(updated);
    onTableUpdated(updated);
  };

  const handleProceed = () => {
    onTableUpdated(localTable);
    navigate({ to: "/analysis" });
  };

  const pkCount = localTable.columns.filter((c) => c.isPrimaryKey).length;

  return (
    <div className="space-y-6">
      <ProgressIndicator currentStep={2} />

      <div className="space-y-2">
        <h1 className="text-2xl font-mono font-bold neon-text-cyan">
          <span className="text-muted-foreground">&gt; </span>
          Step 2: Data Preview & Configuration
        </h1>
        <p className="text-sm font-mono text-muted-foreground">
          Review your data and configure primary keys before analysis.
        </p>
      </div>

      {/* Stats */}
      <div className="panel-neon rounded-lg p-5">
        <h2 className="text-sm font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Table: <span className="text-neon-green">{localTable.name}</span>
        </h2>
        <DataStatsPanel table={localTable} />
      </div>

      {/* PK Configuration */}
      <div className="panel-neon rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-mono font-semibold text-foreground">
              Primary Key Configuration
            </h2>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              {pkCount === 0
                ? "No primary key selected — click columns below or use Auto-Detect"
                : `${pkCount} column${pkCount > 1 ? "s" : ""} selected as PK${pkCount > 1 ? " (composite)" : ""}`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAutoDetect}
            className="btn-neon px-4 py-2 rounded flex items-center gap-2 text-sm"
          >
            <Wand2 size={14} />
            Auto-Detect PKs
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {localTable.columns.map((col) => {
            const candidate = pkCandidates.find((c) => c.column === col.name);
            return (
              <button
                type="button"
                key={col.name}
                onClick={() => togglePK(col.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border transition-all ${
                  col.isPrimaryKey
                    ? "bg-neon-green/15 border-neon-green/60 text-neon-green shadow-neon"
                    : candidate?.isCandidate
                      ? "bg-secondary border-neon-green/20 text-muted-foreground hover:border-neon-green/40"
                      : "bg-secondary border-border text-muted-foreground hover:border-border/80"
                }`}
              >
                {col.isPrimaryKey && <Key size={10} />}
                {col.name}
                <span className="opacity-50">:{col.type}</span>
                {candidate && (
                  <span
                    className={`ml-1 opacity-60 ${col.isPrimaryKey ? "" : "text-neon-green/60"}`}
                  >
                    {Math.round(candidate.uniqueness * 100)}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {pkCount === 0 && (
          <div className="text-xs font-mono text-yellow-400/80 bg-yellow-400/5 border border-yellow-400/20 rounded p-2">
            ⚠ Without a primary key, partial dependency analysis (2NF) will be
            limited.
          </div>
        )}
      </div>

      {/* Data Preview */}
      <div className="panel-neon rounded-lg p-5 space-y-3">
        <h2 className="text-sm font-mono font-semibold text-foreground">
          Data Preview
        </h2>
        <PreviewGrid table={localTable} maxRows={10} />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="btn-cyan px-4 py-2 rounded flex items-center gap-2 text-sm"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <button
          type="button"
          onClick={handleProceed}
          className="btn-neon px-6 py-2.5 rounded flex items-center gap-2 text-sm"
        >
          Proceed to Analysis <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
