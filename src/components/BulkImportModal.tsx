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
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Bulk Import Members</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        <p className="text-sm text-gray-500 mb-3">Paste one member per line: <code className="bg-gray-100 px-1 rounded">Name, Phone, Address, Role</code></p>
        <p className="text-xs text-gray-400 mb-4">Role can be: MEMBER, ASST, or EGROUP (leave blank for Member)</p>

        <textarea
          className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
          placeholder={"John Doe, +2348010000001, 123 Street\nJane Smith, +2348010000002, , ASST\nBob Jones, +2348010000003"}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {result && (
          <div className="mt-3 p-3 rounded-lg text-sm bg-green-50 text-green-700">
            {result.success > 0 && <p>Successfully imported {result.success} member(s).</p>}
            {result.errors.length > 0 && <p className="text-red-600 mt-1">{result.errors.length} error(s): {result.errors.slice(0, 3).join("; ")}</p>}
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleImport} disabled={importing || !text.trim()} className="flex-1 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-medium hover:bg-primary-800 disabled:opacity-50 transition">
            {importing ? "Importing..." : `Import ${text.trim().split("\n").filter(l => l.trim()).length} Members`}
          </button>
        </div>
      </div>
    </div>
  );
}
