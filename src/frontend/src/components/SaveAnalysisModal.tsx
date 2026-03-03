import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader2, Save } from "lucide-react";
import React, { useState } from "react";
import { useSaveAnalysis } from "../hooks/useQueries";
import type { AnalysisResult } from "../types/analysis";

interface SaveAnalysisModalProps {
  open: boolean;
  onClose: () => void;
  result: AnalysisResult;
}

export default function SaveAnalysisModal({
  open,
  onClose,
  result,
}: SaveAnalysisModalProps) {
  const [name, setName] = useState(`${result.tableName} Analysis`);
  const [saved, setSaved] = useState(false);
  const { mutate: saveAnalysis, isPending, error } = useSaveAnalysis();

  const handleSave = () => {
    if (!name.trim()) return;
    saveAnalysis(
      {
        analysisName: name.trim(),
        tableName: result.tableName,
        healthScore: result.healthScore,
        grade: result.grade,
        violationsSummary: result.violationsSummary,
        generatedSQL: result.generatedSQL.join("\n\n"),
      },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => {
            setSaved(false);
            onClose();
          }, 1500);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="panel-neon border-0 max-w-md">
        <DialogHeader>
          <DialogTitle className="neon-text font-mono text-lg flex items-center gap-2">
            <Save size={18} />
            Save Analysis
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-mono text-sm">
            Save this analysis to your history for future reference.
          </DialogDescription>
        </DialogHeader>

        {saved ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle size={40} className="text-neon-green" />
            <p className="font-mono text-neon-green font-semibold">
              Analysis saved successfully!
            </p>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label
                htmlFor="analysis-name"
                className="text-foreground font-mono text-sm"
              >
                Analysis Name
              </Label>
              <Input
                id="analysis-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-input border-border font-mono focus:border-neon-green"
                autoFocus
              />
            </div>

            <div className="panel p-3 rounded space-y-1 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Table:</span>
                <span className="text-foreground">{result.tableName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grade:</span>
                <span className="text-neon-green font-bold">
                  {result.grade}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Health Score:</span>
                <span className="text-neon-green">
                  {result.healthScore}/100
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Violations:</span>
                <span
                  className={
                    result.violations.length > 0
                      ? "text-destructive"
                      : "text-neon-green"
                  }
                >
                  {result.violations.length}
                </span>
              </div>
            </div>

            {error && (
              <p className="text-xs font-mono text-destructive">
                Failed to save:{" "}
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
            )}

            <DialogFooter className="gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!name.trim() || isPending}
                className="btn-neon px-5 py-2 rounded flex items-center gap-2 text-sm"
              >
                {isPending && <Loader2 size={14} className="animate-spin" />}
                {isPending ? "Saving..." : "Save"}
              </button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
