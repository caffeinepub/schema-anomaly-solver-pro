import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Code2,
  Database,
  Key,
  Map as MapIcon,
  Save,
  Wrench,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import DependencyMap from "../components/DependencyMap";
import NormalizationTools from "../components/NormalizationTools";
import ProgressIndicator from "../components/ProgressIndicator";
import RCACard from "../components/RCACard";
import SQLFixGenerator from "../components/SQLFixGenerator";
import SaveAnalysisModal from "../components/SaveAnalysisModal";
import SeverityScorePanel from "../components/SeverityScorePanel";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import type { AnalysisResult } from "../types/analysis";
import type { TableData } from "../types/schema";

interface ResultsDashboardProps {
  result: AnalysisResult;
  table: TableData;
}

const NF_COLORS: Record<string, string> = {
  "1NF": "border-red-500/40 bg-red-500/10 text-red-400",
  "2NF": "border-orange-500/40 bg-orange-500/10 text-orange-400",
  "3NF": "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
  BCNF: "border-blue-500/40 bg-blue-500/10 text-blue-400",
  "4NF": "border-purple-500/40 bg-purple-500/10 text-purple-400",
  "5NF": "border-pink-500/40 bg-pink-500/10 text-pink-400",
};

const NF_DESCRIPTIONS: Record<string, string> = {
  "4NF":
    "Multi-Valued Dependency (MVD) — independent multi-valued facts stored in the same table.",
  "5NF":
    "Join Dependency — cyclic constraint that cannot be losslessly decomposed into fewer projections.",
};

export default function ResultsDashboard({
  result,
  table,
}: ResultsDashboardProps) {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const [showSaveModal, setShowSaveModal] = useState(false);

  const violations4NF = result.violations.filter((v) => v.normalForm === "4NF");
  const violations5NF = result.violations.filter((v) => v.normalForm === "5NF");
  const coreViolations = result.violations.filter(
    (v) => !["4NF", "5NF"].includes(v.normalForm),
  );

  return (
    <div className="space-y-6">
      <ProgressIndicator currentStep={4} />

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-mono font-bold neon-text">
            <span className="text-muted-foreground">&gt; </span>
            Step 4: Analysis Results
          </h1>
          <p className="text-sm font-mono text-muted-foreground">
            Schema analysis for{" "}
            <span className="text-neon-green font-semibold">
              {result.tableName}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-ocid="results.new_analysis_button"
            onClick={() => navigate({ to: "/" })}
            className="btn-cyan px-4 py-2 rounded flex items-center gap-2 text-sm"
          >
            <ArrowLeft size={14} /> New Analysis
          </button>
          {isAuthenticated && (
            <button
              type="button"
              data-ocid="results.save_button"
              onClick={() => setShowSaveModal(true)}
              className="btn-neon px-4 py-2 rounded flex items-center gap-2 text-sm"
            >
              <Save size={14} /> Save Analysis
            </button>
          )}
        </div>
      </div>

      {/* Severity Score */}
      <SeverityScorePanel
        score={result.healthScore}
        grade={result.grade}
        highestNF={result.highestNormalForm}
        violationCount={result.violations.length}
      />

      {/* Candidate Keys */}
      {result.candidateKeys && result.candidateKeys.length > 0 && (
        <div
          className="panel-neon rounded-lg p-4 space-y-2"
          data-ocid="results.candidate_keys_panel"
        >
          <h2 className="text-sm font-mono font-semibold text-foreground flex items-center gap-2">
            <Key size={14} className="text-neon-cyan" />
            Candidate Keys Detected
          </h2>
          <div className="flex flex-wrap gap-2">
            {result.candidateKeys.map((ck, i) => (
              <span
                key={ck.join(",")}
                data-ocid={`results.candidate_key.${i + 1}`}
                className="text-xs font-mono px-2.5 py-1 rounded border border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan"
              >
                CK{i + 1}: ({ck.join(", ")})
              </span>
            ))}
          </div>
          <p className="text-xs font-mono text-muted-foreground">
            Candidate keys are minimal superkeys — any of these uniquely
            identifies a row.
          </p>
        </div>
      )}

      {/* Violations Summary */}
      {coreViolations.length > 0 && (
        <div
          className="panel rounded-lg p-4 border border-destructive/20 bg-destructive/5"
          data-ocid="results.violations_panel"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-destructive" />
            <h2 className="text-sm font-mono font-semibold text-destructive">
              {coreViolations.length} Core Violation
              {coreViolations.length > 1 ? "s" : ""} Detected (1NF–BCNF)
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {coreViolations.map((v, i) => (
              <span
                key={`${v.normalForm}-${v.affectedColumns.join(",")}`}
                data-ocid={`results.violation.${i + 1}`}
                className={`text-xs font-mono px-2 py-0.5 rounded border ${NF_COLORS[v.normalForm] ?? "border-border text-muted-foreground"}`}
              >
                [{v.normalForm}] {v.affectedColumns.slice(0, 3).join(", ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 4NF Violations */}
      {violations4NF.length > 0 && (
        <div
          className="panel rounded-lg p-4 border border-purple-500/20 bg-purple-500/5"
          data-ocid="results.violations_4nf_panel"
        >
          <div className="flex items-center gap-2 mb-2">
            <Database size={14} className="text-purple-400" />
            <h2 className="text-sm font-mono font-semibold text-purple-400">
              {violations4NF.length} 4NF Violation
              {violations4NF.length > 1 ? "s" : ""} — Multi-Valued Dependencies
            </h2>
          </div>
          <p className="text-xs font-mono text-muted-foreground mb-3">
            {NF_DESCRIPTIONS["4NF"]}
          </p>
          <div className="space-y-2">
            {violations4NF.map((v, i) => (
              <div
                key={`4nf-${v.affectedColumns.join(",")}`}
                data-ocid={`results.violation_4nf.${i + 1}`}
                className="text-xs font-mono p-2 rounded border border-purple-500/20 bg-purple-500/5"
              >
                <span className="text-purple-400 font-semibold">[MVD] </span>
                <span className="text-foreground">{v.description}</span>
                <div className="mt-1 text-muted-foreground">
                  Fix: Split into separate tables — one for each independent
                  multi-valued fact.
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5NF Violations */}
      {violations5NF.length > 0 && (
        <div
          className="panel rounded-lg p-4 border border-pink-500/20 bg-pink-500/5"
          data-ocid="results.violations_5nf_panel"
        >
          <div className="flex items-center gap-2 mb-2">
            <Database size={14} className="text-pink-400" />
            <h2 className="text-sm font-mono font-semibold text-pink-400">
              {violations5NF.length} 5NF Violation
              {violations5NF.length > 1 ? "s" : ""} — Join Dependencies
            </h2>
          </div>
          <p className="text-xs font-mono text-muted-foreground mb-3">
            {NF_DESCRIPTIONS["5NF"]}
          </p>
          <div className="space-y-2">
            {violations5NF.map((v, i) => (
              <div
                key={`5nf-${v.affectedColumns.join(",")}`}
                data-ocid={`results.violation_5nf.${i + 1}`}
                className="text-xs font-mono p-2 rounded border border-pink-500/20 bg-pink-500/5"
              >
                <span className="text-pink-400 font-semibold">[JD] </span>
                <span className="text-foreground">{v.description}</span>
                <div className="mt-1 text-muted-foreground">
                  Fix: Decompose into 3 binary tables — one for each pair of the
                  cyclic columns.
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.violations.length === 0 && (
        <div className="panel rounded-lg p-4 border border-neon-green/20 bg-neon-green/5">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-neon-green" />
            <p className="text-sm font-mono text-neon-green font-semibold">
              ✓ No violations found — schema passes all normal forms through
              5NF!
            </p>
          </div>
        </div>
      )}

      {/* Hidden Entities */}
      {result.hiddenEntities.length > 0 && (
        <div
          className="panel-neon rounded-lg p-5 space-y-3"
          data-ocid="results.hidden_entities_panel"
        >
          <h2 className="text-sm font-mono font-semibold text-foreground flex items-center gap-2">
            <Zap size={14} className="text-neon-cyan" />
            Hidden Entities Detected ({result.hiddenEntities.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.hiddenEntities.map((entity, i) => (
              <div
                key={entity.suggestedTableName}
                data-ocid={`results.hidden_entity.${i + 1}`}
                className={`panel p-3 rounded border ${entity.type === "Partial" ? "border-yellow-400/30" : "border-neon-cyan/30"}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-sm text-foreground">
                    {entity.suggestedTableName}
                  </span>
                  <span
                    className={`text-xs font-mono px-1.5 py-0.5 rounded ${entity.type === "Partial" ? "text-yellow-400 bg-yellow-400/10" : "text-neon-cyan bg-neon-cyan/10"}`}
                  >
                    {entity.type}
                  </span>
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                  Key:{" "}
                  <span className="text-neon-green">
                    {entity.determinant.join(", ")}
                  </span>
                </div>
                <div className="text-xs font-mono text-muted-foreground mt-0.5">
                  Cols: {entity.columns.join(", ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RCA Cards */}
      {result.anomalies.length > 0 && (
        <div className="space-y-3" data-ocid="results.anomalies_section">
          <h2 className="text-sm font-mono font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle size={14} className="text-yellow-400" />
            Root Cause Analysis — {result.anomalies.length} Anomal
            {result.anomalies.length > 1 ? "ies" : "y"} Detected
          </h2>
          {result.anomalies.map((anomaly, i) => (
            <RCACard
              key={`${anomaly.type}-${anomaly.fd.determinant.join(",")}-${i}`}
              anomaly={anomaly}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Dependency Map */}
      <div
        className="panel-neon rounded-lg p-5 space-y-3"
        data-ocid="results.dependency_map_panel"
      >
        <h2 className="text-sm font-mono font-semibold text-foreground flex items-center gap-2">
          <MapIcon size={14} className="text-neon-cyan" />
          Visual Dependency Map
        </h2>
        <DependencyMap table={table} fds={result.functionalDependencies} />
      </div>

      {/* SQL Fix Generator */}
      <div
        className="panel-neon rounded-lg p-5 space-y-3"
        data-ocid="results.sql_fixes_panel"
      >
        <h2 className="text-sm font-mono font-semibold text-foreground flex items-center gap-2">
          <Code2 size={14} className="text-neon-green" />
          Generated SQL Fixes
        </h2>
        <p className="text-xs font-mono text-muted-foreground">
          Decomposed schema compliant with 2NF/3NF based on discovered
          functional dependencies.
        </p>
        <SQLFixGenerator sqls={result.generatedSQL} />
      </div>

      {/* Normalization Tools */}
      <div
        className="panel-neon rounded-lg p-5 space-y-3"
        data-ocid="results.normalization_tools_panel"
      >
        <h2 className="text-sm font-mono font-semibold text-foreground flex items-center gap-2">
          <Wrench size={14} className="text-neon-green" />
          Normalization Tools
        </h2>
        <NormalizationTools table={table} />
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <SaveAnalysisModal
          open={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          result={result}
        />
      )}
    </div>
  );
}
