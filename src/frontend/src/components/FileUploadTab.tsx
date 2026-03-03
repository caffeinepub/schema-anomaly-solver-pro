import { AlertCircle, CheckCircle, Upload, X } from "lucide-react";
import type React from "react";
import { useCallback, useState } from "react";
import type { TableData } from "../types/schema";
import { parseFile } from "../utils/parsers";

interface FileUploadTabProps {
  onDataParsed: (table: TableData) => void;
  currentTable: TableData | null;
}

export default function FileUploadTab({
  onDataParsed,
  currentTable,
}: FileUploadTabProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["csv", "xlsx", "xls", "txt"].includes(ext || "")) {
        setError(
          "Unsupported file type. Please upload .csv, .xlsx, or .txt files.",
        );
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const table = await parseFile(file);
        onDataParsed(table);
      } catch (err) {
        setError(
          `Failed to parse file: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      } finally {
        setIsLoading(false);
      }
    },
    [onDataParsed],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-4">
      <label
        htmlFor="file-input"
        data-ocid="upload.dropzone"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-10 text-center transition-all duration-200 cursor-pointer block ${
          isDragging
            ? "border-neon-green bg-neon-green/5"
            : "border-border hover:border-neon-green/50 hover:bg-secondary/30"
        }`}
      >
        <input
          id="file-input"
          type="file"
          accept=".csv,.xlsx,.xls,.txt"
          className="hidden"
          onChange={handleInputChange}
        />
        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-mono text-neon-green">Parsing file...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload
              size={36}
              className={
                isDragging ? "text-neon-green" : "text-muted-foreground"
              }
            />
            <div>
              <p className="font-mono font-semibold text-foreground">
                Drop your schema file here
              </p>
              <p className="text-sm text-muted-foreground font-mono mt-1">
                Supports .csv, .xlsx, .xls, .txt — auto-detects delimiters
              </p>
            </div>
            <span className="btn-neon px-4 py-1.5 rounded text-sm">
              Browse Files
            </span>
          </div>
        )}
      </label>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded border border-destructive/40 bg-destructive/10 text-destructive text-sm font-mono">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {currentTable && !isLoading && (
        <div className="flex items-center gap-3 p-3 rounded panel-neon">
          <CheckCircle size={16} className="text-neon-green flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-mono text-neon-green font-semibold truncate">
              {currentTable.name}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {currentTable.columns.length} columns · {currentTable.rows.length}{" "}
              rows
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDataParsed({ name: "", columns: [], rows: [] });
            }}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { ext: ".CSV", desc: "Comma/Tab separated" },
          { ext: ".XLSX", desc: "Excel workbook" },
          { ext: ".TXT", desc: "Delimited text" },
        ].map((f) => (
          <div key={f.ext} className="panel p-3 rounded">
            <div className="text-neon-cyan font-mono font-bold text-sm">
              {f.ext}
            </div>
            <div className="text-xs text-muted-foreground font-mono mt-1">
              {f.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
