"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import SidebarNavigation from "./SidebarNavigation";
import TopHeader from "./TopHeader";
import PageFooter from "./PageFooter";

interface Props {
  children: React.ReactNode;
  pageTitle: string;
}

export default function LayoutWrapper({ children, pageTitle }: Props) {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  return (
    <div className="min-h-screen bg-surface">
      <SidebarNavigation
        userRole={user?.role}
        userName={user?.name}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? "lg:ml-72" : "lg:ml-0"}`}>
        <TopHeader
          pageTitle={pageTitle}
          userName={user?.name}
          userRole={user?.role}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </main>
        <PageFooter />
      </div>
    </div>
  );
}
