import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    const params = await context.params;
    const businessId = parseInt(params.id);
    if (isNaN(businessId)) {
        return NextResponse.json({ error: 'Invalid Business ID' }, { status: 400 });
    }

    try {
        const body = await request.json();
        
        const updateData: any = {};
        if (body.discovery_status) updateData.discovery_status = body.discovery_status;
        if (body.crm_status) updateData.crm_status = body.crm_status;
        if (body.priority) updateData.priority = body.priority;
        if (body.revenue) updateData.revenue = parseFloat(body.revenue);
        if (body.assigned_user) updateData.assigned_user = body.assigned_user;

        const updated = await prisma.business.update({
            where: { id: businessId },
            data: updateData
        });

        // Decoupled CRMLead integration logic
        if (body.crm_status === 'Lead' || body.discovery_status === 'CRM') {
            try {
                // Find default pipeline stage 'New'
                const defaultStage = await prisma.pipelineStage.findFirst({
                    where: { name: 'New' }
                });
                
                if (defaultStage) {
                    const existingLead = await prisma.cRMLead.findUnique({
                        where: { businessId: businessId }
                    });

                    if (!existingLead) {
                        const newLead = await prisma.cRMLead.create({
                            data: {
                                businessId: businessId,
                                pipelineStageId: defaultStage.id,
                                priority: body.priority || updated.priority || null,
                                estimatedValue: body.revenue ? parseFloat(body.revenue) : (updated.revenue || 0),
                                assignedTo: body.assigned_user || updated.assigned_user || null,
                                leadScore: updated.opportunity_score || 0
                            }
                        });

                        // Create an activity for the promotion
                        await prisma.activity.create({
                            data: {
                                crmLeadId: newLead.id,
                                type: 'OTHER',
                                summary: 'Lead Promoted to CRM',
                                details: 'Business promoted from discovery queue to active CRM sales pipeline.',
                                performedBy: 'System',
                                outcome: 'Success'
                            }
                        });

                        // Log CRMAuditLog entry
                        await prisma.cRMAuditLog.create({
                            data: {
                                performedBy: 'System',
                                action: 'LEAD_CREATED',
                                entityType: 'CRMLead',
                                entityId: newLead.id,
                                newValue: 'Promoted to CRM Lead'
                            }
                        });
                    }
                }
            } catch (crmErr) {
                console.error('Failed to create CRMLead record:', crmErr);
            }
        }

        // If pushing to CRM (crm_status set to 'Lead'), create a TimelineEvent
        if (body.crm_status && body.crm_status !== 'Unqualified') {
            await prisma.timelineEvent.create({
                data: {
                    action: `Status changed to ${body.crm_status}`,
                    business_id: businessId,
                    user: 'System'
                }
            });
        }

        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        console.error('Failed to update business:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
