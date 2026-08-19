import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const leadId = parseInt(id);
        if (isNaN(leadId)) {
            return NextResponse.json({ error: 'Invalid Lead ID' }, { status: 400 });
        }

        const body = await request.json();
        const { name, value, currency, expectedCloseDate, description } = body;

        // 1. Validate CRM Lead existence
        const lead = await prisma.cRMLead.findUnique({
            where: { id: leadId }
        });

        if (!lead) {
            return NextResponse.json({ error: 'CRM Lead not found' }, { status: 404 });
        }

        // 2. Validate Deal name
        const dealName = name?.trim();
        if (!dealName) {
            return NextResponse.json({ error: 'Deal name is required' }, { status: 400 });
        }

        // 3. Validate Deal value
        const parsedValue = parseFloat(value);
        if (isNaN(parsedValue) || parsedValue < 0) {
            return NextResponse.json({ error: 'Deal value must be a non-negative number' }, { status: 400 });
        }

        // 4. Enforce One Active Deal Rule
        const activeDeal = await prisma.deal.findFirst({
            where: {
                crmLeadId: leadId,
                status: 'OPEN'
            }
        });

        if (activeDeal) {
            return NextResponse.json({
                error: 'This lead already has an active OPEN deal. Please close or resolve the active deal first.'
            }, { status: 400 });
        }

        // 5. Build close date if provided
        let closeDate = null;
        if (expectedCloseDate) {
            closeDate = new Date(expectedCloseDate);
            if (isNaN(closeDate.getTime())) {
                return NextResponse.json({ error: 'Invalid expected close date' }, { status: 400 });
            }
        }

        // 6. Create Deal inside a transaction
        const newDeal = await prisma.$transaction(async (tx) => {
            const created = await tx.deal.create({
                data: {
                    crmLeadId: leadId,
                    name: dealName,
                    description: description || null,
                    value: parsedValue,
                    currency: currency || 'INR',
                    expectedCloseDate: closeDate,
                    status: 'OPEN'
                }
            });

            // Write CRMAuditLog entry
            await tx.cRMAuditLog.create({
                data: {
                    performedBy: 'System',
                    action: 'DEAL_CREATED',
                    entityType: 'Deal',
                    entityId: created.id,
                    newValue: `Created deal "${dealName}" with value ${currency || 'INR'} ${parsedValue}`
                }
            });

            return created;
        });

        return NextResponse.json({ success: true, deal: newDeal }, { status: 201 });
    } catch (error: any) {
        console.error('Failed to create deal:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
