"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import OverviewDashboard from "@/components/OverviewDashboard";
import ZoneDashboardView from "@/components/ZoneDashboardView";
import CellDashboardView from "@/components/CellDashboardView";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userMeta, setUserMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchUserMeta();
    }
  }, [status]);

  const fetchUserMeta = async () => {
    const user = session?.user as any;
    if (!user) return;

    try {
      if (user.role === "ZONAL_LEADER") {
        const res = await fetch(`/api/zones`);
        const zones = await res.json();
        const myZone = zones.find((z: any) => z.zonalLeaderId === parseInt(user.id));
        setUserMeta({ zoneId: myZone?.id });
      } else if (user.role === "CELL_LEADER") {
        const res = await fetch(`/api/cells`);
        const cells = await res.json();
        const myCell = cells.find((c: any) => c.cellLeaderId === parseInt(user.id));
        setUserMeta({ cellId: myCell?.id });
      } else if (["ASST_CELL_LEADER", "E_GROUP_LEADER"].includes(user.role)) {
        const cellsRes = await fetch(`/api/user-meta?userId=${user.id}`);
        const meta = await cellsRes.json();
        setUserMeta({ cellId: meta.cellId });
      } else {
        setUserMeta({});
      }
    } catch (e) {
      console.error("Failed to fetch user meta", e);
    }
    setLoading(false);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const user = session?.user as any;
  if (!user) return null;

  const role = user.role;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {role === "COMMUNITY_PASTOR" && <OverviewDashboard userRole={role} />}
        {role === "DISTRICT_LEADER" && <OverviewDashboard userRole={role} />}
        {role === "ZONAL_LEADER" && userMeta?.zoneId && (
          <ZoneDashboardView zoneId={userMeta.zoneId} />
        )}
        {role === "ZONAL_LEADER" && !userMeta?.zoneId && (
          <div className="text-center py-12 text-gray-400">
            No zone assigned to your account. Contact your administrator.
          </div>
        )}
        {role === "CELL_LEADER" && userMeta?.cellId && (
          <CellDashboardView cellId={userMeta.cellId} />
        )}
        {role === "CELL_LEADER" && !userMeta?.cellId && (
          <div className="text-center py-12 text-gray-400">
            No cell assigned to your account. Contact your administrator.
          </div>
        )}
        {["ASST_CELL_LEADER", "E_GROUP_LEADER"].includes(role) && userMeta?.cellId && (
          <CellDashboardView cellId={userMeta.cellId} />
        )}
        {["ASST_CELL_LEADER", "E_GROUP_LEADER"].includes(role) && !userMeta?.cellId && (
          <div className="text-center py-12 text-gray-400">
            No cell assigned to your account. Contact your administrator.
          </div>
        )}
      </main>
    </div>
  );
}
