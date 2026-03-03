import { ChevronDown, ChevronUp, Eraser, Filter } from "lucide-react";
import React, { useState } from "react";
import type { TableData } from "../types/schema";
import PreviewGrid from "./PreviewGrid";

interface NormalizationToolsProps {
  table: TableData;
}

export default function NormalizationTools({ table }: NormalizationToolsProps) {
  const [showDedup, setShowDedup] = useState(false);
  const [showNullHandled, setShowNullHandled] = useState(false);

  const dedupTable: TableData = {
    ...table,
    rows: table.rows.filter((row, idx, arr) => {
      const key = JSON.stringify(row);
      return arr.findIndex((r) => JSON.stringify(r) === key) === idx;
    }),
  };

  const nullHandledTable: TableData = {
    ...table,
    rows: table.rows.map((row) => {
      const newRow = { ...row };
      for (const col of table.columns) {
        if (
          newRow[col.name] === "" ||
          newRow[col.name] === undefined ||
          newRow[col.name] === null
        ) {
          if (
            col.type === "INT" ||
            col.type === "FLOAT" ||
            col.type === "BIGINT" ||
            col.type === "DECIMAL"
          ) {
            newRow[col.name] = "0";
          } else if (col.type === "BOOLEAN") {
            newRow[col.name] = "false";
          } else {
            newRow[col.name] = "N/A";
          }
        }
      }
      return newRow;
    }),
  };

  const dupCount = table.rows.length - dedupTable.rows.length;
  const nullCount = table.rows.reduce((acc, row) => {
    return acc + table.columns.filter((col) => !row[col.name]).length;
  }, 0);

  return (
    <div className="space-y-3">
      {/* De-duplication */}
      <div className="panel rounded overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDedup(!showDedup)}
          className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Filter size={16} className="text-neon-green" />
            <div className="text-left">
              <div className="text-sm font-mono font-semibold text-foreground">
                De-duplication Preview
              </div>
              <div className="text-xs font-mono text-muted-foreground">
                {dupCount > 0 ? (
                  <span className="text-destructive">
                    {dupCount} duplicate row{dupCount > 1 ? "s" : ""} found
                  </span>
                ) : (
                  <span className="text-neon-green">No duplicates found</span>
                )}
                {" · "}
                {dedupTable.rows.length} rows after dedup
              </div>
            </div>
          </div>
          {showDedup ? (
            <ChevronUp size={14} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={14} className="text-muted-foreground" />
          )}
        </button>
        {showDedup && (
          <div className="border-t border-border p-4">
            <PreviewGrid table={dedupTable} maxRows={8} />
          </div>
        )}
      </div>

      {/* NULL Handling */}
      <div className="panel rounded overflow-hidden">
        <button
          type="button"
          onClick={() => setShowNullHandled(!showNullHandled)}
          className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Eraser size={16} className="text-neon-cyan" />
            <div className="text-left">
              <div className="text-sm font-mono font-semibold text-foreground">
                NULL Handling Preview
              </div>
              <div className="text-xs font-mono text-muted-foreground">
                {nullCount > 0 ? (
                  <span className="text-yellow-400">
                    {nullCount} null value{nullCount > 1 ? "s" : ""} replaced
                    with defaults
                  </span>
                ) : (
                  <span className="text-neon-green">No null values found</span>
                )}
              </div>
            </div>
          </div>
          {showNullHandled ? (
            <ChevronUp size={14} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={14} className="text-muted-foreground" />
          )}
        </button>
        {showNullHandled && (
          <div className="border-t border-border p-4">
            <p className="text-xs font-mono text-muted-foreground mb-3">
              Nulls replaced: INT/FLOAT → 0, BOOLEAN → false, TEXT/VARCHAR →
              "N/A"
            </p>
            <PreviewGrid table={nullHandledTable} maxRows={8} />
          </div>
        )}
      </div>
    </div>
  );
}
