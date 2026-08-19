import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { ActivityType } from '@prisma/client';

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    const leadId = parseInt(params.id);

    if (isNaN(leadId)) {
        return NextResponse.json({ error: 'Invalid Lead ID' }, { status: 400 });
    }

    try {
                const activities = await prisma.activity.findMany({
            where: { crmLeadId: leadId },
            include: { contact: true },
            orderBy: { occurredAt: 'desc' }
        });
        return NextResponse.json(activities);
    } catch (error: any) {
        console.error('Failed to get activities:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    const leadId = parseInt(params.id);

    if (isNaN(leadId)) {
        return NextResponse.json({ error: 'Invalid Lead ID' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { type, summary, details, outcome, occurredAt, performedBy, contactId } = body;

        if (!type) {
            return NextResponse.json({ error: 'Activity type is required' }, { status: 400 });
        }

        const validTypes = Object.values(ActivityType);
        if (!validTypes.includes(type as any)) {
            return NextResponse.json({ error: `Invalid activity type. Allowed: ${validTypes.join(', ')}` }, { status: 400 });
        }

        if (!summary || summary.trim() === '') {
            return NextResponse.json({ error: 'Summary is a required field' }, { status: 400 });
        }

        if (contactId) {
            const contact = await prisma.contact.findFirst({
                where: { id: parseInt(contactId), crmLeadId: leadId }
            });
            if (!contact) {
                return NextResponse.json({ error: 'Associated Contact not found or does not belong to this lead' }, { status: 400 });
            }
        }

        // Run transaction to create activity, update Lead's updatedAt, and create audit log
        const activity = await prisma.$transaction(async (tx) => {
            const newAct = await tx.activity.create({
                data: {
                    crmLeadId: leadId,
                    contactId: contactId ? parseInt(contactId) : null,
                    type: type as ActivityType,
                    summary: summary.trim(),
                    details: details || null,
                    outcome: outcome || null,
                    performedBy: performedBy || 'Admin',
                    occurredAt: occurredAt ? new Date(occurredAt) : new Date()
                },
                include: { contact: true }
            });

            // Update parent CRMLead updatedAt timestamp
            await tx.cRMLead.update({
                where: { id: leadId },
                data: { updatedAt: new Date() }
            });

            // Log this action to CRMAuditLog
            await tx.cRMAuditLog.create({
                data: {
                    performedBy: performedBy || 'Admin',
                    action: 'ACTIVITY_ADDED',
                    entityType: 'CRMLead',
                    entityId: leadId,
                    newValue: `Activity logged: ${type} - ${summary}`
                }
            });

            return newAct;
        });

        return NextResponse.json(activity, { status: 201 });
    } catch (error: any) {
        console.error('Failed to log activity:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
