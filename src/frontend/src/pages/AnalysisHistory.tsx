import { useNavigate } from "@tanstack/react-router";
import {
  Award,
  Calendar,
  Database,
  ExternalLink,
  History,
  Loader2,
  Lock,
  Trash2,
} from "lucide-react";
import React from "react";
import { setAnalysisResult, setCurrentTable } from "../App";
import type { AnalysisRecord } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useDeleteAnalysis, useGetMyAnalyses } from "../hooks/useQueries";
import type { AnalysisResult } from "../types/analysis";
import type { TableData } from "../types/schema";

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const GRADE_COLORS: Record<string, string> = {
  A: "text-neon-green border-neon-green/40 bg-neon-green/10",
  B: "text-neon-cyan border-neon-cyan/40 bg-neon-cyan/10",
  C: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
  D: "text-orange-400 border-orange-400/40 bg-orange-400/10",
  F: "text-destructive border-destructive/40 bg-destructive/10",
};

function HistoryCard({
  record,
  onLoad,
  onDelete,
}: {
  record: AnalysisRecord;
  onLoad: () => void;
  onDelete: () => void;
}) {
  const { mutate: deleteAnalysis, isPending: isDeleting } = useDeleteAnalysis();
  const gradeColor = GRADE_COLORS[record.grade] || GRADE_COLORS.F;

  const handleDelete = () => {
    deleteAnalysis(record.id);
    onDelete();
  };

  return (
    <div className="panel-neon rounded-lg p-4 hover:border-neon-green/40 transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-mono font-semibold text-sm text-foreground truncate">
              {record.analysisName}
            </h3>
            <span
              className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${gradeColor}`}
            >
              {record.grade}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-1">
              <Database size={10} />
              {record.tableName}
            </span>
            <span className="flex items-center gap-1">
              <Award size={10} />
              Score:{" "}
              <span className="text-foreground">
                {Number(record.healthScore)}/100
              </span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              {formatDate(record.createdAt)}
            </span>
          </div>

          {record.violationsSummary && (
            <p className="text-xs font-mono text-muted-foreground/60 mt-1.5 truncate">
              {record.violationsSummary}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={onLoad}
            className="btn-neon p-2 rounded text-xs flex items-center gap-1"
            title="Load this analysis"
          >
            <ExternalLink size={12} />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors border border-transparent hover:border-destructive/30"
            title="Delete"
          >
            {isDeleting ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Trash2 size={12} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AnalysisHistory() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: analyses, isLoading, error } = useGetMyAnalyses();

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Lock size={48} className="text-muted-foreground" />
        <h2 className="text-xl font-mono font-bold text-foreground">
          Authentication Required
        </h2>
        <p className="text-sm font-mono text-muted-foreground text-center max-w-sm">
          Please log in to view your analysis history. Your saved analyses are
          securely stored on-chain.
        </p>
      </div>
    );
  }

  const handleLoad = (record: AnalysisRecord) => {
    // Reconstruct a minimal AnalysisResult from the saved record
    const reconstructed: AnalysisResult = {
      tableName: record.tableName,
      functionalDependencies: [],
      candidateKeys: [],
      violations: [],
      anomalies: [],
      hiddenEntities: [],
      healthScore: Number(record.healthScore),
      grade: record.grade,
      highestNormalForm: "BCNF",
      generatedSQL: record.generatedSQL
        ? record.generatedSQL.split("\n\n").filter(Boolean)
        : [],
      violationsSummary: record.violationsSummary,
    };

    const minimalTable: TableData = {
      name: record.tableName,
      columns: [],
      rows: [],
    };

    setCurrentTable(minimalTable);
    setAnalysisResult(reconstructed);
    navigate({ to: "/results" });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-mono font-bold neon-text">
          <span className="text-muted-foreground">&gt; </span>
          Analysis History
        </h1>
        <p className="text-sm font-mono text-muted-foreground">
          Your saved schema analyses, stored securely on-chain.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 gap-3">
          <Loader2 size={20} className="animate-spin text-neon-green" />
          <span className="font-mono text-muted-foreground">
            Loading analyses...
          </span>
        </div>
      )}

      {error && (
        <div className="panel p-4 rounded border border-destructive/30 text-destructive font-mono text-sm">
          Failed to load analyses:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
      )}

      {!isLoading && !error && analyses && analyses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <History size={48} className="text-muted-foreground/40" />
          <h3 className="text-lg font-mono font-semibold text-muted-foreground">
            No saved analyses yet
          </h3>
          <p className="text-sm font-mono text-muted-foreground/60 text-center max-w-sm">
            Run an analysis and click "Save Analysis" to store it here for
            future reference.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="btn-neon px-5 py-2 rounded text-sm"
          >
            Start New Analysis
          </button>
        </div>
      )}

      {!isLoading && analyses && analyses.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-mono text-muted-foreground">
            {analyses.length} saved analysis{analyses.length > 1 ? "es" : ""}
          </p>
          {analyses.map((record) => (
            <HistoryCard
              key={String(record.id)}
              record={record}
              onLoad={() => handleLoad(record)}
              onDelete={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}
