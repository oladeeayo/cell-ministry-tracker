const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Check if already seeded
  const existingPastor = await prisma.user.findUnique({
    where: { email: "pastor@church.org" },
  });
  if (existingPastor) {
    console.log("Database already seeded. Skipping.");
    return;
  }

  const password = await bcrypt.hash("password123", 12);

  // Create users first
  const pastor = await prisma.user.create({
    data: {
      email: "pastor@church.org",
      password,
      name: "Pastor John",
      phone: "+2348010000001",
      role: "COMMUNITY_PASTOR",
    },
  });

  const districtLeader = await prisma.user.create({
    data: {
      email: "district@church.org",
      password,
      name: "District Leader Mary",
      phone: "+2348010000002",
      role: "DISTRICT_LEADER",
    },
  });

  const zonalLeader = await prisma.user.create({
    data: {
      email: "zonal@church.org",
      password,
      name: "Zonal Leader Peter",
      phone: "+2348010000003",
      role: "ZONAL_LEADER",
    },
  });

  const cellLeader = await prisma.user.create({
    data: {
      email: "cellleader@church.org",
      password,
      name: "Cell Leader Sarah",
      phone: "+2348010000004",
      role: "CELL_LEADER",
    },
  });

  const asstUser = await prisma.user.create({
    data: {
      email: "asst@church.org",
      password,
      name: "Asst. Leader James",
      phone: "+2348010000005",
      role: "ASST_CELL_LEADER",
    },
  });

  const egroupUser = await prisma.user.create({
    data: {
      email: "egroup@church.org",
      password,
      name: "E-Group Leader Grace",
      phone: "+2348010000006",
      role: "E_GROUP_LEADER",
    },
  });

  // Create zone
  const zone = await prisma.zone.create({
    data: {
      zoneNumber: "ZN-001",
      zonalLeaderId: zonalLeader.id,
      zonalLeaderPhone: "+2348010000003",
      zonalLeaderAddress: "123 Zone Street",
    },
  });

  // Create cell
  const cell = await prisma.cell.create({
    data: {
      name: "Faith Cell",
      zoneId: zone.id,
      cellLeaderId: cellLeader.id,
      cellLeaderAddress: "456 Cell Avenue",
      cellLeaderPhone: "+2348010000004",
    },
  });

  // Add cell members
  await prisma.cellMember.create({
    data: {
      name: "Asst. Leader James",
      phone: "+2348010000005",
      role: "ASST_CELL_LEADER",
      cellId: cell.id,
      userId: asstUser.id,
    },
  });

  await prisma.cellMember.create({
    data: {
      name: "E-Group Leader Grace",
      phone: "+2348010000006",
      role: "E_GROUP_LEADER",
      cellId: cell.id,
      userId: egroupUser.id,
    },
  });

  const memberNames = ["David", "Esther", "Samuel", "Ruth", "Joseph"];
  for (const name of memberNames) {
    await prisma.cellMember.create({
      data: {
        name,
        phone: `+234801000010${memberNames.indexOf(name)}`,
        role: "MEMBER",
        cellId: cell.id,
      },
    });
  }

  console.log("Seed data created successfully!");
  console.log("");
  console.log("Login credentials (all use password: password123):");
  console.log("  Community Pastor: pastor@church.org");
  console.log("  District Leader:  district@church.org");
  console.log("  Zonal Leader:     zonal@church.org");
  console.log("  Cell Leader:      cellleader@church.org");
  console.log("  Asst. Leader:     asst@church.org");
  console.log("  E-Group Leader:   egroup@church.org");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
