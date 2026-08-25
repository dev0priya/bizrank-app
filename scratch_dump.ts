import { prisma } from './lib/prisma';

async function main() {
  const leads = await prisma.cRMLead.findMany({
    include: {
      business: true,
      developer: true,
      swati: true,
      activities: true,
      followUps: true
    }
  });

  console.log(JSON.stringify(leads, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
