const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const FIRST_NAMES = [
  "David", "Esther", "Samuel", "Ruth", "Joseph", "Mary", "Peter", "Grace",
  "Daniel", "Sarah", "Paul", "Hannah", "James", "Deborah", "John", "Martha",
  "Michael", "Naomi", "Andrew", "Lydia", "Philip", "Miriam", "Thomas", "Priscilla",
  "Simon", "Eunice", "Matthew", "Dorcas", "Luke", "Tabitha", "Stephen", "Abigail",
  "Timothy", "Leah", "Barnabas", "Rebecca", "Silas", "Bathsheba", "Mark", "Rahab",
  "Joshua", "Anna", "Caleb", "Jael", "Eli", "Rachel", "Aaron", "Bethany",
  "Noah", "Hadassah", "Isaac", "Susanna", "Jacob", "Elizabeth", "Benjamin", "Zipporah",
  "Ezekiel", "Sharon", "Jeremiah", "Jezebel", "Joel", "Salome", "Amos", "Hagar",
  "Obadiah", "Megan", "Jonah", "Eve", "Micah", "Sarah", "Nahum", "Ruth",
  "Habakkuk", "Tamar", "Zephaniah", "Berenice", "Haggai", "Jochebed", "Malachi", "Keturah",
  "Asher", "Keziah", "Gideon", "Mahlah", "Samson", "Hepzibah", "Boaz", "Shelomith",
  "Jesse", "Eglah", "Saul", "Basemath", "Jonathan", "Adah", "Solomon", "Tirzah",
];

const SURNAMES = [
  "Okafor", "Adebayo", "Chukwu", "Okonkwo", "Eze", "Nwachukwu", "Ikeji",
  "Ogundipe", "Akinlade", "Balogun", "Ogunleye", "Akindele", "Bamidele",
  "Olayinka", "Olatunji", "Oluwaseun", "Adebisi", "Ogunbiyi", "Aderogba",
  "Ogunlade", "Adeyemi", "Ogunwale", "Adekunle", "Ogunbayo", "Adepoju",
  "Ogunlana", "Adebayo", "Ogunbiyi", "Adedayo", "Ogunjimi", "Adedokun",
  "Ogunlola", "Adebisi", "Ogunyemi", "Adedoyin", "Ogunsanya", "Adedokun",
  "Ogunlana", "Adesanya", "Ogunyemi", "Adetola", "Ogunlade", "Adesina",
];

function randomName() {
  return FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)] + " " + SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
}

function randomPhone(idx) {
  return `+234801${String(1000000 + idx).slice(0, 7)}`;
}

function getSundays(startMonth, numMonths) {
  const sundays = [];
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - startMonth, 1);

  for (let m = 0; m < numMonths; m++) {
    const year = start.getFullYear();
    const month = start.getMonth() + m;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === 0) {
        const nextWeek = new Date(d);
        nextWeek.setDate(d.getDate() + 7);
        if (nextWeek.getMonth() !== d.getMonth()) continue;
        sundays.push(new Date(d));
      }
    }
  }
  return sundays;
}

async function main() {
  console.log("Clearing existing data...");
  await prisma.attendance.deleteMany();
  await prisma.cellMember.deleteMany();
  await prisma.cell.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("password123", 12);

  // Create pastor & district leader
  await prisma.user.create({ data: { email: "pastor@church.org", password, name: "Pastor John", phone: "+2348010000001", role: "COMMUNITY_PASTOR" } });
  await prisma.user.create({ data: { email: "district@church.org", password, name: "District Leader Mary", phone: "+2348010000002", role: "DISTRICT_LEADER" } });

  const allSundays = getSundays(2, 3);
  console.log(`Generating ${allSundays.length} Sundays of attendance data`);

  const zoneNames = [
    "Jericho", "Bethel", "Shiloh", "Gilgal", "Hebron",
    "Carmel", "Eden", "Zion", "Nazareth", "Bethlehem",
  ];

  let userAccountIdx = 2;
  let memberIdx = 0;

  for (let z = 0; z < 10; z++) {
    const zonalEmail = `zonal${z + 1}@church.org`;
    const zonalUser = await prisma.user.create({ data: { email: zonalEmail, password, name: `Zonal Leader ${zoneNames[z]}`, phone: randomPhone(userAccountIdx++), role: "ZONAL_LEADER" } });

    const zone = await prisma.zone.create({
      data: { zoneNumber: `ZN-${String(z + 1).padStart(3, "0")}`, zonalLeaderId: zonalUser.id, zonalLeaderPhone: zonalUser.phone, zonalLeaderAddress: `${100 + z} Zone Road, ${zoneNames[z]} District` },
    });

    for (let c = 0; c < 4; c++) {
      const cellName = `Cell ${String(z + 1).padStart(2, "0")}-${String(c + 1).padStart(2, "0")}`;
      const cellUser = await prisma.user.create({ data: { email: `cell${z + 1}_${c + 1}@church.org`, password, name: `Leader ${cellName}`, phone: randomPhone(userAccountIdx++), role: "CELL_LEADER" } });

      const cell = await prisma.cell.create({
        data: { name: cellName, zoneId: zone.id, cellLeaderId: cellUser.id, cellLeaderAddress: `${500 + c} Cell Avenue, ${zoneNames[z]}`, cellLeaderPhone: cellUser.phone },
      });

      const asstUser = await prisma.user.create({ data: { email: `asst${z + 1}_${c + 1}@church.org`, password, name: `Asst. ${cellName}`, phone: randomPhone(userAccountIdx++), role: "ASST_CELL_LEADER" } });
      await prisma.cellMember.create({ data: { name: asstUser.name, phone: asstUser.phone, role: "ASST_CELL_LEADER", cellId: cell.id, userId: asstUser.id } });

      const egroupUser = await prisma.user.create({ data: { email: `egroup${z + 1}_${c + 1}@church.org`, password, name: `E-Group ${cellName}`, phone: randomPhone(userAccountIdx++), role: "E_GROUP_LEADER" } });
      await prisma.cellMember.create({ data: { name: egroupUser.name, phone: egroupUser.phone, role: "E_GROUP_LEADER", cellId: cell.id, userId: egroupUser.id } });

      // Create members in bulk
      const memberCount = 13 + Math.floor(Math.random() * 5);
      const memberData = [];
      for (let m = 0; m < memberCount; m++) {
        memberData.push({ name: randomName(), phone: randomPhone(10000 + memberIdx++), role: "MEMBER", cellId: cell.id });
      }
      await prisma.cellMember.createMany({ data: memberData });

      // Re-read members with IDs for attendance
      const members = await prisma.cellMember.findMany({ where: { cellId: cell.id } });

      // Create attendance in bulk
      const attendanceData = [];
      for (const sunday of allSundays) {
        if (Math.random() < 0.2) continue;
        for (const member of members) {
          attendanceData.push({ cellMemberId: member.id, cellId: cell.id, date: sunday, isPresent: Math.random() < 0.7 });
        }
      }

      if (attendanceData.length > 0) {
        // Batch in chunks of 1000
        for (let i = 0; i < attendanceData.length; i += 1000) {
          await prisma.attendance.createMany({ data: attendanceData.slice(i, i + 1000) });
        }
      }
    }
  }

  const total = await prisma.attendance.count();
  const cells = await prisma.cell.count();
  const zones = await prisma.zone.count();
  const members = await prisma.cellMember.count();
  const users = await prisma.user.count();

  console.log("================================");
  console.log("Seed complete!");
  console.log(`Zones: ${zones}, Cells: ${cells}, Members: ${members}, Users: ${users}, Attendance: ${total}`);
  console.log("================================");
  console.log("Login credentials (password: password123):");
  console.log("  Community Pastor: pastor@church.org");
  console.log("  District Leader:  district@church.org");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
