"use client";

import { useState, useEffect, useMemo } from "react";
import Pagination from "./Pagination";

interface Member {
  id: number; name: string; phone: string; role: string;
  attendanceRate?: number; consecutiveAbsences?: number;
}

const EDIT_ROLES = ["CELL_LEADER", "ASST_CELL_LEADER", "E_GROUP_LEADER"];
const DELETE_ROLES = ["CELL_LEADER", "ASST_CELL_LEADER"];
const ROLE_OPTIONS = ["MEMBER", "ASST_CELL_LEADER", "E_GROUP_LEADER"];
const PAGE_SIZE = 20;

interface Props { cellId: number; userRole: string; refreshTrigger: number; }

export default function MemberManagement({ cellId, userRole, refreshTrigger }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);

  const canEdit = EDIT_ROLES.includes(userRole);
  const canDelete = DELETE_ROLES.includes(userRole);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/cell/${cellId}`);
      const data = await res.json();
      setMembers(data.members || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (cellId) fetchMembers(); }, [cellId, refreshTrigger]);

  const filtered = useMemo(() => {
    if (!search) return members;
    const q = search.toLowerCase();
    return members.filter((m) => m.name.toLowerCase().includes(q) || m.phone.includes(q));
  }, [members, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  const startEdit = (m: Member) => { setEditId(m.id); setEditName(m.name); setEditPhone(m.phone); setEditRole(m.role); };
  const cancelEdit = () => { setEditId(null); };

  const saveEdit = async () => {
    if (!editName.trim()) return;
    try {
      await fetch(`/api/members/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editName, phone: editPhone, role: editRole }) });
      setEditId(null);
      fetchMembers();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this member? Their attendance records will also be removed.")) return;
    setDeleting(id);
    try {
      await fetch(`/api/members/${id}`, { method: "DELETE" });
      fetchMembers();
    } catch (e) { console.error(e); }
    setDeleting(null);
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="text-slate-400">Loading members...</div></div>;

  return (
    <div className="card !p-0 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">Members ({members.length})</h3>
          <p className="text-xs text-slate-400 mt-0.5">Manage cell members</p>
        </div>
        <input type="text" placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input !w-full sm:!w-56" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              {[{ label: "Name", align: "text-left", sticky: "sticky left-0 z-10 bg-slate-50" }, { label: "Phone", align: "text-left", sticky: "sticky left-[120px] z-10 bg-slate-50" }, { label: "Role", align: "text-left", sticky: "" }, { label: "Att.", align: "text-center", sticky: "" }, { label: "Abs.", align: "text-center", sticky: "" }, { label: "Actions", align: "text-left", sticky: "" }].map((h) => (
                <th key={h.label} className={`${h.align} ${h.sticky} px-3 sm:px-6 py-3 sm:py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap`}>{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((m) => (
              <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition">
                {editId === m.id ? (
                  <>
                    <td className="px-2 sm:px-3 py-2"><input value={editName} onChange={(e) => setEditName(e.target.value)} className="form-input !py-1 sm:!py-1.5 !px-2 sm:!px-3 text-xs" /></td>
                    <td className="px-2 sm:px-3 py-2"><input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="form-input !py-1 sm:!py-1.5 !px-2 sm:!px-3 text-xs" /></td>
                    <td className="px-2 sm:px-3 py-2">
                      <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="form-select !py-1 sm:!py-1.5 !px-2 sm:!px-3 text-[10px] sm:text-xs">
                        {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r === "MEMBER" ? "Member" : r === "ASST_CELL_LEADER" ? "Asst." : "E-Group"}</option>)}
                      </select>
                    </td>
                    <td></td><td></td>
                    <td className="px-2 sm:px-3 py-2">
                      <div className="flex gap-1">
                        <button onClick={saveEdit} className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">Save</button>
                        <button onClick={cancelEdit} className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition">Cancel</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-slate-900 text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none sticky left-0 z-10 bg-white sm:static sm:z-auto">{m.name}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-500 text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none sticky left-[120px] z-10 bg-white sm:static sm:z-auto">{m.phone || "—"}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span className="px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-semibold badge-neutral whitespace-nowrap">
                        {m.role === "MEMBER" ? "Member" : m.role === "ASST_CELL_LEADER" ? "Asst." : "E-Group"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                      <span className={`text-xs sm:text-sm font-semibold ${(m.attendanceRate || 0) >= 70 ? "text-green-600" : (m.attendanceRate || 0) >= 40 ? "text-amber-600" : "text-red-500"}`}>
                        {m.attendanceRate || 0}%
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                      <span className={`text-xs sm:text-sm font-semibold ${(m.consecutiveAbsences || 0) >= 3 ? "text-red-500" : "text-slate-500"}`}>
                        {m.consecutiveAbsences || 0}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex gap-1">
                        {canEdit && (
                          <button onClick={() => startEdit(m)} className="px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition whitespace-nowrap">
                            Edit
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(m.id)} disabled={deleting === m.id} className="px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition whitespace-nowrap">
                            {deleting === m.id ? "..." : "Delete"}
                          </button>
                        )}
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {paginated.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-slate-400">No members found.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="px-4 sm:px-6 py-4 border-t border-slate-100">
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}
