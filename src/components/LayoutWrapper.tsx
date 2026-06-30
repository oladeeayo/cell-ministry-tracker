"use client";

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

  return (
    <div className="min-h-screen bg-surface">
      <SidebarNavigation userRole={user?.role} userName={user?.name} />
      <div className="ml-72 flex flex-col min-h-screen">
        <TopHeader
          pageTitle={pageTitle}
          userName={user?.name}
          userRole={user?.role}
        />
        <main className="flex-1 px-8 py-8">
          {children}
        </main>
        <PageFooter />
      </div>
    </div>
  );
}
