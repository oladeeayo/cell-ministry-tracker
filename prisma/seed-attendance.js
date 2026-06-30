const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const cell = await prisma.cell.findFirst();
  if (!cell) {
    console.log("No cell found. Run seed.js first.");
    return;
  }

  const members = await prisma.cellMember.findMany({ where: { cellId: cell.id } });
  if (members.length === 0) {
    console.log("No members found.");
    return;
  }

  const now = new Date();
  const sundays = [];
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0) {
      const nextWeek = new Date(d);
      nextWeek.setDate(d.getDate() + 7);
      if (nextWeek.getMonth() !== d.getMonth()) continue;
      sundays.push(new Date(d));
    }
  }

  let count = 0;
  for (const sunday of sundays) {
    for (const member of members) {
      const isPresent = Math.random() < 0.7;
      try {
        await prisma.attendance.create({
          data: {
            cellMemberId: member.id,
            cellId: cell.id,
            date: sunday,
            isPresent,
          },
        });
        count++;
      } catch (e) {
        // skip duplicates
      }
    }
  }

  const total = await prisma.attendance.count();
  console.log(`Added ${count} attendance records across ${sundays.length} Sundays`);
  console.log(`Total attendance records now: ${total}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
