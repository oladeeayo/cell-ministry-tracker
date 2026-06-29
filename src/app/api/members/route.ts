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

  if (!cellId) {
    return NextResponse.json({ error: "cellId required" }, { status: 400 });
  }

  const members = await prisma.cellMember.findMany({
    where: { cellId: parseInt(cellId) },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(members);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const member = await prisma.cellMember.create({
      data: {
        name: body.name,
        phone: body.phone,
        address: body.address || null,
        role: body.role || "MEMBER",
        cellId: parseInt(body.cellId),
      },
    });
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}
