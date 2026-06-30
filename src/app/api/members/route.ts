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
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "50"), 200);

  if (!cellId) {
    return NextResponse.json({ error: "cellId required" }, { status: 400 });
  }

  const where: any = { cellId: parseInt(cellId) };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }

  const [members, total] = await Promise.all([
    prisma.cellMember.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cellMember.count({ where }),
  ]);

  return NextResponse.json({ members, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Bulk import
    if (Array.isArray(body)) {
      const created = [];
      for (const item of body) {
        const member = await prisma.cellMember.create({
          data: {
            name: item.name,
            phone: item.phone,
            address: item.address || null,
            role: item.role || "MEMBER",
            cellId: parseInt(item.cellId),
            isVisitor: item.isVisitor || false,
            firstVisitDate: item.firstVisitDate ? new Date(item.firstVisitDate) : null,
          },
        });
        created.push(member);
      }
      return NextResponse.json({ created: created.length }, { status: 201 });
    }

    // Single create
    const member = await prisma.cellMember.create({
      data: {
        name: body.name,
        phone: body.phone,
        address: body.address || null,
        role: body.role || "MEMBER",
        cellId: parseInt(body.cellId),
        isVisitor: body.isVisitor || false,
        firstVisitDate: body.firstVisitDate ? new Date(body.firstVisitDate) : null,
      },
    });
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}
