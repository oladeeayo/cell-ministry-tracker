const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 12);

  // Create Community Pastor
  const pastor = await prisma.user.upsert({
    where: { email: "pastor@church.org" },
    update: {},
    create: {
      email: "pastor@church.org",
      password,
      name: "Pastor John",
      phone: "+2348010000001",
      role: "COMMUNITY_PASTOR",
    },
  });

  // Create District Leader
  const districtLeader = await prisma.user.upsert({
    where: { email: "district@church.org" },
    update: {},
    create: {
      email: "district@church.org",
      password,
      name: "District Leader Mary",
      phone: "+2348010000002",
      role: "DISTRICT_LEADER",
    },
  });

  // Create Zonal Leader
  const zonalLeader = await prisma.user.upsert({
    where: { email: "zonal@church.org" },
    update: {},
    create: {
      email: "zonal@church.org",
      password,
      name: "Zonal Leader Peter",
      phone: "+2348010000003",
      role: "ZONAL_LEADER",
    },
  });

  // Create Zone
  const zone = await prisma.zone.upsert({
    where: { zoneNumber: "ZN-001" },
    update: {},
    create: {
      zoneNumber: "ZN-001",
      zonalLeaderId: zonalLeader.id,
      zonalLeaderPhone: "+2348010000003",
      zonalLeaderAddress: "123 Zone Street",
    },
  });

  // Create Cell Leader
  const cellLeader = await prisma.user.upsert({
    where: { email: "cellleader@church.org" },
    update: {},
    create: {
      email: "cellleader@church.org",
      password,
      name: "Cell Leader Sarah",
      phone: "+2348010000004",
      role: "CELL_LEADER",
    },
  });

  // Create Cell
  const cell = await prisma.cell.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Faith Cell",
      zoneId: zone.id,
      cellLeaderId: cellLeader.id,
      cellLeaderAddress: "456 Cell Avenue",
      cellLeaderPhone: "+2348010000004",
    },
  });

  // Create Asst Cell Leader
  const asstUser = await prisma.user.upsert({
    where: { email: "asst@church.org" },
    update: {},
    create: {
      email: "asst@church.org",
      password,
      name: "Asst. Leader James",
      phone: "+2348010000005",
      role: "ASST_CELL_LEADER",
    },
  });

  await prisma.cellMember.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Asst. Leader James",
      phone: "+2348010000005",
      role: "ASST_CELL_LEADER",
      cellId: cell.id,
      userId: asstUser.id,
    },
  });

  // Create E-Group Leader
  const egroupUser = await prisma.user.upsert({
    where: { email: "egroup@church.org" },
    update: {},
    create: {
      email: "egroup@church.org",
      password,
      name: "E-Group Leader Grace",
      phone: "+2348010000006",
      role: "E_GROUP_LEADER",
    },
  });

  await prisma.cellMember.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "E-Group Leader Grace",
      phone: "+2348010000006",
      role: "E_GROUP_LEADER",
      cellId: cell.id,
      userId: egroupUser.id,
    },
  });

  // Create Cell Members
  const members = ["David", "Esther", "Samuel", "Ruth", "Joseph"];
  for (let i = 0; i < members.length; i++) {
    await prisma.cellMember.upsert({
      where: { id: i + 3 },
      update: {},
      create: {
        name: members[i],
        phone: `+234801000010${i}`,
        role: "MEMBER",
        cellId: cell.id,
      },
    });
  }

  console.log("Seed data created successfully!");
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
