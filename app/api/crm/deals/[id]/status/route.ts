import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const dealId = parseInt(id);
        if (isNaN(dealId)) {
            return NextResponse.json({ error: 'Invalid Deal ID' }, { status: 400 });
        }

        const body = await request.json();
        const { status, lostReason } = body;

        if (!status || !['WON', 'LOST'].includes(status)) {
            return NextResponse.json({ error: 'Status must be WON or LOST' }, { status: 400 });
        }

        // Fetch current deal and parent lead info
        const deal = await prisma.deal.findUnique({
            where: { id: dealId },
            include: {
                crmLead: {
                    include: {
                        pipelineStage: true
                    }
                }
            }
        });

        if (!deal) {
            return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
        }

        // Enforce transition rules
        if (deal.status !== 'OPEN') {
            return NextResponse.json({
                error: `This deal is already closed (${deal.status}). Modifications to status are rejected.`
            }, { status: 400 });
        }

        // Set timestamps and reasons
        const now = new Date();
        const updateData: any = { status };

        if (status === 'WON') {
            updateData.wonAt = now;
            updateData.lostAt = null;
            updateData.lostReason = null;
        } else {
            updateData.lostAt = now;
            updateData.wonAt = null;
            updateData.lostReason = lostReason?.trim() || 'OTHER';
        }

        // Find stage synchronization names
        const targetStageName = status === 'WON' ? 'Closed Won' : 'Closed Lost';

        // Perform updates inside a transaction
        const updatedDeal = await prisma.$transaction(async (tx) => {
            // 1. Update Deal
            const updated = await tx.deal.update({
                where: { id: dealId },
                data: updateData
            });

            // 2. Write Deal Status Audit Log
            await tx.cRMAuditLog.create({
                data: {
                    performedBy: 'System',
                    action: 'STATUS_CHANGED',
                    entityType: 'Deal',
                    entityId: dealId,
                    previousValue: deal.status,
                    newValue: status
                }
            });

            // 3. Find Pipeline Stage for Sync
            const targetStage = await tx.pipelineStage.findFirst({
                where: { name: targetStageName }
            });

            if (targetStage && deal.crmLead.pipelineStageId !== targetStage.id) {
                // Update Lead stage
                await tx.cRMLead.update({
                    where: { id: deal.crmLeadId },
                    data: { pipelineStageId: targetStage.id }
                });

                // Write Lead stage changed Audit Log
                await tx.cRMAuditLog.create({
                    data: {
                        performedBy: 'System',
                        action: 'STAGE_CHANGED',
                        entityType: 'CRMLead',
                        entityId: deal.crmLeadId,
                        previousValue: deal.crmLead.pipelineStage.name,
                        newValue: targetStage.name
                    }
                });

                // Sync legacy crm_status / discovery_status in Business table to prevent dashboard regression
                const legacyStatus = targetStage.name; // 'Closed Won' or 'Closed Lost'
                await tx.business.update({
                    where: { id: deal.crmLead.businessId },
                    data: {
                        crm_status: legacyStatus,
                        discovery_status: 'Qualified'
                    }
                });
            }

            return updated;
        });

        return NextResponse.json({ success: true, deal: updatedDeal });
    } catch (error: any) {
        console.error('Failed to transition deal status:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
