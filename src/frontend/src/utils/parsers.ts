import type { Column, ColumnType, TableData } from "../types/schema";

// ─── Type Inference ───────────────────────────────────────────────────────────
function inferType(values: string[]): ColumnType {
  const nonEmpty = values.filter(
    (v) => v !== "" && v !== null && v !== undefined,
  );
  if (nonEmpty.length === 0) return "VARCHAR";
  if (nonEmpty.every((v) => /^-?\d+$/.test(v.trim()))) return "INT";
  if (nonEmpty.every((v) => /^-?\d+(\.\d+)?$/.test(v.trim()))) return "FLOAT";
  if (nonEmpty.every((v) => /^(true|false|0|1)$/i.test(v.trim())))
    return "BOOLEAN";
  if (nonEmpty.every((v) => /^\d{4}-\d{2}-\d{2}/.test(v.trim()))) return "DATE";
  return "VARCHAR";
}

// ─── CSV / TXT Parser (no PapaParse) ─────────────────────────────────────────
function detectDelimiter(firstLine: string): string {
  const candidates = [",", "\t", ";", "|"];
  let best = ",";
  let bestCount = 0;
  for (const d of candidates) {
    const count = firstLine.split(d).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = d;
    }
  }
  return best;
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCSVText(
  text: string,
  tableName = "imported_table",
): TableData {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return { name: tableName, columns: [], rows: [] };

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCSVLine(lines[0], delimiter).map((h) =>
    h.replace(/^["']|["']$/g, ""),
  );
  const dataLines = lines.slice(1);

  const rawRows = dataLines.map((line) => {
    const cells = parseCSVLine(line, delimiter);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (cells[i] ?? "").replace(/^["']|["']$/g, "");
    });
    return row;
  });

  const columns: Column[] = headers.map((h) => {
    const colValues = rawRows.map((r) => r[h] ?? "");
    return {
      name: h,
      type: inferType(colValues),
      isPrimaryKey: false,
      isForeignKey: false,
    };
  });

  return { name: tableName, columns, rows: rawRows };
}

// ─── Excel Parser (no SheetJS — read as text fallback) ────────────────────────
// Since xlsx is not available, we parse .xlsx files by reading them as binary
// and extracting shared strings + sheet data from the ZIP-based format.
// For simplicity and reliability, we treat .xlsx as unsupported and guide users
// to export as CSV. We still handle .xls text exports gracefully.
async function parseExcelAsBestEffort(
  file: File,
  tableName: string,
): Promise<TableData> {
  // Try reading as text (works for CSV-exported .xlsx or tab-delimited .xls)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      // Check if it looks like XML/binary (real xlsx)
      if (text.startsWith("PK") || text.includes("<?xml")) {
        // Real xlsx binary — we can't parse without xlsx library
        // Return a helpful error table
        resolve({
          name: tableName,
          columns: [
            {
              name: "error",
              type: "TEXT",
              isPrimaryKey: false,
              isForeignKey: false,
            },
          ],
          rows: [
            {
              error:
                "Excel .xlsx files require export to CSV. Please save as CSV and re-upload.",
            },
          ],
        });
      } else {
        // Might be tab-delimited or CSV-like
        try {
          resolve(parseCSVText(text, tableName));
        } catch {
          reject(new Error("Could not parse file. Please export as CSV."));
        }
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function parseFile(file: File): Promise<TableData> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const tableName = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_]/g, "_");

  if (ext === "xlsx" || ext === "xls") {
    return parseExcelAsBestEffort(file, tableName);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        resolve(parseCSVText(text, tableName));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// ─── SQL CREATE TABLE Parser ──────────────────────────────────────────────────
export function parseSQLCreateTable(sql: string): TableData[] {
  const tables: TableData[] = [];
  const createTableRegex =
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?\s*\(([^;]+)\)/gi;
  let match = createTableRegex.exec(sql);

  while (match !== null) {
    const tableName = match[1];
    const body = match[2];
    const columns: Column[] = [];
    const pkColumns: string[] = [];

    // Table-level PRIMARY KEY
    const tablePKMatch = body.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
    if (tablePKMatch) {
      for (const col of tablePKMatch[1].split(",")) {
        pkColumns.push(col.trim().replace(/[`"']/g, ""));
      }
    }

    // FOREIGN KEY map
    const fkMap: Record<string, string> = {};
    const fkRegex =
      /FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+[`"']?(\w+)[`"']?\s*\(([^)]+)\)/gi;
    let fkMatch = fkRegex.exec(body);
    while (fkMatch !== null) {
      const fkCol = fkMatch[1].trim().replace(/[`"']/g, "");
      const refTable = fkMatch[2];
      const refCol = fkMatch[3].trim().replace(/[`"']/g, "");
      fkMap[fkCol] = `${refTable}.${refCol}`;
      fkMatch = fkRegex.exec(body);
    }

    // Column definitions
    const lines = body.split(",").map((l) => l.trim());
    for (const line of lines) {
      if (/^(PRIMARY|FOREIGN|UNIQUE|INDEX|KEY|CONSTRAINT|CHECK)/i.test(line))
        continue;
      if (!line) continue;

      const colMatch = line.match(
        /^[`"']?(\w+)[`"']?\s+(\w+)(?:\([^)]*\))?(.*)$/i,
      );
      if (!colMatch) continue;

      const colName = colMatch[1];
      const rawType = colMatch[2].toUpperCase();
      const rest = colMatch[3] || "";

      const typeMap: Record<string, ColumnType> = {
        INT: "INT",
        INTEGER: "INT",
        BIGINT: "BIGINT",
        SMALLINT: "INT",
        VARCHAR: "VARCHAR",
        CHAR: "CHAR",
        TEXT: "TEXT",
        LONGTEXT: "TEXT",
        FLOAT: "FLOAT",
        DOUBLE: "FLOAT",
        DECIMAL: "DECIMAL",
        NUMERIC: "DECIMAL",
        BOOLEAN: "BOOLEAN",
        BOOL: "BOOLEAN",
        TINYINT: "BOOLEAN",
        DATE: "DATE",
        DATETIME: "TIMESTAMP",
        TIMESTAMP: "TIMESTAMP",
      };

      const colType: ColumnType = typeMap[rawType] || "VARCHAR";
      const isPK = /PRIMARY\s+KEY/i.test(rest) || pkColumns.includes(colName);
      const isFK = colName in fkMap;

      columns.push({
        name: colName,
        type: colType,
        isPrimaryKey: isPK,
        isForeignKey: isFK,
        foreignKeyRef: fkMap[colName],
        isNullable: !/NOT\s+NULL/i.test(rest),
      });
    }

    for (const pkCol of pkColumns) {
      const col = columns.find((c) => c.name === pkCol);
      if (col) col.isPrimaryKey = true;
    }

    tables.push({ name: tableName, columns, rows: [] });
    match = createTableRegex.exec(sql);
  }

  return tables;
}
