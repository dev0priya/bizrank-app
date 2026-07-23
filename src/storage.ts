import * as fs from 'fs';
import { parse } from 'json2csv';
import * as xlsx from 'xlsx';
import { PrismaClient } from '@prisma/client';
import { Config } from './config';
import { AuditedBusiness } from './auditor';
import { Lead } from './qualifier';

export class StorageHandler {
    private data: AuditedBusiness[];

    constructor(data: AuditedBusiness[]) {
        this.data = data;
    }
    
    saveToJson(filename = "output.json") {
        fs.writeFileSync(filename, JSON.stringify(this.data, null, 4), 'utf8');
        console.log(`Data saved to ${filename}`);
    }

    saveToCsv(filename = "output.csv") {
        if (this.data.length === 0) {
            console.log(`No data to save to ${filename}`);
            return;
        }
        const csv = parse(this.data);
        fs.writeFileSync(filename, csv, 'utf8');
        console.log(`Data saved to ${filename}`);
    }

    saveToExcel(filename = "output.xlsx") {
        if (this.data.length === 0) {
            console.log(`No data to save to ${filename}`);
            return;
        }
        const ws = xlsx.utils.json_to_sheet(this.data);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Businesses");
        xlsx.writeFile(wb, filename);
        console.log(`Data saved to ${filename}`);
    }

    saveLeadsToExcel(leads: Lead[], filename = "leads.xlsx") {
        if (!leads || leads.length === 0) {
            console.log(`No leads to save to ${filename}`);
            return;
        }
        const ws = xlsx.utils.json_to_sheet(leads);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Qualified Leads");
        xlsx.writeFile(wb, filename);
        console.log(`Leads Spreadsheet successfully generated: ${filename}`);
    }

    async saveToPostgres() {
        if (!Config.DATABASE_URL) {
            console.log("PostgreSQL export skipped: DATABASE_URL not provided.");
            return;
        }
        if (this.data.length === 0) {
            console.log("PostgreSQL export skipped: No data to export.");
            return;
        }
        
        const prisma = new PrismaClient();
        try {
            await prisma.$connect();
            
            for (const row of this.data) {
                // Determine CRM Status based on pipeline auto-updates
                // Default: Collected
                let crmStatus = "Collected";
                let priority = null;
                
                if (row.website_classification === "No Website") {
                    crmStatus = "Qualified Lead";
                    priority = "Priority A";
                } else if (row.website_score < 60) {
                    crmStatus = "Qualified Lead";
                    priority = "Priority B";
                } else if (row.website_score >= 60 && row.website_score <= 75) {
                    crmStatus = "Qualified Lead";
                    priority = "Priority C";
                } else {
                    crmStatus = "Website Audited"; // Highly optimized site, ignored as lead
                }

                const dbBiz = await prisma.business.upsert({
                    where: { google_maps_url: row.google_maps_url },
                    update: { ...row, crm_status: crmStatus, priority },
                    create: { ...row, crm_status: crmStatus, priority }
                });

                // Generate automatic timeline events
                const events = [
                    { action: "Business Collected", notes: "Fetched via Apify Google Maps Scraper", user: "System" },
                    { action: "Website Audited", notes: `Automated audit completed. Score: ${row.website_score}`, user: "System" }
                ];
                
                if (crmStatus === "Qualified Lead") {
                    events.push({ action: "Qualified as Lead", notes: `Categorized as ${priority}`, user: "System" });
                }

                // Check existing events to prevent duplicates in timeline on re-runs
                const existingEvents = await prisma.timelineEvent.findMany({ where: { business_id: dbBiz.id } });
                const existingActions = new Set(existingEvents.map(e => e.action));

                for (const ev of events) {
                    if (!existingActions.has(ev.action)) {
                        await prisma.timelineEvent.create({
                            data: {
                                ...ev,
                                business_id: dbBiz.id
                            }
                        });
                    }
                }
            }
            console.log(`Data successfully saved to Database with CRM Timelines.`);
        } catch (err: any) {
            console.log(`Failed to save to DB via Prisma: ${err.message}`);
        } finally {
            await prisma.$disconnect();
        }
    }
}
