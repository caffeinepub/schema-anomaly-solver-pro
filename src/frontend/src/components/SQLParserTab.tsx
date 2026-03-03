import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, Key, Link, Play } from "lucide-react";
import React, { useState } from "react";
import type { TableData } from "../types/schema";
import { parseSQLCreateTable } from "../utils/parsers";

const EXAMPLE_SQL = `CREATE TABLE StudentCourse (
  StudentID INT NOT NULL,
  StudentName VARCHAR(100),
  CourseID INT NOT NULL,
  CourseName VARCHAR(100),
  InstructorID INT,
  InstructorName VARCHAR(100),
  Grade CHAR(2),
  PRIMARY KEY (StudentID, CourseID),
  FOREIGN KEY (InstructorID) REFERENCES Instructor(InstructorID)
);`;

interface SQLParserTabProps {
  onDataParsed: (tables: TableData[]) => void;
  parsedTables: TableData[];
}

export default function SQLParserTab({
  onDataParsed,
  parsedTables,
}: SQLParserTabProps) {
  const [sql, setSql] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleParse = () => {
    setError(null);
    if (!sql.trim()) {
      setError("Please enter a SQL CREATE TABLE statement.");
      return;
    }
    try {
      const tables = parseSQLCreateTable(sql);
      if (tables.length === 0) {
        setError(
          "No valid CREATE TABLE statements found. Check your SQL syntax.",
        );
        return;
      }
      onDataParsed(tables);
    } catch (err) {
      setError(
        `Parse error: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const loadExample = () => {
    setSql(EXAMPLE_SQL);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-mono text-muted-foreground">
          Paste your SQL <span className="text-neon-green">CREATE TABLE</span>{" "}
          statement(s) below
        </p>
        <button
          type="button"
          onClick={loadExample}
          className="text-xs font-mono text-neon-cyan hover:underline"
        >
          Load Example
        </button>
      </div>

      <Textarea
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        placeholder={
          "CREATE TABLE orders (\n  order_id INT NOT NULL,\n  customer_id INT,\n  ...\n  PRIMARY KEY (order_id)\n);"
        }
        className="font-mono text-sm bg-input border-border min-h-48 focus:border-neon-green resize-y"
        spellCheck={false}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleParse}
          className="btn-neon px-5 py-2 rounded flex items-center gap-2 text-sm"
        >
          <Play size={14} />
          Parse SQL
        </button>
        {sql && (
          <button
            type="button"
            onClick={() => {
              setSql("");
              setError(null);
              onDataParsed([]);
            }}
            className="text-xs font-mono text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded border border-destructive/40 bg-destructive/10 text-destructive text-sm font-mono">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {parsedTables.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-mono text-neon-green">
            <CheckCircle size={14} />
            Parsed {parsedTables.length} table
            {parsedTables.length > 1 ? "s" : ""}
          </div>
          {parsedTables.map((table) => (
            <div key={table.name} className="panel-neon p-3 rounded space-y-2">
              <div className="font-mono font-bold text-sm text-neon-green">
                {table.name}
              </div>
              <div className="flex flex-wrap gap-2">
                {table.columns.map((col) => (
                  <span
                    key={col.name}
                    className={`text-xs font-mono px-2 py-0.5 rounded flex items-center gap-1 ${
                      col.isPrimaryKey
                        ? "bg-neon-green/15 text-neon-green border border-neon-green/30"
                        : col.isForeignKey
                          ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30"
                          : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {col.isPrimaryKey && <Key size={10} />}
                    {col.isForeignKey && <Link size={10} />}
                    {col.name}
                    <span className="opacity-60">:{col.type}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
