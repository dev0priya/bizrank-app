import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Master Data...");

  // Seed Categories
  const categories = ["Restaurant", "Plumber", "Electrician", "HVAC", "Roofing", "Lawyer", "Dentist", "Accountant"];
  for (const cat of categories) {
    await prisma.businessCategory.upsert({
      where: { name: cat },
      update: {},
      create: { name: cat }
    });
  }

  // Seed Country
  const usa = await prisma.country.upsert({
    where: { name: "USA" },
    update: {},
    create: { name: "USA", code: "US" }
  });

  // Seed States
  const states = ["Texas", "New York", "California", "Florida"];
  const dbStates: any = {};
  for (const st of states) {
    const s = await prisma.state.findFirst({ where: { name: st, countryId: usa.id } });
    if (!s) {
      dbStates[st] = await prisma.state.create({ data: { name: st, countryId: usa.id } });
    } else {
      dbStates[st] = s;
    }
  }

  // Seed Cities
  const cities: Record<string, string[]> = {
    "Texas": ["Austin", "Dallas", "Houston"],
    "New York": ["New York City", "Buffalo", "Albany"],
    "California": ["Los Angeles", "San Francisco", "San Diego"],
    "Florida": ["Miami", "Orlando", "Tampa"]
  };

  for (const [stateName, cityList] of Object.entries(cities)) {
    const stateId = dbStates[stateName].id;
    for (const city of cityList) {
      const c = await prisma.city.findFirst({ where: { name: city, stateId } });
      if (!c) {
        await prisma.city.create({ data: { name: city, stateId } });
      }
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
