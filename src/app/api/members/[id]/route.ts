import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canEdit } from "@/lib/hierarchy";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = (session.user as any).role;
  const userId = parseInt((session.user as any).id);
  const memberId = parseInt(params.id);

  const member = await prisma.cellMember.findUnique({
    where: { id: memberId },
    include: { cell: { select: { zoneId: true, cellLeaderId: true } } },
  });

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  // Permission check
  if (userRole === "COMMUNITY_PASTOR" || userRole === "DISTRICT_LEADER") {
    // Full access
  } else if (userRole === "ZONAL_LEADER") {
    const zone = await prisma.zone.findUnique({ where: { zonalLeaderId: userId } });
    if (!zone || zone.id !== member.cell.zoneId) {
      return NextResponse.json({ error: "Not authorized for this zone" }, { status: 403 });
    }
  } else if (userRole === "CELL_LEADER") {
    const cell = await prisma.cell.findUnique({ where: { cellLeaderId: userId } });
    if (!cell || cell.id !== member.cellId) {
      return NextResponse.json({ error: "Not authorized for this cell" }, { status: 403 });
    }
  } else if (userRole === "ASST_CELL_LEADER") {
    const cellMember = await prisma.cellMember.findUnique({ where: { userId } });
    if (!cellMember || cellMember.cellId !== member.cellId) {
      return NextResponse.json({ error: "Not authorized for this cell" }, { status: 403 });
    }
    if (!canEdit(userRole, member.role)) {
      return NextResponse.json({ error: "Cannot edit members with equal or higher role" }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: "Not authorized to edit members" }, { status: 403 });
  }

  // Check hierarchy
  if (!canEdit(userRole, member.role) && userRole !== "COMMUNITY_PASTOR" && userRole !== "DISTRICT_LEADER") {
    return NextResponse.json({ error: "Cannot edit members with equal or higher role" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const updated = await prisma.cellMember.update({
      where: { id: memberId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.role !== undefined && { role: body.role }),
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = (session.user as any).role;
  const userId = parseInt((session.user as any).id);
  const memberId = parseInt(params.id);

  const member = await prisma.cellMember.findUnique({
    where: { id: memberId },
    include: { cell: { select: { zoneId: true, cellLeaderId: true } } },
  });

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (userRole === "COMMUNITY_PASTOR" || userRole === "DISTRICT_LEADER") {
    // Full access
  } else if (userRole === "ZONAL_LEADER") {
    const zone = await prisma.zone.findUnique({ where: { zonalLeaderId: userId } });
    if (!zone || zone.id !== member.cell.zoneId)
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  } else if (userRole === "CELL_LEADER") {
    const cell = await prisma.cell.findUnique({ where: { cellLeaderId: userId } });
    if (!cell || cell.id !== member.cellId)
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  } else {
    return NextResponse.json({ error: "Not authorized to delete members" }, { status: 403 });
  }

  if (!canEdit(userRole, member.role) && userRole !== "COMMUNITY_PASTOR" && userRole !== "DISTRICT_LEADER") {
    return NextResponse.json({ error: "Cannot delete members with equal or higher role" }, { status: 403 });
  }

  await prisma.attendance.deleteMany({ where: { cellMemberId: memberId } });
  await prisma.cellMember.delete({ where: { id: memberId } });

  return NextResponse.json({ message: "Member deleted" });
}
