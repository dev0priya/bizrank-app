import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { checkCRMAuthorization, getAuthorizedUser } from '../../../../../services/auth_middleware';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    const leadId = parseInt(params.id);

    if (isNaN(leadId)) {
        return NextResponse.json({ error: 'Invalid Lead ID' }, { status: 400 });
    }

    const auth = await checkCRMAuthorization(request, 'read', { crmLeadId: leadId });
    if (!auth.authorized) return auth.errorResponse;

    try {
        const lead = await prisma.cRMLead.findUnique({
            where: { id: leadId },
            include: {
                business: {
                    include: {
                        category: true,
                        city: true,
                        state: true,
                        area: true
                    }
                },
                contacts: {
                    include: {
                        activities: {
                            select: { id: true }
                        }
                    }
                },
                activities: {
                    orderBy: { occurredAt: 'desc' }
                },
                notes: {
                    orderBy: { createdAt: 'desc' }
                },
                followUps: {
                    orderBy: { dueAt: 'asc' }
                },
                deals: {
                    orderBy: { createdAt: 'desc' }
                },
                pipelineStage: true,
                developer: true,
                swati: true,
                tags: {
                    include: {
                        tag: true
                    }
                }
            }
        });

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // Fetch Audit logs associated with this lead
        const auditLogs = await prisma.cRMAuditLog.findMany({
            where: {
                entityType: 'CRMLead',
                entityId: leadId
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            ...lead,
            auditLogs
        });
    } catch (error: any) {
        console.error('Failed to retrieve single CRM lead:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    const leadId = parseInt(params.id);

    if (isNaN(leadId)) {
        return NextResponse.json({ error: 'Invalid Lead ID' }, { status: 400 });
    }

    const auth = await checkCRMAuthorization(request, 'write', { crmLeadId: leadId });
    if (!auth.authorized) return auth.errorResponse;

    try {
        const body = await request.json();
        const { priority, pipelineStageId, assignedTo, leadScore, estimatedValue } = body;

        // Fetch current lead details
        const currentLead = await prisma.cRMLead.findUnique({
            where: { id: leadId },
            include: { pipelineStage: true }
        });

        if (!currentLead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        const updateData: any = {};
        const businessUpdateData: any = {};
        const auditLogsToCreate: any[] = [];

        // Validate & process pipelineStageId
        if (pipelineStageId !== undefined) {
            const stageIdInt = parseInt(pipelineStageId);
            if (isNaN(stageIdInt)) {
                return NextResponse.json({ error: 'Invalid Stage ID' }, { status: 400 });
            }

            const targetStage = await prisma.pipelineStage.findUnique({
                where: { id: stageIdInt }
            });

            if (!targetStage) {
                return NextResponse.json({ error: 'Stage not found' }, { status: 400 });
            }

            if (currentLead.pipelineStageId !== stageIdInt) {
                updateData.pipelineStageId = stageIdInt;
                auditLogsToCreate.push({
                    performedBy: 'System',
                    action: 'STAGE_CHANGED',
                    entityType: 'CRMLead',
                    entityId: leadId,
                    previousValue: currentLead.pipelineStage.name,
                    newValue: targetStage.name
                });

                // Update legacy crm_status / discovery_status in Business table to prevent dashboard regression
                let legacyCrmStatus = targetStage.name;
                // Map DB names to expected legacy route values if needed
                if (targetStage.name === 'New') legacyCrmStatus = 'Lead';
                if (targetStage.name === 'Closed Won') legacyCrmStatus = 'Closed Won';
                if (targetStage.name === 'Closed Lost') legacyCrmStatus = 'Closed Lost';

                businessUpdateData.crm_status = legacyCrmStatus;
                businessUpdateData.discovery_status = (legacyCrmStatus === 'Closed Won' || legacyCrmStatus === 'Closed Lost') ? 'Qualified' : 'CRM';
            }
        }

        // Validate & process priority
        if (priority !== undefined) {
            if (priority !== null && !['A', 'B', 'C'].includes(priority)) {
                return NextResponse.json({ error: 'Priority must be A, B, C or null' }, { status: 400 });
            }
            if (currentLead.priority !== priority) {
                updateData.priority = priority;
                auditLogsToCreate.push({
                    performedBy: 'System',
                    action: 'PRIORITY_CHANGED',
                    entityType: 'CRMLead',
                    entityId: leadId,
                    previousValue: currentLead.priority || 'None',
                    newValue: priority || 'None'
                });

                // Sync priority to Business table
                businessUpdateData.priority = priority;
            }
        }

        // Validate & process assignedTo
        if (assignedTo !== undefined) {
            if (currentLead.assignedTo !== assignedTo) {
                let devId = null;
                let assigneeName = assignedTo;

                if (assignedTo) {
                    const targetUser = await prisma.user.findFirst({
                        where: {
                            OR: [
                                { id: assignedTo },
                                { name: assignedTo },
                                { username: assignedTo }
                            ]
                        }
                    });
                    if (targetUser) {
                        if (targetUser.role === 'DEVELOPER') {
                            devId = targetUser.id;
                            assigneeName = targetUser.name;
                        } else {
                            return NextResponse.json({ error: 'Forbidden: Selected user is not a developer.' }, { status: 403 });
                        }
                    }
                }

                updateData.assignedTo = assigneeName;
                updateData.developerId = devId;
                
                auditLogsToCreate.push({
                    performedBy: 'System',
                    action: 'ASSIGNEE_CHANGED',
                    entityType: 'CRMLead',
                    entityId: leadId,
                    previousValue: currentLead.assignedTo || 'Unassigned',
                    newValue: assigneeName || 'Unassigned'
                });

                // Sync assignee to Business table
                businessUpdateData.assigned_user = assigneeName;
            }
        }

        // Validate & process leadScore
        if (leadScore !== undefined) {
            const scoreInt = parseInt(leadScore);
            if (isNaN(scoreInt) || scoreInt < 0 || scoreInt > 100) {
                return NextResponse.json({ error: 'Score must be a number between 0 and 100' }, { status: 400 });
            }
            if (currentLead.leadScore !== scoreInt) {
                updateData.leadScore = scoreInt;
            }
        }

        // Validate & process estimatedValue
        if (estimatedValue !== undefined) {
            const valueFloat = parseFloat(estimatedValue);
            if (isNaN(valueFloat) || valueFloat < 0) {
                return NextResponse.json({ error: 'Estimated value must be a positive number' }, { status: 400 });
            }
            if (currentLead.estimatedValue !== valueFloat) {
                updateData.estimatedValue = valueFloat;
                auditLogsToCreate.push({
                    performedBy: 'System',
                    action: 'VALUE_CHANGED',
                    entityType: 'CRMLead',
                    entityId: leadId,
                    previousValue: currentLead.estimatedValue.toString(),
                    newValue: valueFloat.toString()
                });

                // Sync revenue to Business table
                businessUpdateData.revenue = valueFloat;
            }
        }

        // Persist updates
        let updatedLead = currentLead;
        if (Object.keys(updateData).length > 0) {
            updatedLead = await prisma.$transaction(async (tx) => {
                const updated = await tx.cRMLead.update({
                    where: { id: leadId },
                    data: updateData,
                    include: { pipelineStage: true }
                });

                if (Object.keys(businessUpdateData).length > 0) {
                    await tx.business.update({
                        where: { id: currentLead.businessId },
                        data: businessUpdateData
                    });
                }

                // Write change logs
                for (const log of auditLogsToCreate) {
                    await tx.cRMAuditLog.create({
                        data: log
                    });
                }

                return updated;
            });
        }

        return NextResponse.json({ success: true, updated: updatedLead });
    } catch (error: any) {
        console.error('Failed to update CRM lead:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    const leadId = parseInt(params.id);

    if (isNaN(leadId)) {
        return NextResponse.json({ error: 'Invalid Lead ID' }, { status: 400 });
    }

    const auth = await checkCRMAuthorization(request, 'write', { crmLeadId: leadId });
    if (!auth.authorized) return auth.errorResponse;

    try {
        const currentLead = await prisma.cRMLead.findUnique({
            where: { id: leadId }
        });

        if (!currentLead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        const { role, username } = getAuthorizedUser(request);

        // Developer permission check: can delete ONLY their own assigned work
        if ((role as string) === 'DEVELOPER') {
            const callingUser = await prisma.user.findUnique({
                where: { username }
            });
            if (!callingUser || currentLead.developerId !== callingUser.id) {
                return NextResponse.json({ error: 'Forbidden: You can only remove your own assigned website work.' }, { status: 403 });
            }
        }

        await prisma.$transaction(async (tx) => {
            // Set isArchived = true
            await tx.cRMLead.update({
                where: { id: leadId },
                data: { isArchived: true }
            });

            // Log CRM Audit Log
            await tx.cRMAuditLog.create({
                data: {
                    performedBy: username || 'System',
                    action: 'LEAD_ARCHIVED',
                    entityType: 'CRMLead',
                    entityId: leadId,
                    previousValue: 'false',
                    newValue: 'true'
                }
            });

            // Log Lead Activity
            await tx.activity.create({
                data: {
                    crmLeadId: leadId,
                    type: 'OTHER',
                    summary: 'Lead Archived',
                    details: `Lead soft-deleted/archived by ${username || 'System'}.`,
                    performedBy: username || 'System'
                }
            });
        });

        return NextResponse.json({ success: true, message: 'Website work successfully removed.' });
    } catch (error: any) {
        console.error('Failed to delete/archive CRM lead:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

