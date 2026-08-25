import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { checkCRMAuthorization, getAuthorizedUser } from '../../../../../../services/auth_middleware';
import { ActivityType } from '@prisma/client';

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
        const { method, notes, status, nextFollowUpDate, nextFollowUpTime } = body;

        if (!status || !['New', 'Interested', 'Follow-up Required', 'No Response', 'Not Interested', 'Closed'].includes(status)) {
            return NextResponse.json({ error: 'Invalid client status' }, { status: 400 });
        }

        const currentLead = await prisma.cRMLead.findUnique({
            where: { id: leadId }
        });

        if (!currentLead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        const { role, username } = getAuthorizedUser(request);

        // Security check: Swati role or admin/manager role only
        if ((role as string) === 'DEVELOPER') {
            return NextResponse.json({ error: 'Forbidden: Developers cannot log client communications.' }, { status: 403 });
        }

        // Map method to ActivityType enum
        let activityType: ActivityType = ActivityType.OTHER;
        if (method === 'Call') activityType = ActivityType.CALL;
        else if (method === 'WhatsApp') activityType = ActivityType.WHATSAPP;
        else if (method === 'SMS') activityType = ActivityType.OTHER;
        else if (method === 'Email') activityType = ActivityType.EMAIL;

        await prisma.$transaction(async (tx) => {
            // 1. Create communication Activity log
            await tx.activity.create({
                data: {
                    crmLeadId: leadId,
                    type: activityType,
                    summary: `Communication: ${method}`,
                    details: notes || 'No details provided.',
                    performedBy: username
                }
            });

            // 2. Mark previous pending follow-ups as COMPLETED
            await tx.followUp.updateMany({
                where: {
                    crmLeadId: leadId,
                    status: 'PENDING'
                },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    outcome: 'Logged communication'
                }
            });

            // 3. Create a new follow-up if date is provided
            if (nextFollowUpDate) {
                const combinedDueStr = nextFollowUpTime ? `${nextFollowUpDate}T${nextFollowUpTime}` : nextFollowUpDate;
                const dueAt = new Date(combinedDueStr);
                if (!isNaN(dueAt.getTime())) {
                    await tx.followUp.create({
                        data: {
                            crmLeadId: leadId,
                            assignedTo: username,
                            dueAt,
                            status: 'PENDING'
                        }
                    });
                }
            }

            // 4. Update CRMLead client status and overall status
            await tx.cRMLead.update({
                where: { id: leadId },
                data: { clientStatus: status }
            });

            // Log CRM Audit Log
            await tx.cRMAuditLog.create({
                data: {
                    performedBy: username,
                    action: 'CLIENT_COMMUNICATION_LOGGED',
                    entityType: 'CRMLead',
                    entityId: leadId,
                    previousValue: currentLead.clientStatus,
                    newValue: status
                }
            });
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Failed to log communication:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
