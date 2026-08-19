import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { FollowUpStatus } from '@prisma/client';

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    const followUpId = parseInt(params.id);

    if (isNaN(followUpId)) {
        return NextResponse.json({ error: 'Invalid Follow-up ID' }, { status: 400 });
    }

    try {
        const followUp = await prisma.followUp.findUnique({
            where: { id: followUpId },
            include: {
                contact: true,
                crmLead: {
                    include: {
                        business: {
                            include: {
                                category: true,
                                city: true,
                                state: true
                            }
                        },
                        pipelineStage: true
                    }
                }
            }
        });

        if (!followUp) {
            return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 });
        }

        return NextResponse.json(followUp);
    } catch (error: any) {
        console.error('Failed to get follow-up details:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    const followUpId = parseInt(params.id);

    if (isNaN(followUpId)) {
        return NextResponse.json({ error: 'Invalid Follow-up ID' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { status, outcome, outcomeNotes, nextFollowUpDate, nextFollowUpTime, nextFollowUpReminder, dueAt, reason } = body;

        // Perform inside a database transaction to ensure safety
        const result = await prisma.$transaction(async (tx) => {
            const current = await tx.followUp.findUnique({
                where: { id: followUpId }
            });

            if (!current) {
                throw new Error('Follow-up not found');
            }

            if (status === 'COMPLETED') {
                // Idempotency check: Return immediately if already completed
                if (current.status === FollowUpStatus.COMPLETED) {
                    return current;
                }

                // Update current follow-up status
                const updatedFU = await tx.followUp.update({
                    where: { id: followUpId },
                    data: {
                        status: FollowUpStatus.COMPLETED,
                        completedAt: new Date(),
                        outcome: outcome || 'Follow-up completed'
                    }
                });

                // Create corresponding Activity in timeline
                await tx.activity.create({
                    data: {
                        crmLeadId: current.crmLeadId,
                        contactId: current.contactId,
                        type: 'CALL', // Default CRM interaction
                        summary: `Follow-up Completed: ${outcome || 'Done'}`,
                        details: outcomeNotes || 'Logged from follow-up completion form.',
                        outcome: outcome || 'COMPLETED',
                        performedBy: 'Admin',
                        occurredAt: new Date()
                    }
                });

                // Update parent CRMLead updatedAt
                await tx.cRMLead.update({
                    where: { id: current.crmLeadId },
                    data: { updatedAt: new Date() }
                });

                // Create CRMAuditLog
                await tx.cRMAuditLog.create({
                    data: {
                        performedBy: 'Admin',
                        action: 'FOLLOW_UP_COMPLETED',
                        entityType: 'CRMLead',
                        entityId: current.crmLeadId,
                        newValue: `Completed follow-up ID ${followUpId}. Outcome: ${outcome || 'Done'}`
                    }
                });

                // Create Next Follow-up (optional reschedule link)
                if (nextFollowUpDate) {
                    const nextDue = new Date(`${nextFollowUpDate}T${nextFollowUpTime || '09:00'}:00`);
                    if (!isNaN(nextDue.getTime())) {
                        let nextReminder = null;
                        if (nextFollowUpReminder && nextFollowUpReminder !== 'None') {
                            const minutes = parseInt(nextFollowUpReminder);
                            if (!isNaN(minutes)) {
                                nextReminder = new Date(nextDue.getTime() - minutes * 60 * 1000);
                            }
                        }

                        await tx.followUp.create({
                            data: {
                                crmLeadId: current.crmLeadId,
                                contactId: current.contactId,
                                assignedTo: current.assignedTo || 'Admin',
                                dueAt: nextDue,
                                status: FollowUpStatus.PENDING,
                                reminderAt: nextReminder
                            }
                        });

                        await tx.cRMAuditLog.create({
                            data: {
                                performedBy: 'Admin',
                                action: 'FOLLOW_UP_SCHEDULED',
                                entityType: 'CRMLead',
                                entityId: current.crmLeadId,
                                newValue: `Scheduled next follow-up on ${nextDue.toLocaleDateString()}`
                            }
                        });
                    }
                }

                return updatedFU;
            } else if (status === 'CANCELLED') {
                if (current.status === FollowUpStatus.CANCELLED) {
                    return current;
                }

                const updatedFU = await tx.followUp.update({
                    where: { id: followUpId },
                    data: { status: FollowUpStatus.CANCELLED }
                });

                await tx.cRMAuditLog.create({
                    data: {
                        performedBy: 'Admin',
                        action: 'FOLLOW_UP_CANCELLED',
                        entityType: 'CRMLead',
                        entityId: current.crmLeadId,
                        newValue: `Cancelled follow-up ID ${followUpId}. Reason: ${reason || 'Not specified'}`
                    }
                });

                return updatedFU;
            } else if (dueAt) {
                // Rescheduling flow
                const nextDue = new Date(dueAt);
                if (isNaN(nextDue.getTime())) {
                    throw new Error('Invalid rescheduling date format');
                }

                const updatedFU = await tx.followUp.update({
                    where: { id: followUpId },
                    data: { dueAt: nextDue }
                });

                await tx.cRMAuditLog.create({
                    data: {
                        performedBy: 'Admin',
                        action: 'FOLLOW_UP_RESCHEDULED',
                        entityType: 'CRMLead',
                        entityId: current.crmLeadId,
                        newValue: `Rescheduled follow-up ID ${followUpId} to ${nextDue.toLocaleDateString()} ${nextDue.toLocaleTimeString()}`
                    }
                });

                return updatedFU;
            }

            return current;
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Failed to update follow-up:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    const followUpId = parseInt(params.id);

    if (isNaN(followUpId)) {
        return NextResponse.json({ error: 'Invalid Follow-up ID' }, { status: 400 });
    }

    try {
        const followUp = await prisma.followUp.findUnique({
            where: { id: followUpId }
        });

        if (!followUp) {
            return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.followUp.delete({
                where: { id: followUpId }
            });

            await tx.cRMAuditLog.create({
                data: {
                    performedBy: 'Admin',
                    action: 'FOLLOW_UP_DELETED',
                    entityType: 'CRMLead',
                    entityId: followUp.crmLeadId,
                    newValue: `Deleted follow-up ID ${followUpId} due on ${followUp.dueAt.toLocaleDateString()}`
                }
            });
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Failed to delete follow-up:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
