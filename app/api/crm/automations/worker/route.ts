import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function POST(request: Request) {
    try {
        console.log('Running Untouched Leads background worker automation...');
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Find leads that either:
        // 1. Have no activity at all, and were created > 7 days ago
        // 2. Have their latest activity occurredAt > 7 days ago
        const allLeads = await prisma.cRMLead.findMany({
            include: {
                activities: {
                    orderBy: { occurredAt: 'desc' },
                    take: 1
                }
            }
        });

        const untouchedLeads = allLeads.filter(lead => {
            if (lead.activities.length === 0) {
                return lead.createdAt < sevenDaysAgo;
            }
            return lead.activities[0].occurredAt < sevenDaysAgo;
        });

        console.log(`Resolved ${untouchedLeads.length} untouched leads (>= 7 days).`);

        let processedCount = 0;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        for (const lead of untouchedLeads) {
            // Check if there is already a PENDING follow-up to avoid double scheduling
            const pendingFollowUp = await prisma.followUp.findFirst({
                where: {
                    crmLeadId: lead.id,
                    status: 'PENDING'
                }
            });

            if (pendingFollowUp) continue;

            // Transaction-safe updates
            await prisma.$transaction(async (tx) => {
                await tx.followUp.create({
                    data: {
                        crmLeadId: lead.id,
                        dueAt: tomorrow,
                        status: 'PENDING',
                        assignedTo: lead.assignedTo || 'admin@bizrank.com'
                    }
                });

                await tx.activity.create({
                    data: {
                        crmLeadId: lead.id,
                        type: 'OTHER',
                        summary: 'Untouched Lead Auto-Followup Scheduled',
                        details: 'System auto-scheduled a callback because this lead was untouched for 7+ days with no activity.',
                        performedBy: 'System',
                        outcome: 'Success'
                    }
                });

                await tx.cRMAuditLog.create({
                    data: {
                        performedBy: 'System',
                        action: 'TASK_CREATED',
                        entityType: 'CRMLead',
                        entityId: lead.id,
                        newValue: 'Auto-scheduled follow-up for stale lead'
                    }
                });
            });

            processedCount++;
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${untouchedLeads.length} stale leads. Auto-scheduled ${processedCount} followups.`,
            stats: {
                totalUntouched: untouchedLeads.length,
                followupsScheduled: processedCount
            }
        });
    } catch (error: any) {
        console.error('Stale leads automation failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Support GET for manual triggering or simple monitoring integrations
export async function GET(request: Request) {
    return POST(request);
}
