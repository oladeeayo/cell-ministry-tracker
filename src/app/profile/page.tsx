"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import LayoutWrapper from "@/components/LayoutWrapper";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/user/profile").then((r) => r.json()).then((data) => {
      if (data.name) setName(data.name);
      if (data.phone) setPhone(data.phone);
      if (data.address) setAddress(data.address);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const body: any = {};
    if (name) body.name = name;
    body.phone = phone;
    body.address = address;
    if (currentPassword && newPassword) {
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }
    try {
      const res = await fetch("/api/user/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const err = await res.json(); setMsg({ type: "error", text: err.error || "Failed to update" }); }
      else { setMsg({ type: "success", text: "Profile updated successfully!" }); setCurrentPassword(""); setNewPassword(""); }
    } catch { setMsg({ type: "error", text: "Network error" }); }
    setSaving(false);
  };

  const user = session?.user as any;

  return (
    <LayoutWrapper pageTitle="Profile Settings">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* User Info Card */}
        <div className="card relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white !border-0">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
          <div className="relative flex items-center gap-6">
            <div className="w-20 h-20 bg-white/15 rounded-3xl flex items-center justify-center ring-4 ring-white/10">
              <span className="text-white text-3xl font-bold">{(user?.name || "").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "U"}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user?.name || "User"}</h2>
              <p className="text-primary-100 text-sm mt-0.5">{user?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-white/15 rounded-xl text-xs font-semibold">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="card space-y-5">
          <h3 className="text-lg font-bold text-slate-900">Edit Profile</h3>

          {msg && (
            <div className={`px-5 py-3 rounded-2xl text-sm font-medium flex items-center gap-2 ${
              msg.type === "success" ? "bg-green-50 border border-green-100 text-green-700" : "bg-red-50 border border-red-100 text-red-600"
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {msg.type === "success" ? <polyline points="20 6 9 17 4 12"/> : <><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></>}
              </svg>
              {msg.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="form-input" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="form-input" />
          </div>

          <hr className="border-slate-200" />

          <div>
            <h4 className="font-bold text-slate-800 text-sm">Change Password</h4>
            <p className="text-xs text-slate-400 mt-0.5 mb-4">Leave blank to keep current password</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="form-input" placeholder="&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="form-input" placeholder="Min 6 characters" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-6 py-3 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition"
            >
              Sign Out
            </button>
          </div>
        </form>
      </div>
    </LayoutWrapper>
  );
}
