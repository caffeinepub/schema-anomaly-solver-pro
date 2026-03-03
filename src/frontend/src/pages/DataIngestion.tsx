import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, Code2, Table2, Upload } from "lucide-react";
import React, { useState } from "react";
import FileUploadTab from "../components/FileUploadTab";
import ManualEntryTab from "../components/ManualEntryTab";
import ProgressIndicator from "../components/ProgressIndicator";
import SQLParserTab from "../components/SQLParserTab";
import type { InputMethod, TableData } from "../types/schema";

const DEFAULT_MANUAL_TABLE: TableData = {
  name: "my_table",
  columns: [],
  rows: [],
};

interface DataIngestionProps {
  onTableReady: (table: TableData) => void;
}

export default function DataIngestion({ onTableReady }: DataIngestionProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<InputMethod>("file");
  const [fileTable, setFileTable] = useState<TableData | null>(null);
  const [manualTable, setManualTable] =
    useState<TableData>(DEFAULT_MANUAL_TABLE);
  const [sqlTables, setSqlTables] = useState<TableData[]>([]);
  const [selectedSqlTable, setSelectedSqlTable] = useState<TableData | null>(
    null,
  );

  const currentTable: TableData | null =
    activeTab === "file"
      ? fileTable
      : activeTab === "manual"
        ? manualTable.columns.length > 0
          ? manualTable
          : null
        : selectedSqlTable;

  const canProceed = currentTable !== null && currentTable.columns.length > 0;

  const handleNext = () => {
    if (!currentTable) return;
    onTableReady(currentTable);
    navigate({ to: "/preview" });
  };

  const handleSqlParsed = (tables: TableData[]) => {
    setSqlTables(tables);
    if (tables.length > 0) setSelectedSqlTable(tables[0]);
  };

  const handleFileCleared = () => {
    setFileTable(null);
  };

  return (
    <div className="space-y-6">
      <ProgressIndicator currentStep={1} />

      <div className="space-y-2">
        <h1 className="text-2xl font-mono font-bold neon-text">
          <span className="text-muted-foreground">&gt; </span>
          Step 1: Data Ingestion
        </h1>
        <p className="text-sm font-mono text-muted-foreground">
          Import your database schema using one of three methods below.
        </p>
      </div>

      <div className="panel-neon rounded-lg p-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as InputMethod)}
        >
          <TabsList className="bg-secondary border border-border mb-6 w-full sm:w-auto">
            <TabsTrigger
              value="file"
              className="font-mono text-xs flex items-center gap-1.5 data-[state=active]:text-neon-green data-[state=active]:bg-neon-green/10"
            >
              <Upload size={12} /> File Upload
            </TabsTrigger>
            <TabsTrigger
              value="manual"
              className="font-mono text-xs flex items-center gap-1.5 data-[state=active]:text-neon-green data-[state=active]:bg-neon-green/10"
            >
              <Table2 size={12} /> Manual Entry
            </TabsTrigger>
            <TabsTrigger
              value="sql"
              className="font-mono text-xs flex items-center gap-1.5 data-[state=active]:text-neon-green data-[state=active]:bg-neon-green/10"
            >
              <Code2 size={12} /> SQL Parser
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file">
            <FileUploadTab
              onDataParsed={(t) => {
                if (t.columns.length === 0) {
                  handleFileCleared();
                } else {
                  setFileTable(t);
                }
              }}
              currentTable={fileTable}
            />
          </TabsContent>

          <TabsContent value="manual">
            <ManualEntryTab table={manualTable} onChange={setManualTable} />
          </TabsContent>

          <TabsContent value="sql">
            <SQLParserTab
              onDataParsed={handleSqlParsed}
              parsedTables={sqlTables}
            />
            {sqlTables.length > 1 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-mono text-muted-foreground">
                  Select table to analyze:
                </p>
                <div className="flex flex-wrap gap-2">
                  {sqlTables.map((t) => (
                    <button
                      type="button"
                      key={t.name}
                      onClick={() => setSelectedSqlTable(t)}
                      className={`px-3 py-1.5 rounded text-xs font-mono transition-all ${
                        selectedSqlTable?.name === t.name
                          ? "btn-neon"
                          : "panel text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Proceed button */}
      <div className="flex items-center justify-between">
        {!canProceed && (
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <AlertCircle size={12} />
            {activeTab === "file" && "Upload a file to continue"}
            {activeTab === "manual" && "Add at least one column to continue"}
            {activeTab === "sql" && "Parse a SQL statement to continue"}
          </div>
        )}
        {canProceed && (
          <div className="text-xs font-mono text-neon-green">
            ✓ Ready: <span className="font-semibold">{currentTable?.name}</span>{" "}
            ({currentTable?.columns.length} cols, {currentTable?.rows.length}{" "}
            rows)
          </div>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed}
          className="btn-neon px-6 py-2.5 rounded flex items-center gap-2 text-sm ml-auto"
        >
          Next: Preview <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
