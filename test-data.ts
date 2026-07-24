// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { DataProcessor } from './src/processor';
import { WebsiteAuditor } from './src/auditor';

const prisma = new PrismaClient();

const mockApifyData = [
    {
        title: "Janakpuri Royal Restaurant",
        categoryName: "Fine Dining Restaurant", // Google Maps category
        address: "B-Block, Janakpuri, New Delhi, Delhi 110058",
        neighborhood: "Janakpuri",
        city: "Delhi",
        state: "Delhi",
        countryCode: "India",
        phoneUnformatted: "+919876543210",
        website: "https://janakpuriroyal.com",
        url: "https://goo.gl/maps/mock1",
        totalScore: 4.8,
        reviewsCount: 1542,
        location: { lat: 28.6219, lng: 77.0878 },
        placeId: "ChIJ_mock_1",
        ownerTitle: "Ramesh Kumar",
        status: "Open"
    },
    {
        title: "Delhi Bites",
        // Notice categoryName is missing to test fallback
        address: "C-Block Market, Janakpuri, New Delhi, Delhi 110058",
        phoneUnformatted: "011-4567890",
        url: "https://goo.gl/maps/mock2",
        totalScore: 4.2,
        reviewsCount: 320,
        location: { lat: 28.6220, lng: 77.0879 },
        placeId: "ChIJ_mock_2",
        status: "Temporarily closed"
    }
];

async function main() {
    console.log("Processing mock Apify data...");
    
    // Simulate job query category fallback "Restaurant"
    const processed = DataProcessor.processAndDeduplicate(mockApifyData, "Restaurant");
    console.log("\nProcessed Data:");
    console.log(JSON.stringify(processed, null, 2));

    const audited = await WebsiteAuditor.auditBusinesses(processed);

    for (const biz of audited) {
        const data: any = {
            place_id: biz.place_id,
            business_name: biz.business_name,
            google_category: biz.google_category || biz.category, // Fallback applied
            owner_name: biz.owner_name,
            business_status: biz.business_status,
            full_address: biz.full_address,
            phone_number: biz.phone_number,
            website: biz.website,
            google_maps_url: biz.google_maps_url,
            rating: biz.rating,
            review_count: biz.review_count,
            latitude: biz.latitude,
            longitude: biz.longitude,
        };

        const result = await prisma.business.upsert({
            where: { place_id: biz.place_id },
            update: data,
            create: data
        });
        
        console.log(`\nSaved Business to DB: ${result.business_name}`);
        console.log(`- Google Category: ${result.google_category}`);
        console.log(`- Owner Name: ${result.owner_name}`);
        console.log(`- Business Status: ${result.business_status}`);
        console.log(`- Rating: ${result.rating}`);
        console.log(`- Address: ${result.full_address}`);
    }
    
    console.log("\nValidation Test Complete!");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
