import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const dealId = parseInt(id);
        if (isNaN(dealId)) {
            return NextResponse.json({ error: 'Invalid Deal ID' }, { status: 400 });
        }

        const deal = await prisma.deal.findUnique({
            where: { id: dealId },
            include: {
                crmLead: {
                    include: {
                        business: {
                            include: {
                                category: true,
                                city: true,
                                state: true
                            }
                        },
                        pipelineStage: true,
                        contacts: true,
                        activities: {
                            orderBy: { createdAt: 'desc' }
                        }
                    }
                }
            }
        });

        if (!deal) {
            return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
        }

        // Fetch Audit logs
        const auditLogs = await prisma.cRMAuditLog.findMany({
            where: {
                entityId: deal.id,
                entityType: 'Deal'
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            deal,
            auditLogs
        });
    } catch (error: any) {
        console.error('Failed to retrieve deal:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const dealId = parseInt(id);
        if (isNaN(dealId)) {
            return NextResponse.json({ error: 'Invalid Deal ID' }, { status: 400 });
        }

        const body = await request.json();
        const { name, value, currency, expectedCloseDate, description } = body;

        // Fetch current deal state
        const currentDeal = await prisma.deal.findUnique({
            where: { id: dealId }
        });

        if (!currentDeal) {
            return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
        }

        const updateData: any = {};
        const auditLogsToCreate: any[] = [];

        // Validate & process name
        if (name !== undefined) {
            const trimmedName = name?.trim();
            if (!trimmedName) {
                return NextResponse.json({ error: 'Deal name cannot be empty' }, { status: 400 });
            }
            if (currentDeal.name !== trimmedName) {
                updateData.name = trimmedName;
                auditLogsToCreate.push({
                    performedBy: 'System',
                    action: 'NAME_CHANGED',
                    entityType: 'Deal',
                    entityId: dealId,
                    previousValue: currentDeal.name || 'None',
                    newValue: trimmedName
                });
            }
        }

        // Validate & process description
        if (description !== undefined) {
            const newDesc = description || null;
            if (currentDeal.description !== newDesc) {
                updateData.description = newDesc;
                auditLogsToCreate.push({
                    performedBy: 'System',
                    action: 'DESCRIPTION_CHANGED',
                    entityType: 'Deal',
                    entityId: dealId,
                    previousValue: currentDeal.description || 'None',
                    newValue: newDesc || 'None'
                });
            }
        }

        // Validate & process value
        if (value !== undefined) {
            const parsedVal = parseFloat(value);
            if (isNaN(parsedVal) || parsedVal < 0) {
                return NextResponse.json({ error: 'Value must be a non-negative number' }, { status: 400 });
            }
            if (currentDeal.value !== parsedVal) {
                updateData.value = parsedVal;
                auditLogsToCreate.push({
                    performedBy: 'System',
                    action: 'VALUE_CHANGED',
                    entityType: 'Deal',
                    entityId: dealId,
                    previousValue: currentDeal.value.toString(),
                    newValue: parsedVal.toString()
                });
            }
        }

        // Validate & process currency
        if (currency !== undefined) {
            const newCurr = currency?.trim() || 'INR';
            if (currentDeal.currency !== newCurr) {
                updateData.currency = newCurr;
                auditLogsToCreate.push({
                    performedBy: 'System',
                    action: 'CURRENCY_CHANGED',
                    entityType: 'Deal',
                    entityId: dealId,
                    previousValue: currentDeal.currency,
                    newValue: newCurr
                });
            }
        }

        // Validate & process expectedCloseDate
        if (expectedCloseDate !== undefined) {
            const newDate = expectedCloseDate ? new Date(expectedCloseDate) : null;
            if (newDate && isNaN(newDate.getTime())) {
                return NextResponse.json({ error: 'Invalid expected close date' }, { status: 400 });
            }

            const currentMs = currentDeal.expectedCloseDate ? new Date(currentDeal.expectedCloseDate).getTime() : 0;
            const newMs = newDate ? newDate.getTime() : 0;

            if (currentMs !== newMs) {
                updateData.expectedCloseDate = newDate;
                auditLogsToCreate.push({
                    performedBy: 'System',
                    action: 'CLOSE_DATE_CHANGED',
                    entityType: 'Deal',
                    entityId: dealId,
                    previousValue: currentDeal.expectedCloseDate ? new Date(currentDeal.expectedCloseDate).toLocaleDateString() : 'None',
                    newValue: newDate ? newDate.toLocaleDateString() : 'None'
                });
            }
        }

        // Perform updates inside a transaction
        let updatedDeal = currentDeal;
        if (Object.keys(updateData).length > 0) {
            updatedDeal = await prisma.$transaction(async (tx) => {
                const updated = await tx.deal.update({
                    where: { id: dealId },
                    data: updateData
                });

                for (const log of auditLogsToCreate) {
                    await tx.cRMAuditLog.create({
                        data: log
                    });
                }

                return updated;
            });
        }

        return NextResponse.json({ success: true, deal: updatedDeal });
    } catch (error: any) {
        console.error('Failed to update deal:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
