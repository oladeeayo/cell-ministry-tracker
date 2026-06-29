import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function getLastSunday(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 0 : day;
  d.setDate(d.getDate() - diff);
  d.setHours(12, 0, 0, 0);
  return d;
}

function getMonthStart(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(date: Date = new Date()): Date {
  const d = getWeekStart(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getPrevMonthStart(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1, 0, 0, 0, 0);
}

function getPrevMonthEnd(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 0, 23, 59, 59, 999);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const lastSunday = getLastSunday(now);
  const monthStart = getMonthStart(now);
  const weekStart = getWeekStart(now);
  const weekEnd = getWeekEnd(now);
  const prevMonthStart = getPrevMonthStart(now);
  const prevMonthEnd = getPrevMonthEnd(now);

  // Zone stats
  const zones = await prisma.zone.findMany({
    include: {
      zonalLeader: { select: { name: true } },
      _count: { select: { cells: true } },
      cells: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
  });

  const totalZones = zones.length;
  const totalCells = zones.reduce((sum, z) => sum + z._count.cells, 0);
  const totalMembers = zones.reduce(
    (sum, z) => sum + z.cells.reduce((s, c) => s + c._count.members, 0),
    0
  );

  const allCellIds = zones.flatMap((z) => z.cells.map((c) => c.id));

  const presentThisSunday = await prisma.attendance.count({
    where: { cellId: { in: allCellIds }, date: lastSunday, isPresent: true },
  });

  const attendanceThisMonth = await prisma.attendance.count({
    where: { cellId: { in: allCellIds }, date: { gte: monthStart }, isPresent: true },
  });

  const attendancePrevMonth = await prisma.attendance.count({
    where: { cellId: { in: allCellIds }, date: { gte: prevMonthStart, lte: prevMonthEnd }, isPresent: true },
  });

  const momGrowth =
    attendancePrevMonth > 0
      ? Math.round(((attendanceThisMonth - attendancePrevMonth) / attendancePrevMonth) * 100)
      : attendanceThisMonth > 0 ? 100 : 0;

  const cellsWithSubmission = await prisma.attendance.groupBy({
    by: ["cellId"],
    where: { cellId: { in: allCellIds }, date: { gte: weekStart, lte: weekEnd } },
  });

  // Per-zone breakdown
  const zoneStats = await Promise.all(
    zones.map(async (zone) => {
      const zoneCellIds = zone.cells.map((c) => c.id);
      const zPresent = await prisma.attendance.count({
        where: { cellId: { in: zoneCellIds }, date: lastSunday, isPresent: true },
      });
      const zMonthly = await prisma.attendance.count({
        where: { cellId: { in: zoneCellIds }, date: { gte: monthStart }, isPresent: true },
      });
      return {
        id: zone.id,
        zoneNumber: zone.zoneNumber,
        zonalLeader: zone.zonalLeader.name,
        totalCells: zone._count.cells,
        totalMembers: zone.cells.reduce((s, c) => s + c._count.members, 0),
        presentThisSunday: zPresent,
        attendanceThisMonth: zMonthly,
      };
    })
  );

  return NextResponse.json({
    stats: {
      totalZones,
      totalCells,
      totalMembers,
      presentThisSunday,
      cellsWithSubmission: cellsWithSubmission.length,
      attendanceThisMonth,
      attendancePrevMonth,
      momGrowth,
    },
    zones: zoneStats,
  });
}
