"use client";

import { useState } from "react";

interface Props {
  cellId: number;
  onClose: () => void;
  onDone: () => void;
}

export default function BulkImportModal({ cellId, onClose, onDone }: Props) {
  const [text, setText] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);

  const handleImport = async () => {
    setImporting(true);
    setResult(null);
    const lines = text.split("\n").filter((l) => l.trim());
    const members = [];
    const errors: string[] = [];

    for (const line of lines) {
      const parts = line.split(",").map((p) => p.trim());
      if (!parts[0]) { errors.push(`Invalid line: "${line}"`); continue; }
      members.push({
        name: parts[0],
        phone: parts[1] || "",
        address: parts[2] || "",
        role: parts[3]?.toUpperCase() === "ASST" || parts[3]?.toUpperCase() === "ASST_CELL_LEADER" ? "ASST_CELL_LEADER" : parts[3]?.toUpperCase() === "EGROUP" || parts[3]?.toUpperCase() === "E_GROUP_LEADER" ? "E_GROUP_LEADER" : "MEMBER",
        cellId: String(cellId),
      });
    }

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(members),
      });
      const data = await res.json();
      setResult({ success: data.created || 0, errors });
    } catch {
      setResult({ success: 0, errors: ["Network error"] });
    }
    setImporting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">Bulk Import Members</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 mb-5">
          <p className="text-sm text-slate-600">Paste one member per line:</p>
          <code className="block text-xs text-slate-400 mt-1">Name, Phone, Address, Role</code>
          <p className="text-xs text-slate-400 mt-1">Role: MEMBER (default), ASST, or EGROUP</p>
        </div>

        <textarea
          className="form-input !h-36 resize-none mb-5"
          placeholder={`John Doe, +2348010000001, 123 Street\nJane Smith, +2348010000002, , ASST\nBob Jones, +2348010000003`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {result && (
          <div className={`p-4 rounded-2xl text-sm mb-5 ${
            result.success > 0 ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"
          }`}>
            {result.success > 0 && <p className="text-green-700 font-medium">Successfully imported {result.success} member(s).</p>}
            {result.errors.length > 0 && <p className="text-red-600 mt-1 text-xs">{result.errors.length} error(s): {result.errors.slice(0, 3).join("; ")}</p>}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleImport}
            disabled={importing || !text.trim()}
            className="btn-primary flex-1"
          >
            {importing ? "Importing..." : `Import ${text.trim().split("\n").filter((l) => l.trim()).length} Members`}
          </button>
        </div>
      </div>
    </div>
  );
}
