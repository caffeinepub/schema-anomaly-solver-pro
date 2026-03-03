import type { TableData } from "../types/schema";

export interface PKCandidate {
  column: string;
  uniqueness: number; // 0-1
  nullCount: number;
  isCandidate: boolean;
}

export function detectPrimaryKeys(table: TableData): PKCandidate[] {
  const { columns, rows } = table;
  if (rows.length === 0)
    return columns.map((c) => ({
      column: c.name,
      uniqueness: 1,
      nullCount: 0,
      isCandidate: false,
    }));

  return columns.map((col) => {
    const values = rows.map((r) => r[col.name]);
    const nullCount = values.filter(
      (v) => v === "" || v === null || v === undefined,
    ).length;
    const nonNullValues = values.filter(
      (v) => v !== "" && v !== null && v !== undefined,
    );
    const uniqueValues = new Set(nonNullValues).size;
    const uniqueness =
      nonNullValues.length > 0 ? uniqueValues / nonNullValues.length : 0;

    // A good PK candidate: high uniqueness, low nulls, often numeric or ID-like name
    const isIdLike = /id|key|code|num|no$/i.test(col.name);
    const isCandidate =
      uniqueness >= 0.95 && nullCount === 0 && (isIdLike || uniqueness === 1);

    return { column: col.name, uniqueness, nullCount, isCandidate };
  });
}

export function countNulls(table: TableData): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const col of table.columns) {
    counts[col.name] = table.rows.filter(
      (r) =>
        r[col.name] === "" || r[col.name] === null || r[col.name] === undefined,
    ).length;
  }
  return counts;
}
