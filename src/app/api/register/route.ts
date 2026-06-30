import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, phone, address, role, zoneData, cellData } = body;

    if (!name || !phone || !role) {
      return NextResponse.json(
        { error: "Name, phone, and role are required" },
        { status: 400 }
      );
    }

    const targetCellId = cellData?.cellId || body.cellId;

    // MEMBER role: just create a CellMember, no user account
    if (role === "MEMBER") {
      if (!targetCellId) {
        return NextResponse.json(
          { error: "Cell selection is required" },
          { status: 400 }
        );
      }
      await prisma.cellMember.create({
        data: {
          name,
          phone,
          address: address || null,
          role: "MEMBER",
          cellId: parseInt(targetCellId),
          isVisitor: body.isVisitor || false,
          firstVisitDate: body.isVisitor ? new Date() : undefined,
        },
      });
      return NextResponse.json(
        { message: "Member registered successfully" },
        { status: 201 }
      );
    }

    // All other roles require email + password
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required for this role" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        address: address || null,
        role,
      },
    });

    if (role === "ZONAL_LEADER" && zoneData) {
      await prisma.zone.create({
        data: {
          zoneNumber: zoneData.zoneNumber,
          zonalLeaderId: user.id,
          zonalLeaderPhone: zoneData.zonalLeaderPhone || phone,
          zonalLeaderAddress: zoneData.zonalLeaderAddress || address || "",
        },
      });
    }

    if (role === "CELL_LEADER" && cellData) {
      await prisma.cell.create({
        data: {
          name: cellData.name,
          zoneId: parseInt(cellData.zoneId),
          cellLeaderId: user.id,
          cellLeaderAddress: cellData.cellLeaderAddress || address || "",
          cellLeaderPhone: cellData.cellLeaderPhone || phone,
        },
      });
    }

    if (["ASST_CELL_LEADER", "E_GROUP_LEADER"].includes(role) && targetCellId) {
      await prisma.cellMember.create({
        data: {
          name,
          phone,
          address: address || null,
          role,
          cellId: parseInt(targetCellId),
          userId: user.id,
        },
      });
    }

    return NextResponse.json(
      { message: "Registration successful", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
