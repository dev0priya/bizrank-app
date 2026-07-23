import { NextResponse } from 'next/server';
import { GoogleMapsScraper } from '../../../src/scraper';
import { DataProcessor } from '../../../src/processor';
import { WebsiteAuditor } from '../../../src/auditor';
import { LeadQualifier } from '../../../src/qualifier';
import { StorageHandler } from '../../../src/storage';

export async function POST(request: Request) {
    try {
        console.log("Starting Full Pipeline API Endpoint");
        
        const scraper = new GoogleMapsScraper();
        
        console.log("Running initial search...");
        const rawData = await scraper.searchBusinesses({
            country: "USA",
            state: "NY",
            city: "New York",
            category: "Restaurant",
            maxResults: 5 // Keep small for quick testing
        });
        
        const processedData = DataProcessor.processAndDeduplicate(rawData);
        const auditedData = await WebsiteAuditor.auditBusinesses(processedData);
        const leads = LeadQualifier.qualifyLeads(auditedData);

        const storage = new StorageHandler(auditedData);
        
        // This saveToPostgres method now contains logic to push to DB
        // We will update it to also push TimelineEvents!
        await storage.saveToPostgres();

        return NextResponse.json({ message: 'Pipeline executed successfully', records: auditedData.length, leads: leads.length });
    } catch (error: any) {
        console.error('Pipeline failed:', error);
        return NextResponse.json({ error: 'Pipeline execution failed.', details: error.message }, { status: 500 });
    }
}
