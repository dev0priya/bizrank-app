import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { checkCRMAuthorization, getAuthorizedUser } from '../../../../../../services/auth_middleware';

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
        const currentLead = await prisma.cRMLead.findUnique({
            where: { id: leadId },
            include: { business: true, contacts: true }
        });

        if (!currentLead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // Validate websiteStatus is COMPLETED
        if (currentLead.websiteStatus !== 'COMPLETED') {
            return NextResponse.json({ error: 'Cannot share with Swati: Website is not completed.' }, { status: 400 });
        }

        // Validate website URL exists
        const websiteUrl = currentLead.websiteUrl || currentLead.business.website;
        if (!websiteUrl) {
            return NextResponse.json({ error: 'Cannot share with Swati: Website URL is missing.' }, { status: 400 });
        }

        // Duplicate protection: check if already handed over
        if (currentLead.handoffStatus === 'HANDED_OVER') {
            return NextResponse.json({ success: true, message: 'Already shared with Swati', lead: currentLead });
        }

        // Find Swati Chaudhary's user account
        const swatiUser = await prisma.user.findFirst({
            where: { role: 'COMMUNICATION' }
        });

        if (!swatiUser) {
            return NextResponse.json({ error: 'Communication Agent account (Swati Chaudhary) not found.' }, { status: 500 });
        }

        const { username } = getAuthorizedUser(request);

        const updatedLead = await prisma.$transaction(async (tx) => {
            const updated = await tx.cRMLead.update({
                where: { id: leadId },
                data: {
                    handoffStatus: 'HANDED_OVER',
                    handoffDate: new Date(),
                    swatiId: swatiUser.id,
                    clientStatus: 'New' // Initialized to New to match Swati workspace filters
                },
                include: { business: true, swati: true, developer: true }
            });

            // Log CRM Audit Log
            await tx.cRMAuditLog.create({
                data: {
                    performedBy: username || 'Developer',
                    action: 'WEBSITE_SHARED_WITH_SWATI',
                    entityType: 'CRMLead',
                    entityId: leadId,
                    previousValue: currentLead.handoffStatus,
                    newValue: 'HANDED_OVER'
                }
            });

            // Log Lead Activity
            await tx.activity.create({
                data: {
                    crmLeadId: leadId,
                    type: 'OTHER',
                    summary: 'Shared with Swati',
                    details: `Website shared with Swati Chaudhary for client communication by ${username || 'Developer'}.`,
                    performedBy: username || 'Developer'
                }
            });

            return updated;
        });

        return NextResponse.json({ success: true, lead: updatedLead });
    } catch (error: any) {
        console.error('Failed to perform handoff to Swati:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
