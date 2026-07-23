import { AuditedBusiness } from './src/auditor';
import { LeadQualifier } from './src/qualifier';

async function runTests() {
    console.log("Starting Full TS Migration Validation...\n");
    
    try {
        const mockAuditedData: AuditedBusiness[] = [
            {
                business_name: "TS Biz 1",
                category: "Category A",
                full_address: null,
                area: null,
                city: null,
                state: null,
                country: null,
                phone_number: "111",
                website: null,
                google_maps_url: "url1",
                rating: null,
                review_count: null,
                latitude: null,
                longitude: null,
                audit_mobile_responsive: false,
                audit_https: false,
                audit_navigation: false,
                audit_ui_design: false,
                audit_typography: false,
                audit_cta: false,
                audit_contact_visibility: false,
                audit_images: false,
                audit_branding: false,
                audit_loading_speed: false,
                audit_accessibility: false,
                website_score: 0,
                website_classification: "No Website"
            }
        ];

        console.log("Testing TS Lead Qualifier...");
        const leads = LeadQualifier.qualifyLeads(mockAuditedData);
        if (leads.length === 1 && leads[0]["Reason for Qualification"].includes("Priority A")) {
            console.log("✓ Leads logic verified.");
        } else {
            throw new Error("Leads logic failed.");
        }

        console.log("\nAll internal business logic tests passed successfully under TypeScript!");
        
    } catch (e: any) {
        console.error(`\nTEST FAILED: ${e.message}`);
    }
}

if (require.main === module) {
    runTests();
}
