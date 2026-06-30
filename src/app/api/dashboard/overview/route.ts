import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const rangeStart = fromParam ? new Date(fromParam) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const rangeEnd = toParam ? new Date(toParam + "T23:59:59") : new Date();

  const zones = await prisma.zone.findMany({
    include: { zonalLeader: { select: { name: true } }, _count: { select: { cells: true } }, cells: { include: { _count: { select: { members: true } } } } },
  });

  const allCellIds = zones.flatMap((z) => z.cells.map((c) => c.id));
  const totalZones = zones.length;
  const totalCells = zones.reduce((s, z) => s + z._count.cells, 0);
  const totalMembers = zones.reduce((s, z) => s + z.cells.reduce((s2, c) => s2 + c._count.members, 0), 0);

  const lastSunday = new Date(); const day = lastSunday.getDay(); lastSunday.setDate(lastSunday.getDate() - (day === 0 ? 0 : day)); lastSunday.setHours(12, 0, 0, 0);

  const presentThisSunday = await prisma.attendance.count({ where: { cellId: { in: allCellIds }, date: lastSunday, isPresent: true } });
  const attendanceInRange = await prisma.attendance.count({ where: { cellId: { in: allCellIds }, date: { gte: rangeStart, lte: rangeEnd }, isPresent: true } });
  const prevMonthStart = new Date(rangeStart.getFullYear(), rangeStart.getMonth() - 1, 1);
  const prevMonthEnd = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 0, 23, 59, 59, 999);
  const prevMonthCount = await prisma.attendance.count({ where: { cellId: { in: allCellIds }, date: { gte: prevMonthStart, lte: prevMonthEnd }, isPresent: true } });
  const momGrowth = prevMonthCount > 0 ? Math.round(((attendanceInRange - prevMonthCount) / prevMonthCount) * 100) : attendanceInRange > 0 ? 100 : 0;
  const cellsWithSubmission = await prisma.attendance.groupBy({ by: ["cellId"], where: { cellId: { in: allCellIds }, date: { gte: rangeStart, lte: rangeEnd } } });

  // Weekly trend
  const sundays: Date[] = [];
  const d = new Date(rangeStart);
  while (d <= rangeEnd) {
    if (d.getDay() === 0) { const nw = new Date(d); nw.setDate(d.getDate() + 7); if (nw.getMonth() === d.getMonth()) sundays.push(new Date(d)); }
    d.setDate(d.getDate() + 1);
  }
  const weeklyTrend = await Promise.all(sundays.map(async (sunday) => {
    const end = new Date(sunday); end.setHours(23, 59, 59, 999);
    const present = await prisma.attendance.count({ where: { cellId: { in: allCellIds }, date: { gte: sunday, lte: end }, isPresent: true } });
    return { date: sunday.toISOString().split("T")[0], present };
  }));

  const zoneStats = await Promise.all(zones.map(async (zone) => {
    const zcIds = zone.cells.map((c) => c.id);
    const zPresent = await prisma.attendance.count({ where: { cellId: { in: zcIds }, date: lastSunday, isPresent: true } });
    const zMonthly = await prisma.attendance.count({ where: { cellId: { in: zcIds }, date: { gte: rangeStart, lte: rangeEnd }, isPresent: true } });
    const zTotalAtt = await prisma.attendance.count({ where: { cellId: { in: zcIds }, date: { gte: rangeStart, lte: rangeEnd } } });
    const zRate = zTotalAtt > 0 ? Math.round((zMonthly / zTotalAtt) * 100) : 0;
    return { id: zone.id, zoneNumber: zone.zoneNumber, zonalLeader: zone.zonalLeader.name, totalCells: zone._count.cells, totalMembers: zone.cells.reduce((s, c) => s + c._count.members, 0), presentThisSunday: zPresent, attendanceInRange: zMonthly, attendanceRate: zRate };
  }));

  return NextResponse.json({
    stats: { totalZones, totalCells, totalMembers, presentThisSunday, cellsWithSubmission: cellsWithSubmission.length, attendanceInRange, momGrowth },
    zones: zoneStats, weeklyTrend, range: { from: rangeStart.toISOString().split("T")[0], to: rangeEnd.toISOString().split("T")[0] },
  });
}
