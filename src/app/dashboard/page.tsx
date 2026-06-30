"use client";

import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import OverviewDashboard from "@/components/OverviewDashboard";
import ZoneDashboardView from "@/components/ZoneDashboardView";
import CellDashboardView from "@/components/CellDashboardView";

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userMeta, setUserMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [zoneCell, setZoneCell] = useState<any>(null);

  const drillZone = searchParams.get("zone");
  const drillCell = searchParams.get("cell");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") fetchUserMeta();
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
      } else if (["CELL_LEADER", "ASST_CELL_LEADER", "E_GROUP_LEADER", "MEMBER"].includes(user.role)) {
        const cellsRes = await fetch(`/api/user-meta?userId=${user.id}`);
        const meta = await cellsRes.json();
        setUserMeta({ cells: meta.cells || [], cellId: meta.cellId });
      } else {
        setUserMeta({});
      }
    } catch (e) { console.error("Failed to fetch user meta", e); }
    setLoading(false);
  };

  useEffect(() => {
    if (drillCell) {
      fetch(`/api/cells?id=${drillCell}`).then(r => r.json()).then(data => {
        if (data.cells) setZoneCell({ cells: data.cells, defaultCellId: parseInt(drillCell) });
        else setZoneCell({ cells: [{ id: parseInt(drillCell), name: "Cell", zoneId: 0 }], defaultCellId: parseInt(drillCell) });
      }).catch(() => setLoading(false));
    } else if (drillZone) {
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [drillCell, drillZone]);

  if (status === "loading" || (loading && !drillCell && !drillZone)) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-400">Loading...</div></div>;
  }

  const user = session?.user as any;
  if (!user) return null;
  const role = user.role;

  const isHigherRole = ["COMMUNITY_PASTOR", "DISTRICT_LEADER"].includes(role);
  const isZonalLeader = role === "ZONAL_LEADER";
  const isCellLeader = ["CELL_LEADER", "ASST_CELL_LEADER", "E_GROUP_LEADER"].includes(role);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {(isHigherRole || drillZone || drillCell) && (
          <button onClick={() => router.push("/dashboard")} className="text-sm text-primary-700 hover:underline mb-4 inline-block">&larr; Back to Overview</button>
        )}
        {isHigherRole && !drillZone && !drillCell && <OverviewDashboard userRole={role} />}
        {!!drillZone && <ZoneDashboardView zoneId={parseInt(drillZone!)} userRole={role} />}
        {!!drillCell && zoneCell && <CellDashboardView cells={zoneCell.cells} userRole={role} defaultCellId={zoneCell.defaultCellId} />}
        {isZonalLeader && !drillCell && userMeta?.zoneId && <ZoneDashboardView zoneId={userMeta.zoneId} userRole={role} />}
        {isZonalLeader && !userMeta?.zoneId && <div className="text-center py-12 text-gray-400">No zone assigned. Contact your administrator.</div>}
        {isCellLeader && !drillZone && !drillCell && userMeta?.cells?.length > 0 && <CellDashboardView cells={userMeta.cells} userRole={role} defaultCellId={userMeta.cellId} />}
        {isCellLeader && !drillZone && !drillCell && (!userMeta?.cells || userMeta.cells.length === 0) && <div className="text-center py-12 text-gray-400">No cell assigned. Contact your administrator.</div>}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-400">Loading...</div></div>}>
      <DashboardContent />
    </Suspense>
  );
}
