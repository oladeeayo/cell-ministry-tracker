import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const zoneId = parseInt(params.id);
  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const rangeStart = fromParam ? new Date(fromParam) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const rangeEnd = toParam ? new Date(toParam + "T23:59:59") : new Date();

  const zone = await prisma.zone.findUnique({
    where: { id: zoneId },
    include: { zonalLeader: { select: { id: true, name: true } }, cells: { include: { _count: { select: { members: true } }, cellLeader: { select: { id: true, name: true } } } } },
  });
  if (!zone) return NextResponse.json({ error: "Zone not found" }, { status: 404 });

  const cellIds = zone.cells.map((c) => c.id);
  const totalCells = zone.cells.length;
  const totalMembers = zone.cells.reduce((s, c) => s + c._count.members, 0);

  // Sunday trend
  const sundays: Date[] = [];
  const d = new Date(rangeStart);
  while (d <= rangeEnd) {
    if (d.getDay() === 0) { const nw = new Date(d); nw.setDate(d.getDate() + 7); if (nw.getMonth() === d.getMonth()) sundays.push(new Date(d)); }
    d.setDate(d.getDate() + 1);
  }

  const weeklyTrend = await Promise.all(sundays.map(async (sunday) => {
    const endOfDay = new Date(sunday); endOfDay.setHours(23, 59, 59, 999);
    const present = await prisma.attendance.count({ where: { cellId: { in: cellIds }, date: { gte: sunday, lte: endOfDay }, isPresent: true } });
    return { date: sunday.toISOString().split("T")[0], present };
  }));

  const lastSunday = new Date(); const day = lastSunday.getDay(); lastSunday.setDate(lastSunday.getDate() - (day === 0 ? 0 : day)); lastSunday.setHours(12, 0, 0, 0);
  const presentThisSunday = await prisma.attendance.count({ where: { cellId: { in: cellIds }, date: lastSunday, isPresent: true } });
  const attendanceInRange = await prisma.attendance.count({ where: { cellId: { in: cellIds }, date: { gte: rangeStart, lte: rangeEnd }, isPresent: true } });
  const prevMonthStart = new Date(rangeStart.getFullYear(), rangeStart.getMonth() - 1, 1);
  const prevMonthEnd = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 0, 23, 59, 59, 999);
  const prevMonthCount = await prisma.attendance.count({ where: { cellId: { in: cellIds }, date: { gte: prevMonthStart, lte: prevMonthEnd }, isPresent: true } });

  const cellsWithSubmission = await prisma.attendance.groupBy({
    by: ["cellId"], where: { cellId: { in: cellIds }, date: { gte: rangeStart, lte: rangeEnd } },
  });
  const momGrowth = prevMonthCount > 0 ? Math.round(((attendanceInRange - prevMonthCount) / prevMonthCount) * 100) : attendanceInRange > 0 ? 100 : 0;

  const cellStats = await Promise.all(zone.cells.map(async (cell) => {
    const cPresent = await prisma.attendance.count({ where: { cellId: cell.id, date: lastSunday, isPresent: true } });
    const cMonthly = await prisma.attendance.count({ where: { cellId: cell.id, date: { gte: rangeStart, lte: rangeEnd }, isPresent: true } });
    const cTotal = await prisma.attendance.count({ where: { cellId: cell.id, date: { gte: rangeStart, lte: rangeEnd } } });
    const cRate = cTotal > 0 ? Math.round((cMonthly / cTotal) * 100) : 0;
    return { id: cell.id, name: cell.name, leaderName: cell.cellLeader?.name || "N/A", totalMembers: cell._count.members, presentThisSunday: cPresent, attendanceInRange: cMonthly, attendanceRate: cRate };
  }));

  return NextResponse.json({
    zone, stats: { totalCells, cellsWithSubmission: cellsWithSubmission.length, totalMembers, presentThisSunday, attendanceInRange, momGrowth, lastSundayDate: lastSunday.toISOString().split("T")[0] },
    cellStats, weeklyTrend, range: { from: rangeStart.toISOString().split("T")[0], to: rangeEnd.toISOString().split("T")[0] },
  });
}
