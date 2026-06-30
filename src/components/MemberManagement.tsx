"use client";

import { useState } from "react";
import { ROLE_LABELS, canEdit } from "@/lib/hierarchy";

interface Member {
  id: number;
  name: string;
  phone: string;
  address: string | null;
  role: string;
  cellId: number;
}

interface Props {
  members: Member[];
  cellId: number;
  userRole: string;
  onUpdate: () => void;
}

export default function MemberManagement({ members, cellId, userRole, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", role: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const startEdit = (m: Member) => {
    setForm({ name: m.name, phone: m.phone, address: m.address || "", role: m.role });
    setEditingId(m.id);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await fetch(`/api/members/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setEditingId(null);
      onUpdate();
    } catch (e) {
      console.error("Failed to update member", e);
    }
    setSaving(false);
  };

  const deleteMember = async (id: number) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/members/${id}`, { method: "DELETE" });
      onUpdate();
    } catch (e) {
      console.error("Failed to delete member", e);
    }
    setDeleting(null);
  };

  const downloadMembersCSV = () => {
    const rows = [["Name", "Phone", "Address", "Role"]];
    members.forEach((m) => rows.push([m.name, m.phone, m.address || "", ROLE_LABELS[m.role] || m.role]));
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `members-cell-${cellId}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (members.length === 0) {
    return <div className="text-center py-6 text-gray-400">No members found.</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Members ({members.length})</h3>
        <button onClick={downloadMembersCSV} className="text-xs px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition">
          Download CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Name</th>
              <th className="text-left px-3 py-2.5 font-medium text-gray-600">Phone</th>
              <th className="text-left px-3 py-2.5 font-medium text-gray-600">Role</th>
              <th className="text-center px-3 py-2.5 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-t border-gray-100">
                {editingId === member.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input className="w-full px-2 py-1 border border-gray-300 rounded text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </td>
                    <td className="px-3 py-2">
                      <input className="w-full px-2 py-1 border border-gray-300 rounded text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </td>
                    <td className="px-3 py-2">
                      <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                        <option value="MEMBER">Member</option>
                        <option value="E_GROUP_LEADER">E-Group Leader</option>
                        <option value="ASST_CELL_LEADER">Asst. Cell Leader</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={saveEdit} disabled={saving} className="text-xs px-2 py-1 bg-primary-700 text-white rounded hover:bg-primary-800 disabled:opacity-50">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2.5 text-gray-800">{member.name}</td>
                    <td className="px-3 py-2.5 text-gray-500">{member.phone}</td>
                    <td className="px-3 py-2.5">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{ROLE_LABELS[member.role] || member.role}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {canEdit(userRole, member.role) && (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => startEdit(member)} className="text-xs text-primary-600 hover:underline">Edit</button>
                          <button onClick={() => deleteMember(member.id)} disabled={deleting === member.id} className="text-xs text-red-500 hover:underline disabled:opacity-50">
                            {deleting === member.id ? "..." : "Remove"}
                          </button>
                        </div>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
