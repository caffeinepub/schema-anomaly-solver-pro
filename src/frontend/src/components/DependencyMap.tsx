import { ArrowRight } from "lucide-react";
import React from "react";
import type { FunctionalDependency } from "../types/analysis";
import type { TableData } from "../types/schema";

interface DependencyMapProps {
  table: TableData;
  fds: FunctionalDependency[];
}

export default function DependencyMap({ table, fds }: DependencyMapProps) {
  const pkCols = table.columns.filter((c) => c.isPrimaryKey).map((c) => c.name);
  const nonPkCols = table.columns
    .filter((c) => !c.isPrimaryKey)
    .map((c) => c.name);

  const directDeps = fds.filter(
    (fd) => fd.type === "full" || fd.type === "direct",
  );
  const partialDeps = fds.filter((fd) => fd.type === "partial");
  const transitiveDeps = fds.filter((fd) => fd.type === "transitive");

  const FDRow = ({
    fd,
    color,
    label,
  }: { fd: FunctionalDependency; color: string; label: string }) => (
    <div className="flex items-center gap-2 py-1.5 border-b border-border/20 last:border-0">
      <span
        className={`text-xs font-mono px-1.5 py-0.5 rounded border ${color} flex-shrink-0`}
      >
        {label}
      </span>
      <div className="flex items-center gap-1 font-mono text-xs flex-wrap">
        <span className="text-neon-green font-semibold">
          {fd.determinant.join(", ")}
        </span>
        <ArrowRight size={12} className="text-muted-foreground flex-shrink-0" />
        <span className="text-neon-cyan">{fd.dependent.join(", ")}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* ASCII-style diagram */}
      <div className="code-block text-xs leading-relaxed">
        <div className="text-muted-foreground mb-2">
          -- Dependency Map: {table.name} --
        </div>
        {pkCols.length > 0 && (
          <>
            <div className="text-neon-green font-bold">
              PK: [{pkCols.join(", ")}]
            </div>
            <div className="ml-4 mt-1 space-y-0.5">
              {nonPkCols.map((col) => {
                const isDirect = directDeps.some((fd) =>
                  fd.dependent.includes(col),
                );
                const isPartial = partialDeps.some((fd) =>
                  fd.dependent.includes(col),
                );
                const isTransitive = transitiveDeps.some((fd) =>
                  fd.dependent.includes(col),
                );
                const arrow = isDirect
                  ? "├──▶"
                  : isPartial
                    ? "├─?▶"
                    : isTransitive
                      ? "├──⟶"
                      : "├───";
                const colColor = isDirect
                  ? "text-neon-green"
                  : isPartial
                    ? "text-yellow-400"
                    : isTransitive
                      ? "text-neon-cyan"
                      : "text-muted-foreground";
                const tag = isDirect
                  ? ""
                  : isPartial
                    ? " [PARTIAL]"
                    : isTransitive
                      ? " [TRANSITIVE]"
                      : " [?]";
                return (
                  <div key={col} className="flex items-center gap-1">
                    <span className="text-muted-foreground">{arrow}</span>
                    <span className={colColor}>{col}</span>
                    {tag && (
                      <span className="text-xs text-muted-foreground/60">
                        {tag}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
        {transitiveDeps.length > 0 && (
          <div className="mt-3">
            <div className="text-neon-cyan">Transitive Chains:</div>
            {transitiveDeps.map((fd) => (
              <div
                key={`${fd.determinant.join(",")}->${fd.dependent.join(",")}`}
                className="ml-4 text-neon-cyan/70"
              >
                {fd.determinant.join(", ")} ──⟶ {fd.dependent.join(", ")}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs font-mono">
        <span className="flex items-center gap-1.5 text-neon-green">
          <span className="w-3 h-0.5 bg-neon-green inline-block" />
          Direct (Full FD)
        </span>
        <span className="flex items-center gap-1.5 text-yellow-400">
          <span className="w-3 h-0.5 bg-yellow-400 inline-block" />
          Partial Dependency
        </span>
        <span className="flex items-center gap-1.5 text-neon-cyan">
          <span className="w-3 h-0.5 bg-neon-cyan inline-block" />
          Transitive Dependency
        </span>
      </div>

      {/* FD List */}
      {fds.length > 0 && (
        <div className="panel rounded p-3 space-y-0">
          <h4 className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            All Functional Dependencies
          </h4>
          {directDeps.map((fd) => (
            <FDRow
              key={`d-${fd.determinant.join(",")}->${fd.dependent.join(",")}`}
              fd={fd}
              color="text-neon-green border-neon-green/30 bg-neon-green/5"
              label="FULL"
            />
          ))}
          {partialDeps.map((fd) => (
            <FDRow
              key={`p-${fd.determinant.join(",")}->${fd.dependent.join(",")}`}
              fd={fd}
              color="text-yellow-400 border-yellow-400/30 bg-yellow-400/5"
              label="PARTIAL"
            />
          ))}
          {transitiveDeps.map((fd) => (
            <FDRow
              key={`t-${fd.determinant.join(",")}->${fd.dependent.join(",")}`}
              fd={fd}
              color="text-neon-cyan border-neon-cyan/30 bg-neon-cyan/5"
              label="TRANSITIVE"
            />
          ))}
        </div>
      )}
    </div>
  );
}
