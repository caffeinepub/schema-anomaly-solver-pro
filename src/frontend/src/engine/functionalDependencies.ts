import type { FunctionalDependency } from "../types/analysis";
import type { TableData } from "../types/schema";

function checkFD(
  rows: Record<string, string>[],
  det: string[],
  dep: string,
): boolean {
  const map = new Map<string, string>();
  for (const row of rows) {
    const key = det.map((d) => row[d] ?? "").join("||");
    const val = row[dep] ?? "";
    if (map.has(key)) {
      if (map.get(key) !== val) return false;
    } else {
      map.set(key, val);
    }
  }
  return true;
}

/**
 * Compute attribute closure: given a set of attributes X and a list of FDs,
 * return all attributes that X can determine (including X itself).
 */
export function computeClosure(
  attrs: string[],
  fds: FunctionalDependency[],
): Set<string> {
  const closure = new Set<string>(attrs);
  let changed = true;
  while (changed) {
    changed = false;
    for (const fd of fds) {
      const allInClosure = fd.determinant.every((d) => closure.has(d));
      if (allInClosure) {
        for (const dep of fd.dependent) {
          if (!closure.has(dep)) {
            closure.add(dep);
            changed = true;
          }
        }
      }
    }
  }
  return closure;
}

/**
 * Check if a set of attributes is a superkey (its closure = all columns).
 */
export function isSuperkey(
  attrs: string[],
  allCols: string[],
  fds: FunctionalDependency[],
): boolean {
  const closure = computeClosure(attrs, fds);
  return allCols.every((c) => closure.has(c));
}

/**
 * Find all candidate keys: minimal superkeys of the table.
 * Uses a BFS/subset approach over column powerset (limited to reasonable table sizes).
 */
export function findCandidateKeys(
  table: TableData,
  fds: FunctionalDependency[],
): string[][] {
  const allCols = table.columns.map((c) => c.name);
  const candidates: string[][] = [];

  // Try subsets from size 1 up to all columns
  for (let size = 1; size <= allCols.length; size++) {
    const subsets = getSubsets(allCols, size);
    for (const subset of subsets) {
      if (isSuperkey(subset, allCols, fds)) {
        // Check if it is minimal (no proper subset is also a superkey)
        const isMinimal = candidates.every(
          (ck) => !ck.every((k) => subset.includes(k)),
        );
        if (isMinimal) {
          candidates.push(subset);
        }
      }
    }
    // If we found candidates at this size, don't look at larger sizes
    // unless we need to (we still continue to find all minimal keys of same size)
    if (candidates.length > 0 && size > candidates[0].length) break;
  }

  // Fallback: if no candidate key found, use defined PK
  if (candidates.length === 0) {
    const pkCols = table.columns
      .filter((c) => c.isPrimaryKey)
      .map((c) => c.name);
    if (pkCols.length > 0) return [pkCols];
    return [allCols];
  }

  return candidates;
}

function getSubsets<T>(arr: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (arr.length === 0) return [];
  const [first, ...rest] = arr;
  const withFirst = getSubsets(rest, size - 1).map((s) => [first, ...s]);
  const withoutFirst = getSubsets(rest, size);
  return [...withFirst, ...withoutFirst];
}

export function mineFunctionalDependencies(
  table: TableData,
): FunctionalDependency[] {
  const { columns, rows } = table;
  if (rows.length < 2) return [];

  const colNames = columns.map((c) => c.name);
  const pkCols = columns.filter((c) => c.isPrimaryKey).map((c) => c.name);
  const nonPkCols = columns.filter((c) => !c.isPrimaryKey).map((c) => c.name);
  const fds: FunctionalDependency[] = [];

  // Check single-column determinants → each other column
  for (const det of colNames) {
    const dependents: string[] = [];
    for (const dep of colNames) {
      if (det === dep) continue;
      if (checkFD(rows, [det], dep)) {
        dependents.push(dep);
      }
    }
    if (dependents.length > 0) {
      const isPKDet = pkCols.includes(det);
      const allDepsNonPK = dependents.every((d) => nonPkCols.includes(d));

      let type: FunctionalDependency["type"] = "direct";
      if (pkCols.length > 1 && isPKDet && allDepsNonPK) {
        type = "partial";
      }

      // Group dependents into one FD per determinant to reduce noise
      for (const dep of dependents) {
        const exists = fds.some(
          (fd) =>
            fd.determinant.length === 1 &&
            fd.determinant[0] === det &&
            fd.dependent.includes(dep),
        );
        if (!exists) {
          const isDepNonPK = nonPkCols.includes(dep);
          fds.push({
            determinant: [det],
            dependent: [dep],
            type: pkCols.length > 1 && isPKDet && isDepNonPK ? "partial" : type,
            confidence: 1.0,
          });
        }
      }
    }
  }

  // Check full PK → each non-PK column (full functional dependency)
  if (pkCols.length > 0) {
    for (const dep of nonPkCols) {
      if (checkFD(rows, pkCols, dep)) {
        const exists = fds.some(
          (fd) =>
            fd.determinant.length === pkCols.length &&
            fd.determinant.every((d) => pkCols.includes(d)) &&
            fd.dependent.includes(dep),
        );
        if (!exists) {
          fds.push({
            determinant: pkCols,
            dependent: [dep],
            type: "full",
            confidence: 1.0,
          });
        }
      }
    }
  }

  // Mark transitive: non-PK → non-PK (and not already partial)
  for (const fd of fds) {
    if (fd.type === "partial" || fd.type === "full") continue;
    const detIsNonPK = fd.determinant.every((d) => nonPkCols.includes(d));
    const depIsNonPK = fd.dependent.every((d) => nonPkCols.includes(d));
    if (detIsNonPK && depIsNonPK) {
      fd.type = "transitive";
    }
  }

  return fds;
}
