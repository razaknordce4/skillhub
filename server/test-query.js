const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const students = await prisma.user.findMany({ where: { role: 'STUDENT' }, include: { studentBatches: true } });
  console.log("Students:", JSON.stringify(students, null, 2));

  const batchStudents = await prisma.batchStudent.findMany();
  console.log("BatchStudents:", JSON.stringify(batchStudents, null, 2));
}

main().finally(() => prisma.$disconnect());
