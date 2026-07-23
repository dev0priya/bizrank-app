import { AuditedBusiness } from './auditor';

export interface Lead {
    "Business Name": string;
    "Category": string;
    "Phone": string;
    "Website": string;
    "Quality Score": number | string;
    "Reason for Qualification": string;
}

export class LeadQualifier {
    static qualifyLeads(auditedBusinesses: AuditedBusiness[]): Lead[] {
        console.log(`Qualifying ${auditedBusinesses.length} audited businesses into leads...`);
        const leads: Lead[] = [];

        for (const biz of auditedBusinesses) {
            let reason = "";

            if (biz.website_classification === "No Website") {
                reason = "Priority A: No Website";
            } else if (biz.website_score < 60) {
                reason = "Priority B: Quality Score below 60";
            } else if (biz.website_score >= 60 && biz.website_score <= 75) {
                reason = "Priority C: Quality Score 60-75";
            } else {
                continue;
            }

            leads.push({
                "Business Name": biz.business_name || "Unknown",
                "Category": biz.category || "Unknown",
                "Phone": biz.phone_number || "N/A",
                "Website": biz.website || "N/A",
                "Quality Score": biz.website_score !== undefined ? biz.website_score : "N/A",
                "Reason for Qualification": reason
            });
        }

        console.log(`Lead Qualification complete. Identified ${leads.length} leads.`);
        return leads;
    }
}
