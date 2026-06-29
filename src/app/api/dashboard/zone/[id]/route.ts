import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

function getPrevMonthStart(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1, 0, 0, 0, 0);
}

function getPrevMonthEnd(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 0, 23, 59, 59, 999);
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const zoneId = parseInt(params.id);
  const now = new Date();
  const lastSunday = getLastSunday(now);
  const monthStart = getMonthStart(now);
  const prevMonthStart = getPrevMonthStart(now);
  const prevMonthEnd = getPrevMonthEnd(now);
  const weekStart = getWeekStart(now);
  const weekEnd = getWeekEnd(now);

  const zone = await prisma.zone.findUnique({
    where: { id: zoneId },
    include: {
      zonalLeader: { select: { id: true, name: true, email: true, phone: true } },
      cells: {
        include: {
          _count: { select: { members: true } },
          cellLeader: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!zone) {
    return NextResponse.json({ error: "Zone not found" }, { status: 404 });
  }

  const cellIds = zone.cells.map((c) => c.id);
  const totalCells = zone.cells.length;

  // Cells with submission this week
  const cellsWithSubmission = await prisma.attendance.groupBy({
    by: ["cellId"],
    where: {
      cellId: { in: cellIds },
      date: { gte: weekStart, lte: weekEnd },
    },
  });

  // Total members across all cells in zone
  const totalMembers = zone.cells.reduce((sum, c) => sum + c._count.members, 0);

  // Present this Sunday
  const presentThisSunday = await prisma.attendance.count({
    where: {
      cellId: { in: cellIds },
      date: lastSunday,
      isPresent: true,
    },
  });

  // Attendance this month
  const attendanceThisMonth = await prisma.attendance.count({
    where: {
      cellId: { in: cellIds },
      date: { gte: monthStart },
      isPresent: true,
    },
  });

  // Attendance last month
  const attendancePrevMonth = await prisma.attendance.count({
    where: {
      cellId: { in: cellIds },
      date: { gte: prevMonthStart, lte: prevMonthEnd },
      isPresent: true,
    },
  });

  const momGrowth =
    attendancePrevMonth > 0
      ? Math.round(
          ((attendanceThisMonth - attendancePrevMonth) / attendancePrevMonth) * 100
        )
      : attendanceThisMonth > 0
      ? 100
      : 0;

  // Per-cell stats
  const cellStats = await Promise.all(
    zone.cells.map(async (cell) => {
      const cellPresentThisSunday = await prisma.attendance.count({
        where: { cellId: cell.id, date: lastSunday, isPresent: true },
      });
      const cellAttendanceThisMonth = await prisma.attendance.count({
        where: { cellId: cell.id, date: { gte: monthStart }, isPresent: true },
      });
      return {
        id: cell.id,
        name: cell.name,
        leaderName: cell.cellLeader?.name || "N/A",
        totalMembers: cell._count.members,
        presentThisSunday: cellPresentThisSunday,
        attendanceThisMonth: cellAttendanceThisMonth,
      };
    })
  );

  return NextResponse.json({
    zone,
    stats: {
      totalCells,
      cellsWithSubmission: cellsWithSubmission.length,
      totalMembers,
      presentThisSunday,
      attendanceThisMonth,
      attendancePrevMonth,
      momGrowth,
      lastSundayDate: lastSunday.toISOString().split("T")[0],
    },
    cellStats,
  });
}
