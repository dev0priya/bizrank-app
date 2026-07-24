import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const tests = [
  { id: 1, country: "India", state: "Delhi", city: "Delhi", area: "Pitampura", category: "Dental Clinic" },
  { id: 2, country: "India", state: "Delhi", city: "Delhi", area: "Rohini", category: "Salon" },
  { id: 3, country: "India", state: "Maharashtra", city: "Mumbai", area: "Andheri", category: "Gym" },
  { id: 4, country: "USA", state: "Texas", city: "Austin", area: "Downtown", category: "Plumber" },
  { id: 5, country: "United Kingdom", state: "England", city: "London", area: "Camden", category: "Restaurant" }
];

async function pollJob(jobId: string) {
  let status = "Pending";
  console.log(`Polling job ${jobId}...`);
  while (status === "Pending" || status === "Running") {
    await new Promise(r => setTimeout(r, 5000));
    try {
      const res = await fetch(`http://localhost:3000/api/jobs/${jobId}`);
      const data = await res.json();
      if (data.status !== status) {
        console.log(`Job ${jobId} status changed: ${status} -> ${data.status}`);
        status = data.status;
      }
    } catch (e: any) {
      console.error(`Error polling job ${jobId}: ${e.message}`);
    }
  }
  return status;
}

async function runTests() {
  console.log("Starting QA Test Suite...\n");

  for (const t of tests) {
    console.log(`==========================================`);
    console.log(`RUNNING TEST ${t.id}: ${t.country}, ${t.state}, ${t.city}, ${t.area}, ${t.category}`);
    console.log(`==========================================`);

    try {
      const res = await fetch('http://localhost:3000/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: t.country,
          state: t.state,
          city: t.city,
          area: t.area,
          category: t.category
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        console.error(`Failed to create job:`, data);
        continue;
      }

      const jobId = data.jobId;
      console.log(`Job Created! ID: ${jobId}`);

      const finalStatus = await pollJob(jobId);
      console.log(`Final Job Status: ${finalStatus}`);

      // Phase 6 & 8 Verification - Check Database
      const job = await prisma.collectionJob.findUnique({
        where: { id: jobId },
        include: {
          businesses: true
        }
      });

      console.log(`\nBusinesses collected for Test ${t.id}: ${job?.businesses.length || 0}`);
      if (job?.businesses.length) {
        const sample = job.businesses[0];
        console.log(`Sample Audit Metrics for '${sample.name}':`);
        console.log(`- Website Exists: ${sample.audit_website_exists}`);
        console.log(`- HTTPS: ${sample.audit_has_https}`);
        console.log(`- SEO Score: ${sample.audit_seo_score}`);
        console.log(`- UX Score: ${sample.audit_ux_score}`);
        console.log(`- Performance Score: ${sample.audit_speed_score}`);
        console.log(`- AI Score: ${sample.ai_score}`);
        console.log(`- Opportunity Score: ${sample.opportunity_score}`);
      }
      
    } catch (e: any) {
      console.error(`Test ${t.id} failed with error:`, e.message);
    }
    console.log("\n");
  }
}

runTests().catch(e => console.error(e)).finally(async () => await prisma.$disconnect());
