import { ScrollArea } from "@/components/ui/scroll-area";
import { Key, Link } from "lucide-react";
import React from "react";
import type { TableData } from "../types/schema";

interface PreviewGridProps {
  table: TableData;
  maxRows?: number;
}

export default function PreviewGrid({ table, maxRows = 10 }: PreviewGridProps) {
  const displayRows = table.rows.slice(0, maxRows);

  if (table.columns.length === 0) {
    return (
      <div className="panel p-6 rounded text-center text-muted-foreground font-mono text-sm">
        No columns defined
      </div>
    );
  }

  return (
    <div className="panel rounded overflow-hidden">
      <ScrollArea className="w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-3 py-2 text-left text-muted-foreground font-normal w-8">
                  #
                </th>
                {table.columns.map((col) => (
                  <th
                    key={col.name}
                    className="px-3 py-2 text-left font-semibold whitespace-nowrap"
                  >
                    <span
                      className={
                        col.isPrimaryKey
                          ? "text-neon-green"
                          : col.isForeignKey
                            ? "text-neon-cyan"
                            : "text-foreground"
                      }
                    >
                      {col.isPrimaryKey && (
                        <Key size={10} className="inline mr-1" />
                      )}
                      {col.isForeignKey && (
                        <Link size={10} className="inline mr-1" />
                      )}
                      {col.name}
                    </span>
                    <span className="text-muted-foreground/50 ml-1 font-normal">
                      {col.type}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={table.columns.length + 1}
                    className="px-3 py-4 text-center text-muted-foreground"
                  >
                    No sample data rows
                  </td>
                </tr>
              ) : (
                displayRows.map((row, rIdx) => (
                  <tr
                    key={`${table.columns.map((c) => row[c.name] ?? "").join("|")}|${rIdx}`}
                    className="border-b border-border/30 hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-3 py-1.5 text-muted-foreground/50">
                      {rIdx + 1}
                    </td>
                    {table.columns.map((col) => (
                      <td
                        key={col.name}
                        className="px-3 py-1.5 text-foreground/80 whitespace-nowrap max-w-32 truncate"
                      >
                        {row[col.name] === "" || row[col.name] === undefined ? (
                          <span className="text-muted-foreground/40 italic">
                            NULL
                          </span>
                        ) : (
                          row[col.name]
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ScrollArea>
      {table.rows.length > maxRows && (
        <div className="px-3 py-2 border-t border-border text-xs text-muted-foreground font-mono text-center">
          Showing {maxRows} of {table.rows.length} rows
        </div>
      )}
    </div>
  );
}
