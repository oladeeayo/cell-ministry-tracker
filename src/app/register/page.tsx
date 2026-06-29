"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ROLES = [
  { value: "ZONAL_LEADER", label: "Zonal Leader" },
  { value: "CELL_LEADER", label: "Cell Leader" },
  { value: "ASST_CELL_LEADER", label: "Asst. Cell Leader" },
  { value: "E_GROUP_LEADER", label: "E-Group Leader" },
  { value: "MEMBER", label: "Cell Member" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState<any[]>([]);
  const [cells, setCells] = useState<any[]>([]);

  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    address: "",
    role: "",
    zoneNumber: "",
    zonalLeaderPhone: "",
    zonalLeaderAddress: "",
    cellName: "",
    cellZoneId: "",
    cellLeaderAddress: "",
    cellLeaderPhone: "",
    cellId: "",
  });

  useEffect(() => {
    if (form.role === "CELL_LEADER") {
      fetch("/api/zones").then((r) => r.json()).then(setZones).catch(() => {});
    }
    if (["ASST_CELL_LEADER", "E_GROUP_LEADER", "MEMBER"].includes(form.role)) {
      fetch("/api/cells").then((r) => r.json()).then(setCells).catch(() => {});
    }
  }, [form.role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body: any = {
      email: form.email,
      password: form.password,
      name: form.name,
      phone: form.phone,
      address: form.address,
      role: form.role,
    };

    if (form.role === "ZONAL_LEADER") {
      body.zoneData = {
        zoneNumber: form.zoneNumber,
        zonalLeaderPhone: form.zonalLeaderPhone || form.phone,
        zonalLeaderAddress: form.zonalLeaderAddress || form.address,
      };
    }

    if (form.role === "CELL_LEADER") {
      body.cellData = {
        name: form.cellName,
        zoneId: form.cellZoneId,
        cellLeaderAddress: form.cellLeaderAddress || form.address,
        cellLeaderPhone: form.cellLeaderPhone || form.phone,
      };
    }

    if (["ASST_CELL_LEADER", "E_GROUP_LEADER", "MEMBER"].includes(form.role)) {
      body.cellData = { cellId: form.cellId };
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-2xl font-bold">✝</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Register</h1>
          <p className="text-primary-200 text-sm mt-1">Create a new account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Role
              </label>
              <div className="grid gap-3">
                {ROLES.map((role) => (
                  <button
                    type="button"
                    key={role.value}
                    onClick={() => {
                      setForm({ ...form, role: role.value });
                      setStep(2);
                    }}
                    className={`w-full text-left px-5 py-4 border-2 rounded-xl font-medium transition ${
                      form.role === role.value
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-gray-200 hover:border-primary-300 hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-primary-600 hover:underline mb-4 flex items-center gap-1"
              >
                ← Change Role
              </button>

              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {ROLES.find((r) => r.value === form.role)?.label} Details
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input name="name" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="John Doe" value={form.name} onChange={handleChange} />
                </div>

                {form.role !== "MEMBER" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input name="email" type="email" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="email@church.org" value={form.email} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                      <input name="password" type="password" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="Min 6 characters" value={form.password} onChange={handleChange} />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input name="phone" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="+234 XXX XXX XXXX" value={form.phone} onChange={handleChange} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input name="address" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="Optional" value={form.address} onChange={handleChange} />
                </div>

                {form.role === "ZONAL_LEADER" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Zone Number *</label>
                      <input name="zoneNumber" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="e.g. ZN-001" value={form.zoneNumber} onChange={handleChange} />
                    </div>
                  </>
                )}

                {form.role === "CELL_LEADER" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cell Name *</label>
                      <input name="cellName" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="e.g. Faith Cell" value={form.cellName} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Zone *</label>
                      <select name="cellZoneId" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" value={form.cellZoneId} onChange={handleChange}>
                        <option value="">Select Zone</option>
                        {zones.map((z: any) => (
                          <option key={z.id} value={z.id}>Zone {z.zoneNumber}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {["ASST_CELL_LEADER", "E_GROUP_LEADER", "MEMBER"].includes(form.role) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cell *</label>
                    <select name="cellId" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" value={form.cellId} onChange={handleChange}>
                      <option value="">Select Cell</option>
                      {cells.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-primary-700 text-white rounded-lg font-medium hover:bg-primary-800 disabled:opacity-50 transition"
                >
                  {loading ? "Registering..." : "Create Account"}
                </button>
              </div>
            </>
          )}

          {step === 1 && (
            <p className="text-center mt-4 text-sm text-gray-500">
              Already registered?{" "}
              <Link href="/login" className="text-primary-600 font-medium hover:underline">
                Sign In
              </Link>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
