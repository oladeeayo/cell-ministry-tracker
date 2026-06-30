import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberId = parseInt(params.id);

  const member = await prisma.cellMember.findUnique({ where: { id: memberId } });
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const records = await prisma.attendance.findMany({
    where: { cellMemberId: memberId },
    orderBy: { date: "desc" },
  });

  const attendanceByMonth: Record<string, { present: number; absent: number; total: number }> = {};
  for (const r of records) {
    const key = r.date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!attendanceByMonth[key]) attendanceByMonth[key] = { present: 0, absent: 0, total: 0 };
    attendanceByMonth[key].total++;
    if (r.isPresent) attendanceByMonth[key].present++;
    else attendanceByMonth[key].absent++;
  }

  return NextResponse.json({
    member: { id: member.id, name: member.name, phone: member.phone, role: member.role },
    records: records.map((r) => ({ date: r.date.toISOString().split("T")[0], isPresent: r.isPresent, note: r.note })),
    attendanceByMonth,
    totalPresent: records.filter((r) => r.isPresent).length,
    totalAbsent: records.filter((r) => !r.isPresent).length,
    overallRate: records.length > 0 ? Math.round((records.filter((r) => r.isPresent).length / records.length) * 100) : 0,
  });
}
