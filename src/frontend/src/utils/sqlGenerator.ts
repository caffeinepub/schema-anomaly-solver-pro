import type { FunctionalDependency, HiddenEntity } from "../types/analysis";
import type { TableData } from "../types/schema";

function colDef(name: string, type: string, isPK: boolean): string {
  return `  ${name} ${type}${isPK ? " NOT NULL" : ""}`;
}

export function generateDecomposedSQL(
  table: TableData,
  entities: HiddenEntity[],
): string[] {
  const sqls: string[] = [];
  const usedColumns = new Set<string>();

  // Generate tables for each hidden entity
  for (const entity of entities) {
    const tableName = entity.suggestedTableName;
    const cols = entity.columns;
    const pkCols = entity.determinant;

    const colDefs = cols.map((c) => {
      const origCol = table.columns.find((col) => col.name === c);
      const type = origCol?.type || "VARCHAR(255)";
      const typeStr = type === "VARCHAR" ? "VARCHAR(255)" : type;
      const isPK = pkCols.includes(c);
      return colDef(c, typeStr, isPK);
    });

    const pkDef = `  PRIMARY KEY (${pkCols.join(", ")})`;
    sqls.push(
      `-- ${entity.type} Entity: ${tableName}\nCREATE TABLE ${tableName} (\n${colDefs.join(",\n")},\n${pkDef}\n);`,
    );

    for (const c of cols) usedColumns.add(c);
  }

  // Generate the main table with remaining columns
  const remainingCols = table.columns.filter(
    (c) => !usedColumns.has(c.name) || c.isPrimaryKey,
  );
  if (remainingCols.length > 0) {
    const pkCols = remainingCols.filter((c) => c.isPrimaryKey);
    const colDefs = remainingCols.map((c) => {
      const typeStr = c.type === "VARCHAR" ? "VARCHAR(255)" : c.type;
      return colDef(c.name, typeStr, c.isPrimaryKey);
    });

    const fkDefs = entities
      .map((entity) => {
        const fkCol = entity.determinant[0];
        if (remainingCols.some((c) => c.name === fkCol)) {
          return `  FOREIGN KEY (${fkCol}) REFERENCES ${entity.suggestedTableName}(${fkCol})`;
        }
        return null;
      })
      .filter(Boolean);

    const pkDef =
      pkCols.length > 0
        ? `  PRIMARY KEY (${pkCols.map((c) => c.name).join(", ")})`
        : null;
    const allDefs = [...colDefs, ...(pkDef ? [pkDef] : []), ...fkDefs];

    sqls.push(
      `-- Main Table (Normalized)\nCREATE TABLE ${table.name}_normalized (\n${allDefs.join(",\n")}\n);`,
    );
  }

  // If no entities found, just show the original table
  if (sqls.length === 0) {
    const colDefs = table.columns.map((c) => {
      const typeStr = c.type === "VARCHAR" ? "VARCHAR(255)" : c.type;
      return colDef(c.name, typeStr, c.isPrimaryKey);
    });
    const pkCols = table.columns.filter((c) => c.isPrimaryKey);
    const pkDef =
      pkCols.length > 0
        ? `  PRIMARY KEY (${pkCols.map((c) => c.name).join(", ")})`
        : null;
    const allDefs = [...colDefs, ...(pkDef ? [pkDef] : [])];
    sqls.push(`CREATE TABLE ${table.name} (\n${allDefs.join(",\n")}\n);`);
  }

  return sqls;
}
