import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runDuplicateTest() {
  console.log("Starting QA Duplicate Test Suite...\n");

  const duplicateTest = { country: "India", state: "Delhi", city: "Delhi", area: "Pitampura", category: "Dental Clinic" };
  
  // Count businesses before
  const businessesBefore = await prisma.business.count({
    where: {
      category: { name: "Dental Clinic" }
    }
  });
  
  console.log(`Businesses before duplicate run: ${businessesBefore}`);

  console.log(`Running duplicate search...`);
  
  const res = await fetch('http://localhost:3000/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(duplicateTest)
  });
  
  const data = await res.json();
  const jobId = data.jobId;
  console.log(`Duplicate Job Created! ID: ${jobId}`);

  let status = "Pending";
  while (status === "Pending" || status === "Running") {
    await new Promise(r => setTimeout(r, 5000));
    try {
      const pRes = await fetch(`http://localhost:3000/api/jobs/${jobId}`);
      const pData = await pRes.json();
      if (pData.status !== status) {
        console.log(`Job ${jobId} status changed: ${status} -> ${pData.status}`);
        status = pData.status;
      }
    } catch (e) {}
  }
  
  console.log(`Final Duplicate Job Status: ${status}`);

  // Count businesses after
  const businessesAfter = await prisma.business.count({
    where: {
      category: { name: "Dental Clinic" }
    }
  });
  
  console.log(`Businesses after duplicate run: ${businessesAfter}`);
  
  if (businessesBefore === businessesAfter) {
    console.log("SUCCESS: No duplicates inserted.");
  } else {
    console.log("FAIL: Duplicates were inserted!");
  }
}

runDuplicateTest().catch(console.error).finally(async () => await prisma.$disconnect());
