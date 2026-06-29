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

  const cellId = parseInt(params.id);
  const now = new Date();
  const lastSunday = getLastSunday(now);
  const monthStart = getMonthStart(now);
  const prevMonthStart = getPrevMonthStart(now);
  const prevMonthEnd = getPrevMonthEnd(now);

  const cell = await prisma.cell.findUnique({
    where: { id: cellId },
    include: {
      zone: { select: { id: true, zoneNumber: true } },
      cellLeader: { select: { id: true, name: true } },
    },
  });

  if (!cell) {
    return NextResponse.json({ error: "Cell not found" }, { status: 404 });
  }

  const totalMembers = await prisma.cellMember.count({
    where: { cellId },
  });

  const presentThisSunday = await prisma.attendance.count({
    where: {
      cellId,
      date: lastSunday,
      isPresent: true,
    },
  });

  const attendanceThisMonth = await prisma.attendance.count({
    where: {
      cellId,
      date: { gte: monthStart },
      isPresent: true,
    },
  });

  const attendancePrevMonth = await prisma.attendance.count({
    where: {
      cellId,
      date: { gte: prevMonthStart, lte: prevMonthEnd },
      isPresent: true,
    },
  });

  // Get all Sunday dates this month for the attendance sheet
  const sundaysThisMonth: Date[] = [];
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0) {
      // Skip last Sunday of the month
      const nextWeek = new Date(d);
      nextWeek.setDate(d.getDate() + 7);
      if (nextWeek.getMonth() !== d.getMonth()) continue;

      sundaysThisMonth.push(new Date(d));
    }
  }

  const members = await prisma.cellMember.findMany({
    where: { cellId },
    orderBy: { name: "asc" },
  });

  // Get attendance records for this month
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      cellId,
      date: { gte: monthStart },
    },
  });

  // Build attendance matrix: memberId -> dateStr -> isPresent
  const attendanceMap: Record<number, Record<string, boolean>> = {};
  for (const record of attendanceRecords) {
    const dateStr = record.date.toISOString().split("T")[0];
    if (!attendanceMap[record.cellMemberId]) {
      attendanceMap[record.cellMemberId] = {};
    }
    attendanceMap[record.cellMemberId][dateStr] = record.isPresent;
  }

  const momGrowth =
    attendancePrevMonth > 0
      ? Math.round(
          ((attendanceThisMonth - attendancePrevMonth) / attendancePrevMonth) * 100
        )
      : attendanceThisMonth > 0
      ? 100
      : 0;

  return NextResponse.json({
    cell,
    stats: {
      totalMembers,
      presentThisSunday,
      attendanceThisMonth,
      attendancePrevMonth,
      momGrowth,
      lastSundayDate: lastSunday.toISOString().split("T")[0],
    },
    sundays: sundaysThisMonth.map((d) => d.toISOString().split("T")[0]),
    members: members.map((m) => ({
      ...m,
      attendance: attendanceMap[m.id] || {},
    })),
  });
}
