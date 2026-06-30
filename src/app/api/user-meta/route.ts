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
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const uid = parseInt(userId);

  // Try CellMember lookup first (ASST_CELL_LEADER, E_GROUP_LEADER)
  const cellMember = await prisma.cellMember.findUnique({
    where: { userId: uid },
    select: { cellId: true, role: true },
  });

  if (cellMember) {
    const cells = await prisma.cell.findMany({
      where: { id: cellMember.cellId },
      select: { id: true, name: true, zoneId: true },
    });
    return NextResponse.json({ cellId: cellMember.cellId, role: cellMember.role, cells });
  }

  // Try Cell lookup (CELL_LEADER links via cellLeaderId)
  const cell = await prisma.cell.findFirst({
    where: { cellLeaderId: uid },
    select: { id: true, name: true, zoneId: true },
  });

  if (cell) {
    return NextResponse.json({
      cellId: cell.id,
      role: "CELL_LEADER",
      cells: [{ id: cell.id, name: cell.name, zoneId: cell.zoneId }],
    });
  }

  return NextResponse.json({ cellId: null, role: null, cells: [] });
}
