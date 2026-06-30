"use client";

import { useState } from "react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      {/* Sidebar */}
      <SidebarNavigation
        userRole={user?.role}
        userName={user?.name}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Backdrop overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="lg:ml-72 flex flex-col min-h-screen transition-all duration-300">
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
