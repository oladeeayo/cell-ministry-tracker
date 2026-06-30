"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ROLE_LABELS: Record<string, string> = {
  COMMUNITY_PASTOR: "Community Pastor",
  DISTRICT_LEADER: "District Leader",
  ZONAL_LEADER: "Zonal Leader",
  CELL_LEADER: "Cell Leader",
  ASST_CELL_LEADER: "Asst. Cell Leader",
  E_GROUP_LEADER: "E-Group Leader",
};

interface Props {
  userRole?: string;
  userName?: string;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", roles: ["COMMUNITY_PASTOR", "DISTRICT_LEADER", "ZONAL_LEADER", "CELL_LEADER", "ASST_CELL_LEADER", "E_GROUP_LEADER"] },
  { label: "Attendance", href: "/dashboard?tab=attendance", icon: "ClipboardCheck", roles: ["CELL_LEADER", "ASST_CELL_LEADER", "E_GROUP_LEADER"] },
  { label: "Registration", href: "/register", icon: "UserPlus", roles: ["COMMUNITY_PASTOR", "DISTRICT_LEADER", "ZONAL_LEADER", "CELL_LEADER"] },
  { label: "Analytics", href: "/dashboard?tab=analytics", icon: "BarChart3", roles: ["COMMUNITY_PASTOR", "DISTRICT_LEADER", "ZONAL_LEADER", "CELL_LEADER"] },
];

const supportItems = [
  { label: "Profile", href: "/profile", icon: "UserCircle" },
];

function Icon({ name, className }: { name: string; className?: string }) {
  const icons: Record<string, JSX.Element> = {
    LayoutDashboard: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>,
    ClipboardCheck: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>,
    UserPlus: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>,
    BarChart3: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>,
    UserCircle: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></svg>,
    LogOut: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  };
  return <span className={className}>{icons[name] || null}</span>;
}

export default function SidebarNavigation({ userRole, userName, isOpen, onClose }: Props) {
  const pathname = usePathname() || "";
  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" && !pathname.includes("?");
    return pathname.startsWith(href.split("?")[0]);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 sm:px-6 py-5 sm:py-6 border-b border-white/5">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary-600 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-white text-base sm:text-lg font-bold">&#x271D;</span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm sm:text-base truncate">Cell Ministry</p>
              <p className="text-slate-400 text-xs hidden sm:block">Tracker</p>
            </div>
          </Link>
          {/* Close button on mobile */}
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>
      </div>

      {/* User info */}
      {userName && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary-600/20 rounded-full flex items-center justify-center shrink-0">
              <span className="text-primary-400 text-xs sm:text-sm font-bold">{userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{userName}</p>
              {userRole && <p className="text-slate-400 text-xs truncate">{ROLE_LABELS[userRole] || userRole}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 px-2 sm:px-3 py-3 sm:py-4 space-y-0.5 sm:space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => !item.roles || (userRole && item.roles.includes(userRole)))
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive(item.href)
                  ? "bg-primary-600/10 text-primary-400"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon name={item.icon} />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
      </nav>

      {/* Support */}
      <div className="px-2 sm:px-3 py-3 sm:py-4 border-t border-white/5 space-y-0.5 sm:space-y-1">
        {supportItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive(item.href)
                ? "bg-primary-600/10 text-primary-400"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon name={item.icon} />
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar (overlay) */}
      <aside className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-sidebar transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar (always visible) */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-72 bg-sidebar z-40 flex-col">
        {sidebarContent}
      </aside>
    </>
  );
}
