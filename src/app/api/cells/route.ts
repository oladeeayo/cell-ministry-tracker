import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const zoneId = searchParams.get("zoneId");

  const where: any = {};
  if (zoneId) {
    where.zoneId = parseInt(zoneId);
  }

  const cells = await prisma.cell.findMany({
    where,
    include: {
      zone: { select: { id: true, zoneNumber: true } },
      cellLeader: { select: { id: true, name: true, email: true, phone: true } },
      _count: { select: { members: true } },
    },
  });

  return NextResponse.json(cells);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const cell = await prisma.cell.create({
      data: {
        name: body.name,
        zoneId: parseInt(body.zoneId),
        cellLeaderId: parseInt(body.cellLeaderId),
        cellLeaderAddress: body.cellLeaderAddress,
        cellLeaderPhone: body.cellLeaderPhone,
      },
    });
    return NextResponse.json(cell, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create cell" }, { status: 500 });
  }
}
