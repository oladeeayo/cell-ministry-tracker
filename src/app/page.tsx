"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.push("/dashboard");
  }, [status, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center ring-2 ring-white/10">
              <span className="text-white text-xl font-bold">&#x271D;</span>
            </div>
            <span className="text-white text-lg font-bold">Cell Ministry</span>
          </div>
          <div className="flex gap-3">
            <Link href="/login" className="px-5 py-2.5 text-white border border-white/20 rounded-xl text-sm font-semibold hover:bg-white/10 transition">
              Login
            </Link>
            <Link href="/register" className="px-5 py-2.5 bg-white text-primary-700 rounded-xl text-sm font-semibold hover:bg-primary-50 transition">
              Register
            </Link>
          </div>
        </nav>

        <main className="mt-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Track Your Cell Ministry
            <span className="block text-primary-200">Attendance & Growth</span>
          </h1>
          <p className="text-lg text-primary-100/80 max-w-2xl mx-auto mb-12">
            A comprehensive system for tracking attendance across all cells and zones in your church small group ministry.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            {[
              { icon: "UserPlus", title: "Smart Registration", desc: "Register members at every level with role-specific forms." },
              { icon: "ClipboardCheck", title: "Attendance Tracking", desc: "Weekly attendance sheet with toggle switches for each member." },
              { icon: "BarChart3", title: "Powerful Analytics", desc: "Real-time dashboards with MoM growth and attendance rates." },
            ].map((item) => (
              <div key={item.title} className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 text-left border border-white/5 card-hover">
                <div className="w-12 h-12 bg-primary-400/20 rounded-xl flex items-center justify-center mb-4">
                  {item.icon === "UserPlus" && <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>}
                  {item.icon === "ClipboardCheck" && <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>}
                  {item.icon === "BarChart3" && <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>}
                </div>
                <h3 className="text-white text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-primary-200 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-20 border-t border-white/10 pt-12 pb-8">
            <div className="flex flex-wrap justify-center gap-6 text-primary-200 text-sm">
              {["Community Pastor", "District Leader", "Zonal Leader", "Cell Leader", "Asst. Cell Leader", "E-Group Leader"].map((r, i) => (
                <span key={r} className={`${i > 0 ? "pl-6 border-l border-white/10" : ""}`}>{r}</span>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
