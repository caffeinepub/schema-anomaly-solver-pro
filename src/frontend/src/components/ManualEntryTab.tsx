import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Key, Link, Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import type { Column, ColumnType, TableData } from "../types/schema";

const COLUMN_TYPES: ColumnType[] = [
  "INT",
  "VARCHAR",
  "TEXT",
  "FLOAT",
  "BOOLEAN",
  "DATE",
  "TIMESTAMP",
  "BIGINT",
  "DECIMAL",
  "CHAR",
];

interface ManualEntryTabProps {
  table: TableData;
  onChange: (table: TableData) => void;
}

export default function ManualEntryTab({
  table,
  onChange,
}: ManualEntryTabProps) {
  const updateTableName = (name: string) => onChange({ ...table, name });

  const addColumn = () => {
    const newCol: Column = {
      name: `col${table.columns.length + 1}`,
      type: "VARCHAR",
      isPrimaryKey: false,
      isForeignKey: false,
    };
    onChange({ ...table, columns: [...table.columns, newCol] });
  };

  const removeColumn = (idx: number) => {
    const cols = table.columns.filter((_, i) => i !== idx);
    const rows = table.rows.map((r) => {
      const newRow = { ...r };
      delete newRow[table.columns[idx].name];
      return newRow;
    });
    onChange({ ...table, columns: cols, rows });
  };

  const updateColumn = (idx: number, updates: Partial<Column>) => {
    const cols = [...table.columns];
    const oldName = cols[idx].name;
    cols[idx] = { ...cols[idx], ...updates };
    // Rename in rows if name changed
    if (updates.name && updates.name !== oldName) {
      const rows = table.rows.map((r) => {
        const newRow = { ...r };
        newRow[updates.name!] = newRow[oldName] ?? "";
        delete newRow[oldName];
        return newRow;
      });
      onChange({ ...table, columns: cols, rows });
    } else {
      onChange({ ...table, columns: cols });
    }
  };

  const addRow = () => {
    const newRow: Record<string, string> = {};
    for (const c of table.columns) {
      newRow[c.name] = "";
    }
    onChange({ ...table, rows: [...table.rows, newRow] });
  };

  const removeRow = (idx: number) => {
    onChange({ ...table, rows: table.rows.filter((_, i) => i !== idx) });
  };

  const updateCell = (rowIdx: number, colName: string, value: string) => {
    const rows = [...table.rows];
    rows[rowIdx] = { ...rows[rowIdx], [colName]: value };
    onChange({ ...table, rows });
  };

  return (
    <div className="space-y-5">
      {/* Table Name */}
      <div className="flex items-center gap-3">
        <label
          htmlFor="table-name-input"
          className="text-sm font-mono text-muted-foreground whitespace-nowrap"
        >
          Table Name:
        </label>
        <Input
          id="table-name-input"
          value={table.name}
          onChange={(e) => updateTableName(e.target.value)}
          placeholder="my_table"
          className="bg-input border-border font-mono text-sm max-w-xs focus:border-neon-green"
        />
      </div>

      {/* Columns */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-mono font-semibold text-neon-green">
            Columns
          </h3>
          <button
            type="button"
            onClick={addColumn}
            className="btn-neon px-3 py-1 rounded text-xs flex items-center gap-1"
          >
            <Plus size={12} /> Add Column
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {table.columns.length === 0 && (
            <p className="text-xs text-muted-foreground font-mono text-center py-4">
              No columns yet. Click "Add Column" to start.
            </p>
          )}
          {table.columns.map((col, idx) => (
            <div
              key={col.name || `col-${idx}`}
              className="flex items-center gap-2 panel p-2 rounded"
            >
              <Input
                value={col.name}
                onChange={(e) => updateColumn(idx, { name: e.target.value })}
                placeholder="column_name"
                className="bg-input border-border font-mono text-xs h-8 flex-1 min-w-0"
              />
              <Select
                value={col.type}
                onValueChange={(v) =>
                  updateColumn(idx, { type: v as ColumnType })
                }
              >
                <SelectTrigger className="w-28 h-8 bg-input border-border font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border font-mono text-xs">
                  {COLUMN_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() =>
                  updateColumn(idx, { isPrimaryKey: !col.isPrimaryKey })
                }
                title="Toggle Primary Key"
                className={`p-1.5 rounded transition-colors ${col.isPrimaryKey ? "text-neon-green bg-neon-green/15" : "text-muted-foreground hover:text-neon-green"}`}
              >
                <Key size={12} />
              </button>
              <button
                type="button"
                onClick={() =>
                  updateColumn(idx, { isForeignKey: !col.isForeignKey })
                }
                title="Toggle Foreign Key"
                className={`p-1.5 rounded transition-colors ${col.isForeignKey ? "text-neon-cyan bg-neon-cyan/15" : "text-muted-foreground hover:text-neon-cyan"}`}
              >
                <Link size={12} />
              </button>
              <button
                type="button"
                onClick={() => removeColumn(idx)}
                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sample Data Rows */}
      {table.columns.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-semibold text-neon-cyan">
              Sample Data Rows
            </h3>
            <button
              type="button"
              onClick={addRow}
              className="btn-cyan px-3 py-1 rounded text-xs flex items-center gap-1"
            >
              <Plus size={12} /> Add Row
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border">
                  {table.columns.map((col) => (
                    <th
                      key={col.name}
                      className="px-2 py-1.5 text-left text-muted-foreground font-normal"
                    >
                      {col.name}
                      {col.isPrimaryKey && (
                        <span className="text-neon-green ml-1">PK</span>
                      )}
                      {col.isForeignKey && (
                        <span className="text-neon-cyan ml-1">FK</span>
                      )}
                    </th>
                  ))}
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {table.rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={table.columns.length + 1}
                      className="text-center text-muted-foreground py-3"
                    >
                      No rows yet
                    </td>
                  </tr>
                )}
                {table.rows.map((row, rIdx) => (
                  <tr
                    key={`${table.columns.map((c) => row[c.name] ?? "").join("|")}|${rIdx}`}
                    className="border-b border-border/30 hover:bg-secondary/20"
                  >
                    {table.columns.map((col) => (
                      <td key={col.name} className="px-1 py-1">
                        <Input
                          value={row[col.name] ?? ""}
                          onChange={(e) =>
                            updateCell(rIdx, col.name, e.target.value)
                          }
                          className="h-7 bg-input border-border font-mono text-xs px-2"
                        />
                      </td>
                    ))}
                    <td className="px-1">
                      <button
                        type="button"
                        onClick={() => removeRow(rIdx)}
                        className="p-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
