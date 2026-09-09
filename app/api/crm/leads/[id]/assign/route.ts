import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { checkCRMAuthorization, getAuthorizedUser } from '../../../../../../services/auth_middleware';

export const dynamic = 'force-dynamic';

export async function POST(
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
        const assignedTo = body.assignedTo || body.developerId || body.userId;

        if (!assignedTo) {
            return NextResponse.json({ error: 'Assignee is required' }, { status: 400 });
        }

        const normalized = String(assignedTo).trim().toLowerCase();
        let directUserId: string | null = null;
        if (normalized.includes('sakshi') || normalized.includes('shakshi')) {
            directUserId = 'usr-sakshi-01';
        } else if (normalized.includes('simran')) {
            directUserId = 'usr-simran-01';
        } else if (normalized.includes('sumit')) {
            directUserId = 'usr-sumit-01';
        }

        // Find the user by ID, Name or Username with flexible matching
        const targetUser = await prisma.user.findFirst({
            where: {
                OR: [
                    ...(directUserId ? [{ id: directUserId }] : []),
                    { id: assignedTo },
                    { name: assignedTo },
                    { username: assignedTo }
                ]
            }
        });

        if (!targetUser) {
            return NextResponse.json({ error: `User "${assignedTo}" not found in database.` }, { status: 404 });
        }

        if (targetUser.role !== 'DEVELOPER') {
            return NextResponse.json({ error: 'Forbidden: Selected user is not a developer.' }, { status: 403 });
        }

        const currentLead = await prisma.cRMLead.findUnique({
            where: { id: leadId },
            include: { business: true }
        });

        if (!currentLead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        const { username } = getAuthorizedUser(request);

        const updatedLead = await prisma.$transaction(async (tx) => {
            // Update Lead with developerId and assignedTo string
            const updated = await tx.cRMLead.update({
                where: { id: leadId },
                data: { 
                    developerId: targetUser.id,
                    assignedTo: targetUser.name,
                    websiteStatus: 'ASSIGNED' // Reset to ASSIGNED on new assignment
                },
                include: { business: true, developer: true }
            });

            // Sync with Business assigned_user
            await tx.business.update({
                where: { id: currentLead.businessId },
                data: { assigned_user: targetUser.name }
            });

            // Associate with the developer's workspace so it appears in their workspace immediately
            const devWs = await tx.workspace.findFirst({ where: { ownerId: targetUser.id } });
            const mainWs = await tx.workspace.findFirst({ where: { name: 'Main Workspace' } });

            if (devWs) {
                await tx.workspaceWebsite.upsert({
                    where: {
                        workspaceId_crmLeadId: {
                            workspaceId: devWs.id,
                            crmLeadId: leadId
                        }
                    },
                    update: {},
                    create: {
                        id: `ww-${devWs.id}-${leadId}`,
                        workspaceId: devWs.id,
                        crmLeadId: leadId
                    }
                });

                await tx.websiteAssignment.upsert({
                    where: { id: `wa-${devWs.id}-${leadId}` },
                    update: {
                        assignedToUserId: targetUser.id,
                        status: 'ACTIVE'
                    },
                    create: {
                        id: `wa-${devWs.id}-${leadId}`,
                        crmLeadId: leadId,
                        workspaceId: devWs.id,
                        assignedToUserId: targetUser.id,
                        status: 'ACTIVE'
                    }
                });
            }

            if (mainWs) {
                await tx.workspaceWebsite.upsert({
                    where: {
                        workspaceId_crmLeadId: {
                            workspaceId: mainWs.id,
                            crmLeadId: leadId
                        }
                    },
                    update: {},
                    create: {
                        id: `ww-main-${leadId}`,
                        workspaceId: mainWs.id,
                        crmLeadId: leadId
                    }
                });
            }

            // Log CRM Audit Log
            await tx.cRMAuditLog.create({
                data: {
                    performedBy: username || 'Admin User',
                    action: 'LEAD_ASSIGNED_TO_DEVELOPER',
                    entityType: 'CRMLead',
                    entityId: leadId,
                    previousValue: currentLead.assignedTo || 'Unassigned',
                    newValue: targetUser.name
                }
            });

            // Log Lead Activity
            await tx.activity.create({
                data: {
                    crmLeadId: leadId,
                    type: 'OTHER',
                    summary: 'Lead Assigned to Developer',
                    details: `Lead assigned to developer ${targetUser.name} (${targetUser.id}) by ${username || 'Admin User'}.`,
                    performedBy: username || 'Admin User'
                }
            });

            return updated;
        });

        return NextResponse.json({ success: true, lead: updatedLead });
    } catch (error: any) {
        console.error('Lead assignment failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

