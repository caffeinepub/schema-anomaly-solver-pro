export type ColumnType =
  | "INT"
  | "VARCHAR"
  | "TEXT"
  | "FLOAT"
  | "BOOLEAN"
  | "DATE"
  | "TIMESTAMP"
  | "BIGINT"
  | "DECIMAL"
  | "CHAR";

export interface Column {
  name: string;
  type: ColumnType;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  foreignKeyRef?: string; // "tableName.columnName"
  isNullable?: boolean;
}

export interface TableData {
  name: string;
  columns: Column[];
  rows: Record<string, string>[];
}

export type InputMethod = "file" | "manual" | "sql";
