import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { checkCRMAuthorization, getAuthorizedUser } from '../../../../../services/auth_middleware';

const ALLOWED_ASSIGNEES = ['Simran Kaur', 'Sakshi Sharma', 'Sumit Chaudhary'];

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
        const { assignedTo } = body;

        if (!assignedTo) {
            return NextResponse.json({ error: 'Assignee is required' }, { status: 400 });
        }

        if (!ALLOWED_ASSIGNEES.includes(assignedTo)) {
            return NextResponse.json({ error: 'Forbidden: Selected user is not an allowed sales team member for Business Discovery lead assignments.' }, { status: 403 });
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
            // Update Lead
            const updated = await tx.cRMLead.update({
                where: { id: leadId },
                data: { assignedTo },
                include: { business: true }
            });

            // Sync with Business assigned_user
            await tx.business.update({
                where: { id: currentLead.businessId },
                data: { assigned_user: assignedTo }
            });

            // Log CRM Audit Log
            await tx.cRMAuditLog.create({
                data: {
                    performedBy: username || 'Admin User',
                    action: 'LEAD_ASSIGNED',
                    entityType: 'CRMLead',
                    entityId: leadId,
                    previousValue: currentLead.assignedTo || 'Unassigned',
                    newValue: assignedTo
                }
            });

            // Log Lead Activity
            await tx.activity.create({
                data: {
                    crmLeadId: leadId,
                    type: 'OTHER',
                    summary: 'Lead Assigned',
                    details: `Lead assigned to ${assignedTo} by ${username || 'Admin User'}.`,
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
