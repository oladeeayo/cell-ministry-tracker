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

  const cellMember = await prisma.cellMember.findUnique({
    where: { userId: parseInt(userId) },
    select: { cellId: true, role: true },
  });

  if (!cellMember) {
    return NextResponse.json({ cellId: null, role: null });
  }

  return NextResponse.json({ cellId: cellMember.cellId, role: cellMember.role });
}
