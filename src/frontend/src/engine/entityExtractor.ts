import type { FunctionalDependency, HiddenEntity } from "../types/analysis";

function toTitleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function suggestTableName(determinant: string[], _dependent: string[]): string {
  // Use the determinant column name as the table name
  const base = determinant[0]
    .replace(/[_\-]?id$/i, "")
    .replace(/[_\-]?code$/i, "");
  return base ? toTitleCase(base) : toTitleCase(determinant[0]);
}

export function extractHiddenEntities(
  fds: FunctionalDependency[],
): HiddenEntity[] {
  const entities: HiddenEntity[] = [];
  const seen = new Set<string>();

  for (const fd of fds) {
    if (fd.type !== "partial" && fd.type !== "transitive") continue;

    const key = fd.determinant.join(",");
    if (seen.has(key)) {
      // Add dependent columns to existing entity
      const existing = entities.find((e) => e.determinant.join(",") === key);
      if (existing) {
        for (const d of fd.dependent) {
          if (!existing.columns.includes(d)) existing.columns.push(d);
        }
      }
      continue;
    }

    seen.add(key);
    entities.push({
      name: suggestTableName(fd.determinant, fd.dependent),
      type: fd.type === "partial" ? "Partial" : "Transitive",
      columns: [...fd.determinant, ...fd.dependent],
      determinant: fd.determinant,
      suggestedTableName: suggestTableName(fd.determinant, fd.dependent),
    });
  }

  return entities;
}
