"use client";

import { Suspense, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LayoutWrapper from "@/components/LayoutWrapper";
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
        if (Array.isArray(data)) setZoneCell({ cells: data, defaultCellId: parseInt(drillCell) });
        else if (data.cells) setZoneCell({ cells: data.cells, defaultCellId: parseInt(drillCell) });
        else setZoneCell({ cells: [{ id: parseInt(drillCell), name: "Cell", zoneId: 0 }], defaultCellId: parseInt(drillCell) });
      }).catch(() => setLoading(false));
    } else if (drillZone) {
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [drillCell, drillZone]);

  const user = session?.user as any;
  if (status === "loading" || (loading && !drillCell && !drillZone)) {
    return <LayoutWrapper pageTitle="Loading..."><div className="flex items-center justify-center py-20"><div className="text-slate-400">Loading dashboard...</div></div></LayoutWrapper>;
  }
  if (!user || status !== "authenticated") return null;
  const role = user.role;

  const isHigherRole = ["COMMUNITY_PASTOR", "DISTRICT_LEADER"].includes(role);
  const isZonalLeader = role === "ZONAL_LEADER";
  const isCellLeader = ["CELL_LEADER", "ASST_CELL_LEADER", "E_GROUP_LEADER"].includes(role);

  const pageTitle = useMemo(() => {
    if (drillCell) return "Cell Dashboard";
    if (drillZone) return `Zone ${drillZone} Dashboard`;
    if (isZonalLeader) return "Zone Dashboard";
    if (isCellLeader) return "Cell Dashboard";
    return "Dashboard Overview";
  }, [drillZone, drillCell, isZonalLeader, isCellLeader]);

  const zoneLoaded = drillZone || (isZonalLeader && userMeta?.zoneId);
  const cellLoaded = (drillCell && zoneCell) || (isCellLeader && userMeta?.cells?.length > 0);

  return (
    <LayoutWrapper pageTitle={pageTitle}>
      {(isHigherRole || drillZone || drillCell) && (
        <button onClick={() => router.push("/dashboard")} className="text-sm text-primary-600 hover:text-primary-700 mb-6 inline-flex items-center gap-1.5 font-medium transition">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back to Overview
        </button>
      )}

      {isHigherRole && !drillZone && !drillCell && <OverviewDashboard userRole={role} />}
      {!!drillZone && <ZoneDashboardView zoneId={parseInt(drillZone!)} userRole={role} />}
      {!!drillCell && zoneCell && <CellDashboardView cells={zoneCell.cells} userRole={role} defaultCellId={zoneCell.defaultCellId} />}
      {isZonalLeader && !drillCell && userMeta?.zoneId && <ZoneDashboardView zoneId={userMeta.zoneId} userRole={role} />}
      {isZonalLeader && !drillCell && !userMeta?.zoneId && <div className="card-compact text-center py-12"><p className="text-slate-400">No zone assigned. Contact your administrator.</p></div>}
      {isCellLeader && !drillZone && !drillCell && userMeta?.cells?.length > 0 && <CellDashboardView cells={userMeta.cells} userRole={role} defaultCellId={userMeta.cellId} />}
      {isCellLeader && !drillZone && !drillCell && (!userMeta?.cells || userMeta.cells.length === 0) && <div className="card-compact text-center py-12"><p className="text-slate-400">No cell assigned. Contact your administrator.</p></div>}
    </LayoutWrapper>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center"><div className="text-slate-400">Loading...</div></div>}>
      <DashboardContent />
    </Suspense>
  );
}
