import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding QA Data...");

  // Helper function for findOrCreate
  async function findOrCreate(model: any, where: any, create: any) {
    const existing = await model.findFirst({ where });
    if (existing) return existing;
    return await model.create({ data: create });
  }

  // Countries
  const india = await findOrCreate(prisma.country, { name: "India" }, { name: "India", code: "IN" });
  const uk = await findOrCreate(prisma.country, { name: "United Kingdom" }, { name: "United Kingdom", code: "UK" });
  const usa = await prisma.country.findFirst({ where: { name: "USA" }});

  // States
  const delhiState = await findOrCreate(prisma.state, { name: "Delhi", countryId: india.id }, { name: "Delhi", countryId: india.id });
  const maha = await findOrCreate(prisma.state, { name: "Maharashtra", countryId: india.id }, { name: "Maharashtra", countryId: india.id });
  const england = await findOrCreate(prisma.state, { name: "England", countryId: uk.id }, { name: "England", countryId: uk.id });
  const texas = await prisma.state.findFirst({ where: { name: "Texas" }});

  // Cities
  const delhiCity = await findOrCreate(prisma.city, { name: "Delhi", stateId: delhiState.id }, { name: "Delhi", stateId: delhiState.id });
  const mumbai = await findOrCreate(prisma.city, { name: "Mumbai", stateId: maha.id }, { name: "Mumbai", stateId: maha.id });
  const london = await findOrCreate(prisma.city, { name: "London", stateId: england.id }, { name: "London", stateId: england.id });
  const austin = await prisma.city.findFirst({ where: { name: "Austin" }});

  // Areas
  await findOrCreate(prisma.area, { name: "Pitampura", cityId: delhiCity.id }, { name: "Pitampura", cityId: delhiCity.id });
  await findOrCreate(prisma.area, { name: "Rohini", cityId: delhiCity.id }, { name: "Rohini", cityId: delhiCity.id });
  await findOrCreate(prisma.area, { name: "Andheri", cityId: mumbai.id }, { name: "Andheri", cityId: mumbai.id });
  await findOrCreate(prisma.area, { name: "Camden", cityId: london.id }, { name: "Camden", cityId: london.id });
  if (austin) {
    await findOrCreate(prisma.area, { name: "Downtown", cityId: austin.id }, { name: "Downtown", cityId: austin.id });
  }

  // Categories
  const categories = ["Dental Clinic", "Salon", "Gym", "Plumber", "Restaurant"];
  for (const cat of categories) {
    await findOrCreate(prisma.businessCategory, { name: cat }, { name: cat });
  }

  console.log("QA Seed Complete!");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
