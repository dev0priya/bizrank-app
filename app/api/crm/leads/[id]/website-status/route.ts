import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { checkCRMAuthorization, getAuthorizedUser } from '../../../../../../services/auth_middleware';

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
        const { status, websiteUrl } = body;

        if (!status || !['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status. Must be ASSIGNED, IN_PROGRESS, or COMPLETED.' }, { status: 400 });
        }

        const currentLead = await prisma.cRMLead.findUnique({
            where: { id: leadId },
            include: { business: true }
        });

        if (!currentLead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        const { role, username } = getAuthorizedUser(request);
        
        // Developer permission check
        if ((role as string) === 'DEVELOPER') {
            const callingUser = await prisma.user.findUnique({
                where: { username }
            });
            if (!callingUser || currentLead.developerId !== callingUser.id) {
                return NextResponse.json({ error: 'Forbidden: You can only modify your own assigned website work.' }, { status: 403 });
            }
        }

        const updatedLead = await prisma.$transaction(async (tx) => {
            const dataToUpdate: any = { websiteStatus: status };
            if (status === 'COMPLETED') {
                if (!websiteUrl) {
                    throw new Error('Website URL is required when marking as completed.');
                }
                dataToUpdate.websiteUrl = websiteUrl;
                dataToUpdate.websiteCompletedAt = new Date();
            } else {
                // If moving back from Completed, we allow preserving or resetting URL, let's keep it but change status
            }

            const updated = await tx.cRMLead.update({
                where: { id: leadId },
                data: dataToUpdate,
                include: { business: true }
            });

            // If a websiteUrl is saved, sync it back to the Business website and website_exists/status
            if (websiteUrl) {
                await tx.business.update({
                    where: { id: currentLead.businessId },
                    data: {
                        website: websiteUrl,
                        website_exists: true,
                        website_status: 'WEBSITE_FOUND'
                    }
                });
            }

            // Log CRM Audit Log
            await tx.cRMAuditLog.create({
                data: {
                    performedBy: username || 'Developer',
                    action: 'WEBSITE_STATUS_UPDATED',
                    entityType: 'CRMLead',
                    entityId: leadId,
                    previousValue: currentLead.websiteStatus,
                    newValue: status
                }
            });

            // Log Lead Activity
            await tx.activity.create({
                data: {
                    crmLeadId: leadId,
                    type: 'OTHER',
                    summary: `Website Status: ${status}`,
                    details: `Website development status updated to ${status} by ${username || 'Developer'}.${websiteUrl ? ` Website URL: ${websiteUrl}` : ''}`,
                    performedBy: username || 'Developer'
                }
            });

            return updated;
        });

        return NextResponse.json({ success: true, lead: updatedLead });
    } catch (error: any) {
        console.error('Failed to update website status:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
