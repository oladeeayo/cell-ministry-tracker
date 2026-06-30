"use client";

import { signOut } from "next-auth/react";

interface Props {
  pageTitle: string;
  userName?: string;
  userRole?: string;
  userInitials?: string;
  hasNotifications?: boolean;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  COMMUNITY_PASTOR: "Community Pastor",
  DISTRICT_LEADER: "District Leader",
  ZONAL_LEADER: "Zonal Leader",
  CELL_LEADER: "Cell Leader",
  ASST_CELL_LEADER: "Asst. Cell Leader",
  E_GROUP_LEADER: "E-Group Leader",
};

export default function TopHeader({ pageTitle, userName, userRole, userInitials, hasNotifications, onToggleSidebar, sidebarOpen }: Props) {
  const initials = userInitials || (userName || "").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "??";

  return (
    <header className="sticky top-0 z-20 h-16 lg:h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger button */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition -ml-1"
          aria-label="Toggle sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
            {sidebarOpen ? (
              <>
                <line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/>
              </>
            ) : (
              <>
                <line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/>
              </>
            )}
          </svg>
        </button>

        {/* Desktop sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          className="hidden lg:flex p-2 rounded-xl hover:bg-slate-100 transition"
          aria-label="Toggle sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
            <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>
          </svg>
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 truncate">{pageTitle}</h1>
          {userRole && <p className="text-xs text-slate-400 mt-0.5 truncate">{ROLE_LABELS[userRole] || userRole}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Notification bell */}
        <button className="relative p-2 rounded-xl hover:bg-slate-100 transition hidden sm:block">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {hasNotifications && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />}
        </button>

        {/* User profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block text-right min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate max-w-[120px]">{userName || "User"}</p>
            <p className="text-xs text-slate-400 truncate max-w-[120px]">{userRole ? ROLE_LABELS[userRole] : ""}</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white text-xs sm:text-sm font-bold shrink-0">
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
