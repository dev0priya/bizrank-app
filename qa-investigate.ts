import { GoogleMapsScraper } from './src/scraper';
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

async function main() {
    console.log("=== APIFY PAYLOAD VERIFICATION ===");
    const payload = {
        country: "India",
        state: "Delhi",
        city: "Delhi",
        area: "Janakpuri",
        category: "Restaurant",
        maxResults: 10
    };
    console.log("Payload Sent to Apify:", JSON.stringify(payload, null, 2));
    
    // Simulate what route.ts does:
    const searchParts: string[] = [];
    if (payload.category) searchParts.push(payload.category);
    if (payload.area) searchParts.push(payload.area);
    if (payload.city) searchParts.push(payload.city);
    if (payload.state) searchParts.push(payload.state);
    if (payload.country) searchParts.push(payload.country);
    
    console.log("Constructed Search Query:", searchParts.join(", "));

    console.log("\n=== EXECUTING APIFY ACTOR ===");
    const scraper = new GoogleMapsScraper();
    
    const run = await scraper.startSearch(payload);
    console.log(`Job Created! Apify Run ID: ${run.id}`);

    let status = run.status;
    while (status !== 'SUCCEEDED' && status !== 'FAILED') {
        await new Promise(resolve => setTimeout(resolve, 5000));
        const currentRun = await scraper.checkRunStatus(run.id);
        if (currentRun.status !== status) {
            console.log(`Apify Job Status: ${status} -> ${currentRun.status}`);
            status = currentRun.status;
        }
    }

    if (status === 'SUCCEEDED') {
        console.log("\n=== APIFY RAW RESULTS (First 10) ===");
        const items = await scraper.getDatasetItems(run.defaultDatasetId);
        console.log(`Total items fetched: ${items.length}`);
        
        items.slice(0, 10).forEach((item: any, idx) => {
            console.log(`${idx + 1}. [${item.title || item.name}] - ${item.address || item.formattedAddress} (URL: ${item.url})`);
        });

        // We also want to see what is inserted into DB by our background worker
        // The worker runs independently via Vercel / server, but we are running this locally!
        // Actually, our API route creates the job, and the worker fetches it.
        // Wait, the API route just starts the job on Apify, then NEXT.js API route returns. 
        // Then `app/api/jobs/[jobId]/route.ts` polls Apify on the frontend request and inserts into the database when it completes!
        // Let's verify `app/api/jobs/[jobId]/route.ts`.
    }

    await prisma.$disconnect();
}

main().catch(console.error);
