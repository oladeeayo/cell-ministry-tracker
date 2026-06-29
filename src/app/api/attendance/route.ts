import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cellId = searchParams.get("cellId");
  const date = searchParams.get("date");

  if (!cellId || !date) {
    return NextResponse.json({ error: "cellId and date required" }, { status: 400 });
  }

  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setHours(23, 59, 59, 999);

  const records = await prisma.attendance.findMany({
    where: {
      cellId: parseInt(cellId),
      date: { gte: startDate, lte: endDate },
    },
  });

  return NextResponse.json(records);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { cellId, date, attendance } = body;
    // attendance: Array<{ cellMemberId: number; isPresent: boolean }>

    const targetDate = new Date(date);
    targetDate.setHours(12, 0, 0, 0);

    const results = [];

    for (const record of attendance) {
      const result = await prisma.attendance.upsert({
        where: {
          cellMemberId_date: {
            cellMemberId: record.cellMemberId,
            date: targetDate,
          },
        },
        update: {
          isPresent: record.isPresent,
        },
        create: {
          cellMemberId: record.cellMemberId,
          cellId: parseInt(cellId),
          date: targetDate,
          isPresent: record.isPresent,
        },
      });
      results.push(result);
    }

    return NextResponse.json({ saved: results.length }, { status: 200 });
  } catch (error) {
    console.error("Attendance save error:", error);
    return NextResponse.json({ error: "Failed to save attendance" }, { status: 500 });
  }
}
