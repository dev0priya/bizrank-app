import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.business.findMany({ take: 5, orderBy: { id: 'desc' }, include: { category: true } }).then(b => { 
  console.log(JSON.stringify(b, null, 2)); 
  prisma.$disconnect(); 
});
