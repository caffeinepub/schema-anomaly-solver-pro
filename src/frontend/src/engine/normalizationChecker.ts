import type { NormalFormViolation } from "../types/analysis";
import type { FunctionalDependency } from "../types/analysis";
import type { TableData } from "../types/schema";
import { computeClosure, isSuperkey } from "./functionalDependencies";

export function check1NF(table: TableData): NormalFormViolation[] {
  const violations: NormalFormViolation[] = [];
  const { columns, rows } = table;

  // Check for multi-valued attributes (comma-separated values in cells)
  for (const col of columns) {
    const multiValued = rows.some((r) => {
      const val = r[col.name] ?? "";
      return (
        val.includes(",") &&
        val.split(",").length > 1 &&
        val.split(",").every((v) => v.trim().length > 0)
      );
    });
    if (multiValued) {
      violations.push({
        normalForm: "1NF",
        description: `Column "${col.name}" contains multi-valued attributes (comma-separated values). Each cell must contain a single atomic value.`,
        affectedColumns: [col.name],
      });
    }
  }

  // Check for repeating group patterns (col1, col2, col3 with similar names)
  const colNames = columns.map((c) => c.name);
  const repeatingGroups = colNames.filter((name, _, arr) => {
    const base = name.replace(/\d+$/, "");
    return (
      base.length > 0 &&
      arr.filter((n) => n.replace(/\d+$/, "") === base).length > 1
    );
  });

  if (repeatingGroups.length > 0) {
    const uniqueBases = [
      ...new Set(repeatingGroups.map((n) => n.replace(/\d+$/, ""))),
    ];
    for (const base of uniqueBases) {
      const group = colNames.filter((n) => n.replace(/\d+$/, "") === base);
      violations.push({
        normalForm: "1NF",
        description: `Repeating group detected: columns ${group.map((g) => `"${g}"`).join(", ")} suggest a repeating group pattern — violates atomicity.`,
        affectedColumns: group,
      });
    }
  }

  return violations;
}

export function check2NF(
  table: TableData,
  fds: FunctionalDependency[],
): NormalFormViolation[] {
  const pkCols = table.columns.filter((c) => c.isPrimaryKey).map((c) => c.name);
  if (pkCols.length <= 1) return []; // 2NF only applies to composite PKs

  const violations: NormalFormViolation[] = [];
  const partialFDs = fds.filter((fd) => fd.type === "partial");

  for (const fd of partialFDs) {
    violations.push({
      normalForm: "2NF",
      description: `Partial dependency: "${fd.dependent.join(", ")}" depends only on "${fd.determinant.join(", ")}" (part of composite PK [${pkCols.join(", ")}]), not the full PK. This causes insertion and deletion anomalies.`,
      affectedColumns: [...fd.determinant, ...fd.dependent],
      fd,
    });
  }

  return violations;
}

/**
 * Check 3NF: for every FD X → Y, X must be a superkey OR Y must be a prime attribute
 * (part of at least one candidate key).
 */
export function check3NF(
  table: TableData,
  fds: FunctionalDependency[],
  candidateKeys: string[][],
): NormalFormViolation[] {
  const violations: NormalFormViolation[] = [];
  const allCols = table.columns.map((c) => c.name);

  // All prime attributes: columns that appear in at least one candidate key
  const primeAttrs = new Set<string>();
  for (const ck of candidateKeys) {
    for (const attr of ck) primeAttrs.add(attr);
  }

  for (const fd of fds) {
    if (fd.type === "full" || fd.type === "mvd" || fd.type === "joinDep")
      continue;

    const xIsSuperkey = isSuperkey(fd.determinant, allCols, fds);
    const yAllPrime = fd.dependent.every((d) => primeAttrs.has(d));

    if (!xIsSuperkey && !yAllPrime) {
      violations.push({
        normalForm: "3NF",
        description: `Transitive dependency: "${fd.dependent.join(", ")}" depends on "${fd.determinant.join(", ")}" which is not a superkey, and "${fd.dependent.join(", ")}" is not a prime attribute. Violates 3NF.`,
        affectedColumns: [...fd.determinant, ...fd.dependent],
        fd,
      });
    }
  }

  return violations;
}

/**
 * Check BCNF: for every non-trivial FD X → Y, X must be a superkey.
 * Stricter than 3NF — catches cases where Y IS a prime attribute but X is still not a superkey.
 */
export function checkBCNF(
  table: TableData,
  fds: FunctionalDependency[],
  _candidateKeys: string[][],
): NormalFormViolation[] {
  const violations: NormalFormViolation[] = [];
  const allCols = table.columns.map((c) => c.name);

  for (const fd of fds) {
    if (fd.type === "full" || fd.type === "mvd" || fd.type === "joinDep")
      continue;

    // Skip trivial FDs (where dependent is subset of determinant)
    const isTrivial = fd.dependent.every((d) => fd.determinant.includes(d));
    if (isTrivial) continue;

    const xIsSuperkey = isSuperkey(fd.determinant, allCols, fds);

    if (!xIsSuperkey) {
      // Only report if not already caught by 3NF (to avoid exact duplicates)
      violations.push({
        normalForm: "BCNF",
        description: `BCNF violation: "${fd.determinant.join(", ")}" → "${fd.dependent.join(", ")}" — determinant is not a superkey of the table. Even if dependent is a prime attribute, this violates BCNF.`,
        affectedColumns: [...fd.determinant, ...fd.dependent],
        fd,
      });
    }
  }

  return violations;
}

/**
 * Check 4NF: detect multi-valued dependencies (MVDs).
 * X →→ Y means for each value of X, the set of Y values is independent of Z values.
 * If X is not a superkey and X →→ Y exists (with Y ≠ ∅ and Z = remaining cols ≠ ∅) → 4NF violation.
 */
export function check4NF(
  table: TableData,
  fds: FunctionalDependency[],
): NormalFormViolation[] {
  const violations: NormalFormViolation[] = [];
  const { rows } = table;
  const allCols = table.columns.map((c) => c.name);

  if (rows.length < 3) return [];

  // Detect MVDs heuristically:
  // For each pair of non-PK attribute groups (Y, Z) and a determinant X,
  // check if for each value of X, the Y-values and Z-values are independent.
  // We limit scope to single-column determinants and two remaining columns.

  for (let xi = 0; xi < allCols.length; xi++) {
    const X = [allCols[xi]];
    const remaining = allCols.filter((_, i) => i !== xi);
    if (remaining.length < 2) continue;

    for (let yi = 0; yi < remaining.length; yi++) {
      const Y = remaining[yi];
      const Z = remaining.filter((_, i) => i !== yi);

      if (Z.length === 0) continue;

      // Check X →→ Y: for each group of rows with same X value,
      // the set of Y values must be the same regardless of Z values.
      // i.e., if (x,y1,z1) and (x,y2,z2) are in table, then (x,y1,z2) and (x,y2,z1) must also be in table.
      const xGroups = new Map<
        string,
        { yVals: Set<string>; rows: Record<string, string>[] }
      >();
      for (const row of rows) {
        const xVal = X.map((c) => row[c] ?? "").join("|");
        if (!xGroups.has(xVal))
          xGroups.set(xVal, { yVals: new Set(), rows: [] });
        xGroups.get(xVal)!.yVals.add(row[Y] ?? "");
        xGroups.get(xVal)!.rows.push(row);
      }

      let hasMVD = false;
      for (const [, group] of xGroups) {
        if (group.yVals.size < 2) continue;
        // Check if multiple distinct Y values exist with varying Z for same X
        const zForY = new Map<string, Set<string>>();
        for (const row of group.rows) {
          const yv = row[Y] ?? "";
          const zv = Z.map((c) => row[c] ?? "").join("|");
          if (!zForY.has(yv)) zForY.set(yv, new Set());
          zForY.get(yv)!.add(zv);
        }
        // MVD is indicated when the same X maps to multiple Y values
        // and those Y values are independent of Z (cross-product exists)
        if (group.yVals.size >= 2 && group.rows.length >= 2) {
          const allZVals = new Set<string>();
          for (const [, zSet] of zForY) {
            for (const z of zSet) allZVals.add(z);
          }
          // If Y has multiple values and Z has multiple independent values → MVD
          if (allZVals.size >= 2 && group.yVals.size >= 2) {
            hasMVD = true;
            break;
          }
        }
      }

      if (hasMVD && !isSuperkey(X, allCols, fds)) {
        const exists = violations.some(
          (v) =>
            v.fd?.determinant.join(",") === X.join(",") &&
            v.fd?.dependent.join(",") === Y,
        );
        if (!exists) {
          const mvdFD: FunctionalDependency = {
            determinant: X,
            dependent: [Y],
            type: "mvd",
            confidence: 0.85,
          };
          violations.push({
            normalForm: "4NF",
            description: `Multi-valued dependency (MVD): "${X.join(", ")}" →→ "${Y}" — for each value of "${X.join(", ")}", the set of "${Y}" values is independent of other attributes. Since "${X.join(", ")}" is not a superkey, this violates 4NF.`,
            affectedColumns: [...X, Y, ...Z.slice(0, 2)],
            fd: mvdFD,
          });
        }
      }
    }
  }

  return violations;
}

/**
 * Check 5NF (Project-Join Normal Form):
 * A table violates 5NF if it contains a join dependency not implied by its candidate keys.
 * Detection: attempt 3-way decompositions, if natural join of decomposed parts produces
 * spurious tuples (more rows than original), a lossy JD existed → 5NF violation.
 * We check for the classic "cyclic constraint" pattern: SupplierID, ProductID, CustomerID.
 */
export function check5NF(
  table: TableData,
  _fds: FunctionalDependency[],
  candidateKeys: string[][],
): NormalFormViolation[] {
  const violations: NormalFormViolation[] = [];
  const { rows } = table;
  const allCols = table.columns.map((c) => c.name);

  if (allCols.length < 3 || rows.length < 4) return [];

  // Try all 3-column combinations that form a potential cyclic constraint
  for (let i = 0; i < allCols.length - 2; i++) {
    for (let j = i + 1; j < allCols.length - 1; j++) {
      for (let k = j + 1; k < allCols.length; k++) {
        const A = allCols[i];
        const B = allCols[j];
        const C = allCols[k];

        // Project onto (A,B), (B,C), (A,C)
        const proj_AB = projectRows(rows, [A, B]);
        const proj_BC = projectRows(rows, [B, C]);
        const proj_AC = projectRows(rows, [A, C]);

        // Natural join all three projections
        const joined = naturalJoin(naturalJoin(proj_AB, proj_BC, B), proj_AC, [
          A,
          C,
        ]);

        // If join produces more rows → lossy decomposition → 5NF violation
        if (joined.length > rows.length) {
          // Check not implied by candidate keys
          const impliedByCK = candidateKeys.some((ck) =>
            [A, B, C].every((col) => ck.includes(col)),
          );
          if (!impliedByCK) {
            const jdFD: FunctionalDependency = {
              determinant: [A, B],
              dependent: [C],
              type: "joinDep",
              confidence: 0.75,
            };
            const exists = violations.some(
              (v) =>
                v.affectedColumns.includes(A) &&
                v.affectedColumns.includes(B) &&
                v.affectedColumns.includes(C),
            );
            if (!exists) {
              violations.push({
                normalForm: "5NF",
                description: `Join dependency detected among columns "${A}", "${B}", "${C}": decomposing into (${A},${B}), (${B},${C}), (${A},${C}) and rejoining produces spurious tuples — a cyclic constraint exists that violates 5NF (Project-Join Normal Form).`,
                affectedColumns: [A, B, C],
                fd: jdFD,
              });
            }
          }
        }
      }
    }
  }

  return violations;
}

// --- Helper functions for 5NF ---

function projectRows(
  rows: Record<string, string>[],
  cols: string[],
): Record<string, string>[] {
  const seen = new Set<string>();
  const result: Record<string, string>[] = [];
  for (const row of rows) {
    const projected: Record<string, string> = {};
    for (const c of cols) {
      projected[c] = row[c] ?? "";
    }
    const key = cols.map((c) => projected[c]).join("||");
    if (!seen.has(key)) {
      seen.add(key);
      result.push(projected);
    }
  }
  return result;
}

function naturalJoin(
  left: Record<string, string>[],
  right: Record<string, string>[],
  joinOn: string | string[],
): Record<string, string>[] {
  const joinCols = Array.isArray(joinOn) ? joinOn : [joinOn];
  const result: Record<string, string>[] = [];
  const seen = new Set<string>();

  for (const lRow of left) {
    for (const rRow of right) {
      const matches = joinCols.every((c) => lRow[c] === rRow[c]);
      if (matches) {
        const merged: Record<string, string> = { ...lRow, ...rRow };
        const key = Object.keys(merged)
          .sort()
          .map((k) => merged[k])
          .join("||");
        if (!seen.has(key)) {
          seen.add(key);
          result.push(merged);
        }
      }
    }
  }

  return result;
}
