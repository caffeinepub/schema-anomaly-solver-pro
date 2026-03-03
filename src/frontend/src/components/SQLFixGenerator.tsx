import { Check, Code2, Copy } from "lucide-react";
import React, { useState } from "react";

interface SQLFixGeneratorProps {
  sqls: string[];
}

export default function SQLFixGenerator({ sqls }: SQLFixGeneratorProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const copyToClipboard = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(sqls.join("\n\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  if (sqls.length === 0) {
    return (
      <div className="panel p-6 rounded text-center text-muted-foreground font-mono text-sm">
        No SQL fixes generated — schema may already be normalized.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-muted-foreground">
          {sqls.length} decomposed table{sqls.length > 1 ? "s" : ""} generated
        </p>
        <button
          type="button"
          onClick={copyAll}
          className="btn-neon px-3 py-1.5 rounded text-xs flex items-center gap-1.5"
        >
          {copiedAll ? <Check size={12} /> : <Copy size={12} />}
          {copiedAll ? "Copied!" : "Copy All"}
        </button>
      </div>

      {sqls.map((sql, idx) => (
        <div key={sql.slice(0, 60)} className="relative group">
          <div className="code-block pr-12">{sql}</div>
          <button
            type="button"
            onClick={() => copyToClipboard(sql, idx)}
            className="absolute top-2 right-2 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity btn-neon"
            title="Copy SQL"
          >
            {copiedIdx === idx ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
      ))}
    </div>
  );
}
