import { prisma } from '../lib/prisma';

async function testPipeline() {
    console.log('--- STARTING CRM SALES PIPELINE INTEGRATION TEST ---');

    // 1. Verify stages exist and are ordered correctly
    console.log('Verifying PipelineStage list and order...');
    const stages = await prisma.pipelineStage.findMany({
        orderBy: { order: 'asc' }
    });

    const expectedStages = [
        { name: 'New', order: 1 },
        { name: 'Contacted', order: 2 },
        { name: 'Interested', order: 3 },
        { name: 'Meeting Scheduled', order: 4 },
        { name: 'Proposal Sent', order: 5 },
        { name: 'Negotiation', order: 6 },
        { name: 'Closed Won', order: 7 },
        { name: 'Closed Lost', order: 8 }
    ];

    if (stages.length < expectedStages.length) {
        console.error(`❌ Expected at least ${expectedStages.length} stages, found ${stages.length}`);
        process.exit(1);
    }

    for (let i = 0; i < expectedStages.length; i++) {
        const stage = stages[i];
        const expected = expectedStages[i];
        if (stage.name !== expected.name || stage.order !== expected.order) {
            console.error(`❌ Stage ordering mismatch at index ${i}: Found "${stage.name}" (Order: ${stage.order}), expected "${expected.name}" (Order: ${expected.order})`);
            process.exit(1);
        }
    }
    console.log('✅ PipelineStage list and database-driven ordering verified!');

    // 2. Fetch a lead to test stage change transaction
    const lead = await prisma.cRMLead.findFirst({
        include: { pipelineStage: true }
    });

    if (!lead) {
        console.error('❌ Lead required to execute integration test. Run prior stage tests first.');
        process.exit(1);
    }
    console.log(`Found Lead ID: ${lead.id} - Current Stage: "${lead.pipelineStage.name}"`);

    // We will simulate stage update to "Contacted" or "New" depending on current stage
    const currentStageName = lead.pipelineStage.name;
    const targetStage = stages.find(s => s.name !== currentStageName && s.name !== 'Closed Won' && s.name !== 'Closed Lost');
    if (!targetStage) {
        console.error('❌ Could not find a suitable target stage for testing.');
        process.exit(1);
    }

    console.log(`Testing stage change update to: "${targetStage.name}" (ID: ${targetStage.id})...`);

    // Clean old audit logs for this lead
    await prisma.cRMAuditLog.deleteMany({
        where: { entityId: lead.id, entityType: 'CRMLead', action: 'STAGE_CHANGED' }
    });

    // 3. Execute stage change transaction (simulating the Route logic)
    const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.cRMLead.update({
            where: { id: lead.id },
            data: { pipelineStageId: targetStage.id },
            include: { pipelineStage: true }
        });

        // Write audit log
        await tx.cRMAuditLog.create({
            data: {
                performedBy: 'SystemTest',
                action: 'STAGE_CHANGED',
                entityType: 'CRMLead',
                entityId: lead.id,
                previousValue: currentStageName,
                newValue: targetStage.name
            }
        });

        // Keep Business table synced
        let legacyStatus = targetStage.name;
        if (targetStage.name === 'New') legacyStatus = 'Lead';
        await tx.business.update({
            where: { id: lead.businessId },
            data: {
                crm_status: legacyStatus,
                discovery_status: (legacyStatus === 'Closed Won' || legacyStatus === 'Closed Lost') ? 'Qualified' : 'CRM'
            }
        });

        return updated;
    }, { maxWait: 20000, timeout: 30000 });

    console.log(`✅ Lead updated! New Stage in DB: "${result.pipelineStage.name}"`);

    // 4. Verify transaction safety & audit logs
    const auditLogs = await prisma.cRMAuditLog.findMany({
        where: { entityId: lead.id, entityType: 'CRMLead', action: 'STAGE_CHANGED', performedBy: 'SystemTest' }
    });

    if (auditLogs.length !== 1) {
        console.error(`❌ Expected 1 STAGE_CHANGED audit log, found ${auditLogs.length}`);
        process.exit(1);
    }

    const log = auditLogs[0];
    if (log.previousValue !== currentStageName || log.newValue !== targetStage.name) {
        console.error(`❌ Audit log value mismatch. Previous: "${log.previousValue}", New: "${log.newValue}". Expected Previous: "${currentStageName}", New: "${targetStage.name}"`);
        process.exit(1);
    }
    console.log('✅ Transaction safety & CRMAuditLog generation verified!');

    // 5. Verify validation inputs by querying invalid state
    console.log('Verifying Route validation safety...');
    // Simulated invalid lead update
    try {
        await prisma.cRMLead.update({
            where: { id: -999 },
            data: { pipelineStageId: targetStage.id }
        });
        console.error('❌ Failed: Allowed updating stage of non-existent lead.');
        process.exit(1);
    } catch (e) {
        console.log('✅ Correctly rejected update for non-existent Lead ID.');
    }

    try {
        await prisma.cRMLead.update({
            where: { id: lead.id },
            data: { pipelineStageId: -999 }
        });
        console.error('❌ Failed: Allowed updating lead to non-existent stage ID.');
        process.exit(1);
    } catch (e) {
        console.log('✅ Correctly rejected update for non-existent Stage ID.');
    }

    console.log('--- ALL CRM SALES PIPELINE INTEGRATION TESTS PASSED ---');
}

testPipeline()
    .catch((e) => {
        console.error('❌ Test failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
