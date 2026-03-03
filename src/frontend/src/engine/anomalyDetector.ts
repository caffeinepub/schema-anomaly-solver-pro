import type { Anomaly, FunctionalDependency } from "../types/analysis";
import type { TableData } from "../types/schema";

function getSamples(
  rows: Record<string, string>[],
  fd: FunctionalDependency,
  isGood: boolean,
): Record<string, string>[] {
  const { determinant, dependent } = fd;
  const allCols = [...determinant, ...dependent];

  if (isGood) {
    // Good samples: unique determinant values (FD holds cleanly)
    const seen = new Set<string>();
    return rows
      .filter((row) => {
        const key = determinant.map((d) => row[d]).join("|");
        if (!seen.has(key)) {
          seen.add(key);
          return true;
        }
        return false;
      })
      .slice(0, 3)
      .map((r) => {
        const sample: Record<string, string> = {};
        for (const c of allCols) {
          sample[c] = r[c] ?? "";
        }
        return sample;
      });
  }

  // Bad samples: rows that demonstrate the anomaly (repeated determinant, same dependent values = redundancy)
  const grouped = new Map<string, Record<string, string>[]>();
  for (const row of rows) {
    const key = determinant.map((d) => row[d]).join("|");
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(row);
  }

  const badRows: Record<string, string>[] = [];
  for (const group of grouped.values()) {
    if (group.length > 1) {
      for (const r of group.slice(0, 2)) {
        const sample: Record<string, string> = {};
        for (const c of allCols) {
          sample[c] = r[c] ?? "";
        }
        badRows.push(sample);
      }
    }
  }

  if (badRows.length === 0) {
    // Simulate bad samples to illustrate the anomaly
    return rows.slice(0, 2).map((r) => {
      const sample: Record<string, string> = {};
      for (const c of allCols) {
        sample[c] = r[c] ?? "(anomaly)";
      }
      return sample;
    });
  }

  return badRows.slice(0, 4);
}

function getAffectedRowIndices(
  rows: Record<string, string>[],
  fd: FunctionalDependency,
): number[] {
  const { determinant } = fd;
  const grouped = new Map<string, number[]>();
  for (const [idx, row] of rows.entries()) {
    const key = determinant.map((d) => row[d]).join("|");
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(idx + 1); // 1-indexed
  }
  const affected: number[] = [];
  for (const indices of grouped.values()) {
    if (indices.length > 1) {
      for (const i of indices) affected.push(i);
    }
  }
  return affected.slice(0, 10);
}

export function detectAnomalies(
  table: TableData,
  fds: FunctionalDependency[],
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const { rows } = table;

  const problematicFDs = fds.filter(
    (fd) => fd.type === "partial" || fd.type === "transitive",
  );

  for (const fd of problematicFDs) {
    const goodSamples = getSamples(rows, fd, true);
    const badSamples = getSamples(rows, fd, false);
    const affectedRows = getAffectedRowIndices(rows, fd);
    const normalFormCause = fd.type === "partial" ? "2NF" : "3NF";
    const causeName =
      fd.type === "partial" ? "Partial Dependency" : "Transitive Dependency";

    // Update Anomaly
    anomalies.push({
      type: "Update",
      description: `Updating "${fd.dependent.join(", ")}" requires changing multiple rows wherever "${fd.determinant.join(", ")}" appears — leaving other rows inconsistent.`,
      fd,
      goodSamples,
      badSamples,
      reason: `"${fd.dependent.join(", ")}" is stored redundantly in every row that contains "${fd.determinant.join(", ")}". Updating it in one row while others remain unchanged creates inconsistency. Root cause: ${causeName}.`,
      normalFormCause,
      cause: causeName,
      affectedRows,
      fix: `Extract a separate table: ${fd.determinant.join("_")}(${[...fd.determinant, ...fd.dependent].join(", ")}) and remove "${fd.dependent.join(", ")}" from the original table.`,
    });

    // Insert Anomaly
    anomalies.push({
      type: "Insert",
      description: `Cannot record "${fd.dependent.join(", ")}" information without a complete primary key entry — e.g., cannot add a new "${fd.determinant.join(", ")}" record without also providing all primary key values.`,
      fd,
      goodSamples,
      badSamples: badSamples.slice(0, 2),
      reason: `Because "${fd.dependent.join(", ")}" is tied to "${fd.determinant.join(", ")}" via a ${causeName.toLowerCase()}, inserting standalone data about "${fd.determinant.join(", ")}" is impossible without a full row that satisfies all primary key constraints.`,
      normalFormCause,
      cause: causeName,
      affectedRows,
      fix: `Decompose: create ${fd.determinant.join("_")}(${[...fd.determinant, ...fd.dependent].join(", ")}) so "${fd.dependent.join(", ")}" can be inserted independently.`,
    });

    // Delete Anomaly
    anomalies.push({
      type: "Delete",
      description: `Deleting the last row containing a given "${fd.determinant.join(", ")}" value permanently loses the associated "${fd.dependent.join(", ")}" information.`,
      fd,
      goodSamples,
      badSamples: badSamples.slice(0, 2),
      reason: `Since "${fd.dependent.join(", ")}" is stored alongside "${fd.determinant.join(", ")}" in the same table, when the only row with a specific "${fd.determinant.join(", ")}" is deleted, all knowledge of "${fd.dependent.join(", ")}" for that entity is irrecoverably lost. Root cause: ${causeName}.`,
      normalFormCause,
      cause: causeName,
      affectedRows,
      fix: `Separate "${fd.dependent.join(", ")}" into its own table keyed by "${fd.determinant.join(", ")}" so data persists independently of the original table's rows.`,
    });
  }

  return anomalies;
}
