"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />
        <div className="relative text-center">
          <div className="w-20 h-20 bg-white/15 rounded-3xl flex items-center justify-center mx-auto mb-6 ring-4 ring-white/10">
            <span className="text-white text-4xl font-bold">&#x271D;</span>
          </div>
          <h1 className="text-4xl font-bold text-white">Cell Ministry</h1>
          <p className="text-primary-200 text-lg mt-3 max-w-sm mx-auto">Track attendance, manage members, and grow your ministry.</p>
          <div className="mt-8 flex justify-center gap-4">
            <div className="bg-white/10 rounded-2xl px-6 py-4 text-white text-sm">
              <p className="text-2xl font-bold text-white">10</p>
              <p className="text-primary-200">Zones</p>
            </div>
            <div className="bg-white/10 rounded-2xl px-6 py-4 text-white text-sm">
              <p className="text-2xl font-bold text-white">40</p>
              <p className="text-primary-200">Cells</p>
            </div>
            <div className="bg-white/10 rounded-2xl px-6 py-4 text-white text-sm">
              <p className="text-2xl font-bold text-white">600+</p>
              <p className="text-primary-200">Members</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="lg:hidden w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">&#x271D;</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 text-center lg:text-left">Welcome Back</h2>
            <p className="text-slate-500 text-sm mt-1 text-center lg:text-left">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="you@church.org"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                required
                className="form-input"
                placeholder="&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" opacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>

            <details className="text-xs text-slate-400 mt-4">
              <summary className="cursor-pointer font-medium text-slate-500 hover:text-slate-700">Test credentials (password: <code className="font-mono bg-slate-100 px-1 rounded">password123</code>)</summary>
              <div className="mt-2 space-y-1 leading-relaxed">
                <p><span className="font-medium text-slate-600">Pastor:</span> pastor@church.org</p>
                <p><span className="font-medium text-slate-600">District:</span> district@church.org</p>
                <p><span className="font-medium text-slate-600">Zonal:</span> zonal1@church.org &ndash; zonal10@church.org</p>
                <p><span className="font-medium text-slate-600">Cell Leader:</span> cellleader@church.org <span className="text-slate-300">or</span> cell1_1@church.org &ndash; cell10_4@church.org</p>
                <p><span className="font-medium text-slate-600">Asst:</span> asst1_1@church.org &ndash; asst10_4@church.org</p>
                <p><span className="font-medium text-slate-600">E-Group:</span> egroup1_1@church.org &ndash; egroup10_4@church.org</p>
              </div>
            </details>

            <p className="text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary-600 font-semibold hover:text-primary-700 transition">
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
