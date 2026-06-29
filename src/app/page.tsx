"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700">
      <div className="max-w-6xl mx-auto px-4">
        <nav className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">✝</span>
            </div>
            <span className="text-white text-xl font-semibold">Cell Ministry Tracker</span>
          </div>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-5 py-2 text-white border border-white/30 rounded-lg hover:bg-white/10 transition"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 bg-white text-primary-800 rounded-lg font-medium hover:bg-white/90 transition"
            >
              Register
            </Link>
          </div>
        </nav>

        <main className="mt-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Track Your Cell Ministry
            <span className="block text-primary-200">Attendance & Growth</span>
          </h1>
          <p className="text-xl text-primary-100/80 max-w-2xl mx-auto mb-12">
            A comprehensive system for tracking attendance across all cells and zones in your church small group ministry.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-left">
              <div className="w-12 h-12 bg-primary-400/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">Smart Registration</h3>
              <p className="text-primary-200 text-sm">
                Register members at every level - from Zonal Leaders to Cell Members with role-specific forms.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-left">
              <div className="w-12 h-12 bg-primary-400/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">Attendance Tracking</h3>
              <p className="text-primary-200 text-sm">
                Weekly attendance sheet with checkboxes for each member. Track presence every Sunday.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-left">
              <div className="w-12 h-12 bg-primary-400/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">Powerful Analytics</h3>
              <p className="text-primary-200 text-sm">
                Real-time dashboards with MoM growth, attendance rates, and submission tracking per zone.
              </p>
            </div>
          </div>

          <div className="mt-20 border-t border-white/10 pt-12 pb-8">
            <div className="flex flex-wrap justify-center gap-8 text-primary-200 text-sm">
              <span>Community Pastor</span>
              <span className="text-white/30">|</span>
              <span>District Leader</span>
              <span className="text-white/30">|</span>
              <span>Zonal Leader</span>
              <span className="text-white/30">|</span>
              <span>Cell Leader</span>
              <span className="text-white/30">|</span>
              <span>Asst. Cell Leader</span>
              <span className="text-white/30">|</span>
              <span>E-Group Leader</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
