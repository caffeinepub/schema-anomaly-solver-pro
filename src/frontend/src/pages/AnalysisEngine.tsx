import { useNavigate } from "@tanstack/react-router";
import { CheckCircle, Cpu, Loader2 } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ProgressIndicator from "../components/ProgressIndicator";
import { detectAnomalies } from "../engine/anomalyDetector";
import { extractHiddenEntities } from "../engine/entityExtractor";
import {
  findCandidateKeys,
  mineFunctionalDependencies,
} from "../engine/functionalDependencies";
import {
  check1NF,
  check2NF,
  check3NF,
  check4NF,
  check5NF,
  checkBCNF,
} from "../engine/normalizationChecker";
import type { AnalysisResult, NormalFormViolation } from "../types/analysis";
import type { TableData } from "../types/schema";
import {
  calculateHealthScore,
  getHighestNormalForm,
} from "../utils/scoreCalculator";
import { generateDecomposedSQL } from "../utils/sqlGenerator";

interface AnalysisStep {
  label: string;
  done: boolean;
}

interface AnalysisEngineProps {
  table: TableData;
  onComplete: (result: AnalysisResult) => void;
}

export default function AnalysisEngine({
  table,
  onComplete,
}: AnalysisEngineProps) {
  const navigate = useNavigate();
  const [steps, setSteps] = useState<AnalysisStep[]>([
    { label: "Mining Functional Dependencies...", done: false },
    { label: "Computing Candidate Keys & Closures...", done: false },
    { label: "Checking 1NF Violations...", done: false },
    { label: "Checking 2NF Violations...", done: false },
    { label: "Checking 3NF / BCNF Violations...", done: false },
    { label: "Checking 4NF (Multi-Valued Dependencies)...", done: false },
    { label: "Checking 5NF (Join Dependencies)...", done: false },
    { label: "Detecting Anomalies (Insert / Update / Delete)...", done: false },
    { label: "Extracting Hidden Entities...", done: false },
    { label: "Generating SQL Fixes...", done: false },
    { label: "Computing Health Score...", done: false },
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);

  const tableRef = useRef(table);
  const onCompleteRef = useRef(onComplete);

  const markDone = useCallback((idx: number) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, done: true } : s)),
    );
    setCurrentStep(idx + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const t = tableRef.current;
      const complete = onCompleteRef.current;
      const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

      // Step 0: FD Mining
      await delay(300);
      if (cancelled) return;
      const fds = mineFunctionalDependencies(t);
      markDone(0);

      // Step 1: Candidate Keys
      await delay(250);
      if (cancelled) return;
      const candidateKeys = findCandidateKeys(t, fds);
      markDone(1);

      // Step 2: 1NF
      await delay(250);
      if (cancelled) return;
      const violations1NF = check1NF(t);
      markDone(2);

      // Step 3: 2NF
      await delay(250);
      if (cancelled) return;
      const violations2NF = check2NF(t, fds);
      markDone(3);

      // Step 4: 3NF + BCNF
      await delay(250);
      if (cancelled) return;
      const violations3NF = check3NF(t, fds, candidateKeys);
      const violationsBCNF = checkBCNF(t, fds, candidateKeys);
      markDone(4);

      // Step 5: 4NF
      await delay(300);
      if (cancelled) return;
      const violations4NF = check4NF(t, fds);
      markDone(5);

      // Step 6: 5NF
      await delay(400);
      if (cancelled) return;
      const violations5NF = check5NF(t, fds, candidateKeys);
      markDone(6);

      // Step 7: Anomalies
      await delay(250);
      if (cancelled) return;
      const anomalies = detectAnomalies(t, fds);
      markDone(7);

      // Step 8: Entities
      await delay(250);
      if (cancelled) return;
      const entities = extractHiddenEntities(fds);
      markDone(8);

      // Step 9: SQL
      await delay(250);
      if (cancelled) return;
      const generatedSQL = generateDecomposedSQL(t, entities);
      markDone(9);

      // Step 10: Score
      await delay(200);
      if (cancelled) return;
      const allViolations: NormalFormViolation[] = [
        ...violations1NF,
        ...violations2NF,
        ...violations3NF,
        ...violationsBCNF,
        ...violations4NF,
        ...violations5NF,
      ];
      const { score, grade } = calculateHealthScore(allViolations);
      const highestNF = getHighestNormalForm(allViolations);
      markDone(10);

      const violationsSummary =
        allViolations.length === 0
          ? "No violations found. Schema is 5NF compliant."
          : allViolations
              .map((v) => `[${v.normalForm}] ${v.description}`)
              .join(" | ");

      const result: AnalysisResult = {
        tableName: t.name,
        functionalDependencies: fds,
        candidateKeys,
        violations: allViolations,
        anomalies,
        hiddenEntities: entities,
        healthScore: score,
        grade,
        highestNormalForm: highestNF as AnalysisResult["highestNormalForm"],
        generatedSQL,
        violationsSummary,
      };

      await delay(400);
      if (cancelled) return;
      setDone(true);
      complete(result);

      await delay(800);
      if (cancelled) return;
      navigate({ to: "/results" });
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [markDone, navigate]);

  return (
    <div className="space-y-6">
      <ProgressIndicator currentStep={3} />

      <div className="space-y-2">
        <h1 className="text-2xl font-mono font-bold text-neon-cyan">
          <span className="text-muted-foreground">&gt; </span>
          Step 3: Analysis Engine
        </h1>
        <p className="text-sm font-mono text-muted-foreground">
          Running full normalization analysis (1NF → 5NF) on{" "}
          <span className="text-neon-green">{table.name}</span>...
        </p>
      </div>

      <div className="panel-neon rounded-lg p-8 max-w-lg mx-auto">
        {/* Animated CPU icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <Cpu
              size={64}
              className={`${done ? "text-neon-green" : "text-neon-cyan animate-pulse-neon"}`}
              style={{ filter: "drop-shadow(0 0 12px currentColor)" }}
            />
            {!done && (
              <div className="absolute -inset-4 border border-neon-cyan/20 rounded-full animate-ping" />
            )}
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, idx) => {
            const isActive = idx === currentStep && !done;
            const isDone = step.done;
            return (
              <div
                key={step.label}
                className={`flex items-center gap-3 transition-all duration-300 ${
                  isDone
                    ? "opacity-100"
                    : isActive
                      ? "opacity-100"
                      : "opacity-30"
                }`}
              >
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                  {isDone ? (
                    <CheckCircle size={16} className="text-neon-green" />
                  ) : isActive ? (
                    <Loader2
                      size={16}
                      className="text-neon-cyan animate-spin"
                    />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-border" />
                  )}
                </div>
                <span
                  className={`text-sm font-mono ${isDone ? "text-neon-green" : isActive ? "text-neon-cyan" : "text-muted-foreground"}`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {done && (
          <div className="mt-6 text-center">
            <p className="text-neon-green font-mono font-semibold animate-pulse-neon">
              ✓ Analysis Complete — Redirecting to Results...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
