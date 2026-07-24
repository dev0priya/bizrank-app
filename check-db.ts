import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const job = await prisma.collectionJob.findUnique({ where: { id: 8 }});
  console.log('Job:', job);
  const bizCount = await prisma.business.count({ where: { job_id: 8 }});
  console.log('Inserted Biz Count:', bizCount);
  await prisma.$disconnect();
}
run();
