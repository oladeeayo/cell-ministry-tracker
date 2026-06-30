"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";

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
      else { setMsg({ type: "success", text: "Profile updated!" }); setCurrentPassword(""); setNewPassword(""); }
    } catch { setMsg({ type: "error", text: "Network error" }); }
    setSaving(false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Profile Settings</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-4"><p className="text-sm text-gray-400">Email</p><p className="font-medium text-gray-700">{session?.user?.email || "N/A"}</p></div>
        <div className="mb-4"><p className="text-sm text-gray-400">Role</p><p className="font-medium text-gray-700">{session?.user?.role || "N/A"}</p></div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Edit Profile</h2>

        {msg && <div className={`px-4 py-2 rounded-lg text-sm ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{msg.text}</div>}

        <div><label className="block text-sm font-medium text-gray-600 mb-1">Name</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" /></div>
        <div><label className="block text-sm font-medium text-gray-600 mb-1">Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" /></div>
        <div><label className="block text-sm font-medium text-gray-600 mb-1">Address</label><input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" /></div>

        <hr className="border-gray-200" />
        <h3 className="font-medium text-gray-700 text-sm">Change Password (optional)</h3>
        <div><label className="block text-sm font-medium text-gray-600 mb-1">Current Password</label><input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" /></div>
        <div><label className="block text-sm font-medium text-gray-600 mb-1">New Password</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" /></div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-medium hover:bg-primary-800 disabled:opacity-50 transition">{saving ? "Saving..." : "Save Changes"}</button>
          <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="px-6 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition">Sign Out</button>
        </div>
      </form>
    </div>
  );
}
