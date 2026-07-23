import { GoogleMapsScraper } from './scraper';
import { DataProcessor } from './processor';
import { StorageHandler } from './storage';
import { WebsiteAuditor } from './auditor';
import { LeadQualifier } from './qualifier';

export async function runPipeline() {
    console.log("Starting Full Pipeline: Collection -> Audit -> Qualification");
    
    const scraper = new GoogleMapsScraper();
    
    console.log("Running initial search...");
    const rawData = await scraper.searchBusinesses({
        country: "USA",
        state: "NY",
        city: "New York",
        category: "Restaurant",
        maxResults: 15
    });
    
    console.log("Processing and deduplicating data...");
    const processedData = DataProcessor.processAndDeduplicate(rawData);
    
    console.log("Auditing Websites...");
    const auditedData = await WebsiteAuditor.auditBusinesses(processedData);

    console.log("Qualifying Leads...");
    const leads = LeadQualifier.qualifyLeads(auditedData);

    console.log("Saving data to various formats...");
    const storage = new StorageHandler(auditedData);
    
    storage.saveToJson("businesses.json");
    storage.saveToCsv("businesses.csv");
    storage.saveToExcel("businesses.xlsx");
    await storage.saveToPostgres();

    // Save Leads Spreadsheet
    storage.saveLeadsToExcel(leads, "leads.xlsx");
    
    console.log("Pipeline completed successfully.");
}

// Ensure it runs if invoked directly
if (require.main === module) {
    runPipeline().catch(console.error);
}
