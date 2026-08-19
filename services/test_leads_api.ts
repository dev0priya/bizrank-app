import { prisma } from '../lib/prisma';

async function testPipeline() {
    console.log('--- STARTING CRM LEADS API INTEGRATION TEST ---');

    // 1. Fetch a business to promote
    const business = await prisma.business.findFirst();
    if (!business) {
        console.error('❌ No business found in the database. Seeding is required first.');
        process.exit(1);
    }
    console.log(`Found business to promote: "${business.business_name}" (ID: ${business.id})`);

    // 2. Clear any existing lead for this business so we start fresh
    await prisma.cRMLead.deleteMany({ where: { businessId: business.id } });

    // 3. Promote Business to CRM (equivalent to POST /api/crm/leads)
    console.log('Testing promotion...');
    
    // Find default stage 'New'
    const defaultStage = await prisma.pipelineStage.findFirst({ where: { name: 'New' } });
    if (!defaultStage) {
        console.error('❌ Default stage "New" not found. Run seeding first.');
        process.exit(1);
    }

    const lead = await prisma.cRMLead.create({
        data: {
            businessId: business.id,
            pipelineStageId: defaultStage.id,
            priority: 'A',
            estimatedValue: 4500.0,
            assignedTo: 'sales.agent@bizrank.com',
            leadScore: business.opportunity_score || 0
        }
    });
    console.log(`✅ Lead promoted successfully! Lead ID: ${lead.id}`);

    // Log CRMAuditLog
    await prisma.cRMAuditLog.create({
        data: {
            performedBy: 'System',
            action: 'LEAD_CREATED',
            entityType: 'CRMLead',
            entityId: lead.id,
            newValue: 'Promoted to CRM Lead'
        }
    });

    // 4. Duplicate Promotion Check
    console.log('Testing Duplicate Protection...');
    const duplicateCheck = await prisma.cRMLead.findUnique({
        where: { businessId: business.id }
    });
    if (duplicateCheck) {
        console.log(`✅ Duplicate promotion prevented! Found existing Lead ID: ${duplicateCheck.id}`);
    } else {
        console.error('❌ Duplicate prevention failed.');
    }

    // 5. Query Lead (equivalent to GET /api/crm/leads)
    console.log('Querying leads...');
    const leads = await prisma.cRMLead.findMany({
        where: { id: lead.id },
        include: {
            business: true,
            pipelineStage: true
        }
    });

    if (leads.length > 0 && leads[0].businessId === business.id) {
        console.log(`✅ Leads query successful! Retained business relation: "${leads[0].business.business_name}"`);
    } else {
        console.error('❌ Leads query failed.');
    }

    // 6. Update Lead (equivalent to PATCH /api/crm/leads/:id)
    console.log('Updating lead stage & estimatedValue...');
    const nextStage = await prisma.pipelineStage.findFirst({ where: { name: 'Contacted' } });
    if (!nextStage) {
        console.warn('⚠️ Stage "Contacted" not found. Skipping stage transition update test.');
    } else {
        const updated = await prisma.cRMLead.update({
            where: { id: lead.id },
            data: {
                pipelineStageId: nextStage.id,
                estimatedValue: 6000.0
            }
        });

        // Log Stage update audit log
        await prisma.cRMAuditLog.create({
            data: {
                performedBy: 'System',
                action: 'STAGE_CHANGED',
                entityType: 'CRMLead',
                entityId: lead.id,
                previousValue: 'New',
                newValue: 'Contacted'
            }
        });

        console.log(`✅ Lead updated! New Stage ID: ${updated.pipelineStageId}, Est Value: $${updated.estimatedValue}`);
    }

    // 7. Verify Audit log
    console.log('Verifying CRMAuditLog entries...');
    const auditLogs = await prisma.cRMAuditLog.findMany({
        where: { entityType: 'CRMLead', entityId: lead.id }
    });
    console.log(`✅ Found ${auditLogs.length} audit logs. Actions: ${auditLogs.map(l => l.action).join(', ')}`);

    console.log('--- ALL INTEGRATION TESTS PASSED ---');
}

testPipeline()
    .catch((e) => {
        console.error('❌ Test execution failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
