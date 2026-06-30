"use client";

import { signOut } from "next-auth/react";

interface Props {
  pageTitle: string;
  userName?: string;
  userRole?: string;
  userInitials?: string;
  hasNotifications?: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  COMMUNITY_PASTOR: "Community Pastor",
  DISTRICT_LEADER: "District Leader",
  ZONAL_LEADER: "Zonal Leader",
  CELL_LEADER: "Cell Leader",
  ASST_CELL_LEADER: "Asst. Cell Leader",
  E_GROUP_LEADER: "E-Group Leader",
};

export default function TopHeader({ pageTitle, userName, userRole, userInitials, hasNotifications }: Props) {
  const initials = userInitials || (userName || "").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "??";

  return (
    <header className="sticky top-0 z-30 h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{pageTitle}</h1>
        {userRole && <p className="text-xs text-slate-400 mt-0.5">{ROLE_LABELS[userRole] || userRole}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button className="relative p-2 rounded-xl hover:bg-slate-100 transition">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {hasNotifications && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />}
        </button>

        {/* User profile */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-slate-800">{userName || "User"}</p>
            <p className="text-xs text-slate-400">{userRole ? ROLE_LABELS[userRole] : ""}</p>
          </div>
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">
            {initials}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="p-2 rounded-xl hover:bg-red-50 transition group"
            title="Sign Out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-red-500">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
