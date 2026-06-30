import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: parseInt((session.user as any).id) },
    select: { id: true, name: true, email: true, phone: true, address: true, role: true },
  });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data: any = {};
    if (body.name) data.name = body.name;
    if (body.phone) data.phone = body.phone;
    if (body.address !== undefined) data.address = body.address;
    if (body.currentPassword && body.newPassword) {
      const user = await prisma.user.findUnique({ where: { id: parseInt((session.user as any).id) } });
      if (!user || !(await bcrypt.compare(body.currentPassword, user.password))) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
      data.password = await bcrypt.hash(body.newPassword, 12);
    }

    const updated = await prisma.user.update({
      where: { id: parseInt((session.user as any).id) },
      data,
      select: { id: true, name: true, email: true, phone: true, address: true, role: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
