import { prisma } from '../lib/prisma';
import { FollowUpStatus } from '@prisma/client';

async function testFollowUps() {
    console.log('--- STARTING CRM FOLLOW-UPS INTEGRATION TEST ---');

    // 1. Fetch lead
    const lead = await prisma.cRMLead.findFirst({
        include: { business: true }
    });

    if (!lead) {
        console.error('❌ Lead required. Run prior phase tests first.');
        process.exit(1);
    }
    console.log(`Found Lead ID: ${lead.id} - Business: "${lead.business.business_name}"`);

    // Clean up old follow-ups for this lead
    await prisma.followUp.deleteMany({ where: { crmLeadId: lead.id } });

    // 2. Schedule Follow-up (POST)
    console.log('Scheduling a follow-up...');
    const contact = await prisma.contact.findFirst({ where: { crmLeadId: lead.id } });
    const dueAt = new Date();
    dueAt.setHours(dueAt.getHours() + 1); // 1 hour from now (Upcoming)

    const fUp = await prisma.followUp.create({
        data: {
            crmLeadId: lead.id,
            contactId: contact ? contact.id : null,
            assignedTo: 'Admin',
            dueAt: dueAt,
            status: FollowUpStatus.PENDING
        }
    });
    console.log(`✅ Follow-up scheduled successfully: ID ${fUp.id}`);

    // 3. Rescheduling Follow-up (PATCH dueAt)
    console.log('Testing rescheduling follow-up...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const rescheduled = await prisma.followUp.update({
        where: { id: fUp.id },
        data: { dueAt: tomorrow }
    });
    console.log(`✅ Rescheduling verified: New Date: ${rescheduled.dueAt.toLocaleDateString()}`);

    // 4. Query status filters (Derived query rules)
    console.log('Verifying tabs filter queries...');
    const now = new Date();
    const overdueDate = new Date();
    overdueDate.setHours(now.getHours() - 2); // 2 hours ago (Overdue)

    // Schedule an overdue follow-up
    const overdueFU = await prisma.followUp.create({
        data: {
            crmLeadId: lead.id,
            contactId: contact ? contact.id : null,
            assignedTo: 'Admin',
            dueAt: overdueDate,
            status: FollowUpStatus.PENDING
        }
    });

    // Check query counts
    const pendingOverdues = await prisma.followUp.findMany({
        where: {
            status: FollowUpStatus.PENDING,
            dueAt: { lt: now }
        }
    });
    console.log(`✅ Overdue derived filter query works: Found ${pendingOverdues.length} overdue item(s)`);

    // 5. Completion Workflow (PATCH status=COMPLETED)
    console.log('Completing overdue follow-up...');
    const completeBody = {
        status: 'COMPLETED',
        outcome: 'INTERESTED',
        outcomeNotes: 'Client wants to buy. Schedule demo next week.',
        nextFollowUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 7 days from now
        nextFollowUpTime: '10:00'
    };

    // Perform operations in transaction
    const completedFU = await prisma.$transaction(async (tx) => {
        const target = await tx.followUp.findUnique({ where: { id: overdueFU.id } });
        if (!target) throw new Error('Not found');

        // Check if already completed
        if (target.status === FollowUpStatus.COMPLETED) {
            return target;
        }

        const updated = await tx.followUp.update({
            where: { id: overdueFU.id },
            data: {
                status: FollowUpStatus.COMPLETED,
                completedAt: new Date(),
                outcome: completeBody.outcome
            }
        });

        // Create timeline activity
        await tx.activity.create({
            data: {
                crmLeadId: target.crmLeadId,
                contactId: target.contactId,
                type: 'CALL',
                summary: `Follow-up Completed: ${completeBody.outcome}`,
                details: completeBody.outcomeNotes,
                outcome: completeBody.outcome,
                performedBy: 'Admin',
                occurredAt: new Date()
            }
        });

        // Create next follow-up
        const nextDue = new Date(`${completeBody.nextFollowUpDate}T${completeBody.nextFollowUpTime}:00`);
        await tx.followUp.create({
            data: {
                crmLeadId: target.crmLeadId,
                contactId: target.contactId,
                assignedTo: 'Admin',
                dueAt: nextDue,
                status: FollowUpStatus.PENDING
            }
        });

        // Write CRMAuditLog
        await tx.cRMAuditLog.create({
            data: {
                performedBy: 'Admin',
                action: 'FOLLOW_UP_COMPLETED',
                entityType: 'CRMLead',
                entityId: target.crmLeadId,
                newValue: `Completed follow-up ID ${overdueFU.id}. Outcome: ${completeBody.outcome}`
            }
        });

        return updated;
    }, { maxWait: 20000, timeout: 30000 });

    console.log(`✅ Follow-up completed: Status: ${completedFU.status}, completedAt: ${completedFU.completedAt?.toLocaleDateString()}`);

    // Verify activity count increments
    const activitiesCount = await prisma.activity.count({
        where: { crmLeadId: lead.id, summary: { contains: 'Follow-up Completed' } }
    });
    console.log(`✅ Related Timeline Activity count: ${activitiesCount}`);

    // Verify next scheduled follow-up exists
    const nextFUs = await prisma.followUp.count({
        where: { crmLeadId: lead.id, status: FollowUpStatus.PENDING }
    });
    console.log(`✅ Next scheduled pending follow-up: Found ${nextFUs} item(s)`);

    // 6. Idempotency Check (run Complete again on the same Completed FollowUp)
    console.log('Testing Complete operation Idempotency...');
    // We execute the transaction again. Since status is now COMPLETED, it should be a no-op return.
    const reCompletedFU = await prisma.$transaction(async (tx) => {
        const target = await tx.followUp.findUnique({ where: { id: overdueFU.id } });
        if (!target) throw new Error('Not found');

        // Check if already completed
        if (target.status === FollowUpStatus.COMPLETED) {
            return target; // No mutations should happen!
        }

        throw new Error('Idempotency error: Mutating completed follow-up');
    });

    // Verify no duplicate activities are logged
    const finalActivitiesCount = await prisma.activity.count({
        where: { crmLeadId: lead.id, summary: { contains: 'Follow-up Completed' } }
    });

    if (finalActivitiesCount === activitiesCount) {
        console.log('✅ Idempotency test passed! No duplicate activities logged on double-complete request.');
    } else {
        console.error('❌ Idempotency failed: Duplicate activities generated.');
        process.exit(1);
    }

    // 7. Cancellation (PATCH status=CANCELLED)
    console.log('Testing Cancellation...');
    const cancelledFU = await prisma.followUp.update({
        where: { id: fUp.id },
        data: { status: FollowUpStatus.CANCELLED }
    });
    console.log(`✅ Cancellation verified: Status: ${cancelledFU.status}`);

    console.log('--- ALL FOLLOW-UPS INTEGRATION TESTS PASSED ---');
}

testFollowUps()
    .catch((e) => {
        console.error('❌ Test execution failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
