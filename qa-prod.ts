import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runProdQA() {
  console.log("Starting Production QA on Vercel...");
  const PROD_URL = "https://bizrank-app.vercel.app";
  
  const payload = {
      country: "India",
      state: "Delhi",
      city: "Delhi",
      area: "Pitampura",
      category: "Dental Clinic",
      maxResults: 5
  };

  console.log(`Sending job request to ${PROD_URL}/api/jobs`);
  const res = await fetch(`${PROD_URL}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
  });

  if (!res.ok) {
      console.log("Failed to create job on Prod:", await res.text());
      return;
  }

  const data = await res.json();
  const jobId = data.jobId;
  console.log(`Job Created on Prod! ID: ${jobId}`);

  let status = "Pending";
  let lastData = null;

  while (status === "Pending" || status === "Running") {
      await new Promise(r => setTimeout(r, 5000));
      try {
          const pRes = await fetch(`${PROD_URL}/api/jobs/${jobId}`);
          const pData = await pRes.json();
          lastData = pData;
          if (pData.status !== status) {
              console.log(`Prod Job ${jobId} status changed: ${status} -> ${pData.status}`);
              status = pData.status;
          }
      } catch (e: any) {
          console.log("Polling error:", e.message);
      }
  }

  console.log(`Final Prod Job Status: ${status}`);

  if (status === "Completed") {
      console.log("✓ Production Workflow Passed!");
      
      // Let's verify DB directly
      const job = await prisma.collectionJob.findUnique({ where: { id: jobId } });
      if (job) {
          console.log(`\n--- DB Verification ---`);
          console.log(`Businesses Fetched: ${job.businessesFetched}`);
          console.log(`Businesses Inserted: ${job.businessesInserted}`);
          console.log(`Businesses Skipped (Duplicates): ${job.businessesFetched - job.businessesInserted}`);
      }
  } else {
      console.log("✗ Production Workflow Failed!");
      if (lastData && lastData.error) {
          console.log(`Error returned: ${lastData.error}`);
      }
  }
}

runProdQA()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
