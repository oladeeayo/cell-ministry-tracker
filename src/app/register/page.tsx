"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

const ROLES = [
  { value: "ZONAL_LEADER", label: "Zonal Leader", icon: "Users", desc: "Manage a zone of cell groups" },
  { value: "CELL_LEADER", label: "Cell Leader", icon: "UserCheck", desc: "Lead a cell group" },
  { value: "ASST_CELL_LEADER", label: "Asst. Cell Leader", icon: "UserPlus", desc: "Support a cell leader" },
  { value: "E_GROUP_LEADER", label: "E-Group Leader", icon: "Heart", desc: "Lead an e-group" },
  { value: "MEMBER", label: "Cell Member", icon: "User", desc: "Regular cell member" },
];

const RoleIcon = ({ name }: { name: string }) => {
  const icons: Record<string, JSX.Element> = {
    Users: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    UserCheck: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 3 19 6 23 2"/></svg>,
    UserPlus: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>,
    Heart: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>,
    User: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  };
  return <>{icons[name]}</>;
};

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState<any[]>([]);
  const [cells, setCells] = useState<any[]>([]);

  useEffect(() => {
    if (status === "authenticated") router.push("/dashboard");
  }, [status, router]);

  if (status === "authenticated") return null;

  const [form, setForm] = useState({
    email: "", password: "", name: "", phone: "", address: "", role: "",
    zoneNumber: "", zonalLeaderPhone: "", zonalLeaderAddress: "",
    cellName: "", cellZoneId: "", cellLeaderAddress: "", cellLeaderPhone: "",
    cellId: "",
  });

  useEffect(() => {
    if (form.role === "CELL_LEADER") fetch("/api/zones").then((r) => r.json()).then(setZones).catch(() => {});
    if (["ASST_CELL_LEADER", "E_GROUP_LEADER", "MEMBER"].includes(form.role)) fetch("/api/cells").then((r) => r.json()).then(setCells).catch(() => {});
  }, [form.role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");

    const body: any = { email: form.email, password: form.password, name: form.name, phone: form.phone, address: form.address, role: form.role };
    if (form.role === "ZONAL_LEADER") {
      body.zoneData = { zoneNumber: form.zoneNumber, zonalLeaderPhone: form.zonalLeaderPhone || form.phone, zonalLeaderAddress: form.zonalLeaderAddress || form.address };
    }
    if (form.role === "CELL_LEADER") {
      body.cellData = { name: form.cellName, zoneId: form.cellZoneId, cellLeaderAddress: form.cellLeaderAddress || form.address, cellLeaderPhone: form.cellLeaderPhone || form.phone };
    }
    if (["ASST_CELL_LEADER", "E_GROUP_LEADER", "MEMBER"].includes(form.role)) {
      body.cellData = { cellId: form.cellId };
    }

    try {
      const res = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); setLoading(false); return; }
      router.push("/login?registered=true");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />
        <div className="relative text-center">
          <div className="w-20 h-20 bg-white/15 rounded-3xl flex items-center justify-center mx-auto mb-6 ring-4 ring-white/10">
            <span className="text-white text-4xl font-bold">&#x271D;</span>
          </div>
          <h1 className="text-4xl font-bold text-white">Join the Network</h1>
          <p className="text-primary-200 text-lg mt-3 max-w-sm mx-auto">Register as a leader or member and start tracking attendance.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-start justify-center p-8 py-12 overflow-y-auto">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <div className="lg:hidden w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">&#x271D;</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 text-center lg:text-left">Create Account</h2>
            <p className="text-slate-500 text-sm mt-1 text-center lg:text-left">Register a new leader or member</p>
          </div>

          {/* Progress Bar */}
          {step === 2 && (
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-xl bg-primary-600 text-white text-sm font-bold flex items-center justify-center">1</div>
              <div className="flex-1 h-1 bg-primary-200 rounded-full"><div className="h-full w-1/2 bg-primary-600 rounded-full" /></div>
              <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 border-2 border-primary-200 text-sm font-bold flex items-center justify-center">2</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <label className="block text-sm font-bold text-slate-700">Select Role</label>
                <div className="grid gap-3">
                  {ROLES.map((role) => (
                    <button
                      type="button"
                      key={role.value}
                      onClick={() => { setForm({ ...form, role: role.value }); setStep(2); }}
                      className={`w-full text-left px-5 py-4 border-2 rounded-2xl font-medium transition ${
                        form.role === role.value
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-slate-200 hover:border-primary-300 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                          form.role === role.value ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-500"
                        }`}>
                          <RoleIcon name={role.icon} />
                        </div>
                        <div>
                          <p className="font-semibold">{role.label}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{role.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-slate-500 pt-2">
                  Already registered?{" "}
                  <Link href="/login" className="text-primary-600 font-semibold hover:text-primary-700 transition">Sign In</Link>
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <button type="button" onClick={() => setStep(1)} className="text-sm text-primary-600 font-semibold hover:text-primary-700 transition inline-flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  Change Role
                </button>

                <h3 className="text-lg font-bold text-slate-900">{ROLES.find((r) => r.value === form.role)?.label} Details</h3>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name *</label>
                  <input name="name" required className="form-input" placeholder="John Doe" value={form.name} onChange={handleChange} />
                </div>

                {form.role !== "MEMBER" && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email *</label>
                      <input name="email" type="email" required className="form-input" placeholder="email@church.org" value={form.email} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password *</label>
                      <input name="password" type="password" required className="form-input" placeholder="Min 6 characters" value={form.password} onChange={handleChange} />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone *</label>
                  <input name="phone" required className="form-input" placeholder="+234 XXX XXX XXXX" value={form.phone} onChange={handleChange} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Address</label>
                  <input name="address" className="form-input" placeholder="Optional" value={form.address} onChange={handleChange} />
                </div>

                {form.role === "ZONAL_LEADER" && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Zone Number *</label>
                    <input name="zoneNumber" required className="form-input" placeholder="e.g. ZN-001" value={form.zoneNumber} onChange={handleChange} />
                  </div>
                )}

                {form.role === "CELL_LEADER" && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cell Name *</label>
                      <input name="cellName" required className="form-input" placeholder="e.g. Faith Cell" value={form.cellName} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Zone *</label>
                      <select name="cellZoneId" required className="form-select" value={form.cellZoneId} onChange={handleChange}>
                        <option value="">Select Zone</option>
                        {zones.map((z: any) => <option key={z.id} value={z.id}>Zone {z.zoneNumber}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {["ASST_CELL_LEADER", "E_GROUP_LEADER", "MEMBER"].includes(form.role) && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cell *</label>
                    <select name="cellId" required className="form-select" value={form.cellId} onChange={handleChange}>
                      <option value="">Select Cell</option>
                      {cells.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}

                <div className="pt-2">
                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" opacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                        Registering...
                      </span>
                    ) : "Create Account"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
