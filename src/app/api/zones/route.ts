import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const zones = await prisma.zone.findMany({
    include: {
      zonalLeader: { select: { id: true, name: true, email: true, phone: true } },
      cells: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
  });

  return NextResponse.json(zones);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["COMMUNITY_PASTOR", "DISTRICT_LEADER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const zone = await prisma.zone.create({
      data: {
        zoneNumber: body.zoneNumber,
        zonalLeaderId: parseInt(body.zonalLeaderId),
        zonalLeaderPhone: body.zonalLeaderPhone,
        zonalLeaderAddress: body.zonalLeaderAddress,
      },
    });
    return NextResponse.json(zone, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create zone" }, { status: 500 });
  }
}
