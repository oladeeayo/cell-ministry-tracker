import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cell = await prisma.cell.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      zone: { select: { id: true, zoneNumber: true } },
      cellLeader: { select: { id: true, name: true, email: true, phone: true } },
      members: {
        orderBy: { name: "asc" },
        include: {
          _count: { select: { attendances: true } },
        },
      },
    },
  });

  if (!cell) {
    return NextResponse.json({ error: "Cell not found" }, { status: 404 });
  }

  return NextResponse.json(cell);
}
