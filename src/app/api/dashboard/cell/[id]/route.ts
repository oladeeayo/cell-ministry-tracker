import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function getLastSunday(): Date {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 0 : day));
  d.setHours(12, 0, 0, 0);
  return d;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cellId = parseInt(params.id);
  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const rangeStart = fromParam ? new Date(fromParam) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const rangeEnd = toParam ? new Date(toParam + "T23:59:59") : new Date();

  const cell = await prisma.cell.findUnique({
    where: { id: cellId },
    include: { zone: { select: { id: true, zoneNumber: true } }, cellLeader: { select: { id: true, name: true } } },
  });
  if (!cell) return NextResponse.json({ error: "Cell not found" }, { status: 404 });

  const lastSunday = getLastSunday();

  // Stats within range
  const totalMembers = await prisma.cellMember.count({ where: { cellId } });
  const presentThisSunday = await prisma.attendance.count({ where: { cellId, date: lastSunday, isPresent: true } });

  // Attendance within range
  const attendanceRecords = await prisma.attendance.findMany({
    where: { cellId, date: { gte: rangeStart, lte: rangeEnd } },
    orderBy: { date: "asc" },
  });

  const attendanceThisMonth = attendanceRecords.filter((a) => a.isPresent).length;

  // Month-over-month
  const prevMonthStart = new Date(rangeStart.getFullYear(), rangeStart.getMonth() - 1, 1);
  const prevMonthEnd = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 0, 23, 59, 59, 999);
  const attendancePrevMonth = await prisma.attendance.count({
    where: { cellId, date: { gte: prevMonthStart, lte: prevMonthEnd }, isPresent: true },
  });

  const momGrowth = attendancePrevMonth > 0
    ? Math.round(((attendanceThisMonth - attendancePrevMonth) / attendancePrevMonth) * 100)
    : attendanceThisMonth > 0 ? 100 : 0;

  // Sundays in range (skip last Sunday of month)
  const sundays: Date[] = [];
  const d = new Date(rangeStart);
  while (d <= rangeEnd) {
    if (d.getDay() === 0) {
      const nextWeek = new Date(d);
      nextWeek.setDate(d.getDate() + 7);
      if (nextWeek.getMonth() === d.getMonth() || d.getMonth() !== rangeEnd.getMonth()) {
        sundays.push(new Date(d));
      }
    }
    d.setDate(d.getDate() + 1);
  }

  // Filter out last Sunday of each month properly
  const filteredSundays = sundays.filter((s) => {
    const nw = new Date(s);
    nw.setDate(s.getDate() + 7);
    return nw.getMonth() === s.getMonth();
  });

  // Members with attendance data
  const members = await prisma.cellMember.findMany({
    where: { cellId },
    orderBy: { name: "asc" },
  });

  const attendanceMap: Record<number, Record<string, { present: boolean; note?: string }>> = {};
  for (const r of attendanceRecords) {
    const dateStr = r.date.toISOString().split("T")[0];
    if (!attendanceMap[r.cellMemberId]) attendanceMap[r.cellMemberId] = {};
    attendanceMap[r.cellMemberId][dateStr] = { present: r.isPresent, note: r.note || undefined };
  }

  // Consecutive absences
  const sortedSundays = filteredSundays.map((s) => s.toISOString().split("T")[0]).sort();
  const membersWithStats = members.map((m) => {
    const att = attendanceMap[m.id] || {};
    let consecutiveAbsences = 0;
    for (let i = sortedSundays.length - 1; i >= 0; i--) {
      const s = sortedSundays[i];
      if (att[s] && att[s].present) break;
      consecutiveAbsences++;
    }

    const totalSundays = sortedSundays.length;
    const attended = sortedSundays.filter((s) => att[s]?.present).length;
    const attendanceRate = totalSundays > 0 ? Math.round((attended / totalSundays) * 100) : 0;

    return {
      ...m,
      attendance: att,
      attendanceRate,
      consecutiveAbsences,
    };
  });

  return NextResponse.json({
    cell,
    stats: { totalMembers, presentThisSunday, attendanceThisMonth, momGrowth, lastSundayDate: lastSunday.toISOString().split("T")[0] },
    sundays: filteredSundays.map((s) => s.toISOString().split("T")[0]),
    members: membersWithStats,
    range: { from: rangeStart.toISOString().split("T")[0], to: rangeEnd.toISOString().split("T")[0] },
  });
}
