import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { FollowUpStatus } from '@prisma/client';

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
        const { contactId, assignedTo, dueAt, reminderAt } = body;

        if (!dueAt) {
            return NextResponse.json({ error: 'Due date is required' }, { status: 400 });
        }

        const dueAtDate = new Date(dueAt);
        if (isNaN(dueAtDate.getTime())) {
            return NextResponse.json({ error: 'Invalid due date format' }, { status: 400 });
        }

        // Validate lead existence
        const lead = await prisma.cRMLead.findUnique({
            where: { id: leadId }
        });
        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // Validate contact belongs to lead
        let validContactId = null;
        if (contactId) {
            const parsedContactId = parseInt(contactId);
            if (!isNaN(parsedContactId)) {
                const contact = await prisma.contact.findFirst({
                    where: { id: parsedContactId, crmLeadId: leadId }
                });
                if (!contact) {
                    return NextResponse.json({ error: 'Associated Contact not found or does not belong to this lead' }, { status: 400 });
                }
                validContactId = parsedContactId;
            }
        }

        const reminderAtDate = reminderAt ? new Date(reminderAt) : null;
        if (reminderAtDate && isNaN(reminderAtDate.getTime())) {
            return NextResponse.json({ error: 'Invalid reminder date format' }, { status: 400 });
        }

        // Enforce transaction
        const followUp = await prisma.$transaction(async (tx) => {
            const newFU = await tx.followUp.create({
                data: {
                    crmLeadId: leadId,
                    contactId: validContactId,
                    assignedTo: assignedTo || 'Admin',
                    dueAt: dueAtDate,
                    status: FollowUpStatus.PENDING,
                    reminderAt: reminderAtDate
                },
                include: {
                    contact: true
                }
            });

            // Update parent CRMLead updatedAt
            await tx.cRMLead.update({
                where: { id: leadId },
                data: { updatedAt: new Date() }
            });

            // Write CRMAuditLog
            await tx.cRMAuditLog.create({
                data: {
                    performedBy: 'Admin',
                    action: 'FOLLOW_UP_SCHEDULED',
                    entityType: 'CRMLead',
                    entityId: leadId,
                    newValue: `Scheduled follow-up on ${dueAtDate.toLocaleDateString()} at ${dueAtDate.toLocaleTimeString()}`
                }
            });

            return newFU;
        });

        return NextResponse.json(followUp, { status: 201 });
    } catch (error: any) {
        console.error('Failed to schedule follow-up:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
