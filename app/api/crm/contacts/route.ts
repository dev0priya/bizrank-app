import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const contacts = await prisma.contact.findMany({
            include: {
                crmLead: {
                    include: {
                        business: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(contacts);
    } catch (error: any) {
        console.error('Failed to fetch global contacts:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { crmLeadId, name, role, phone, email, whatsapp, preferredContactMethod, isPrimary } = body;

        if (!crmLeadId || !name) {
            return NextResponse.json({ error: 'Lead ID and Contact Name are required' }, { status: 400 });
        }

        const leadId = parseInt(crmLeadId);

        // Enforce primary contact uniqueness using a database transaction
        const contact = await prisma.$transaction(async (tx) => {
            if (isPrimary === true) {
                // Set all other contacts for this lead to isPrimary = false
                await tx.contact.updateMany({
                    where: { crmLeadId: leadId, isPrimary: true },
                    data: { isPrimary: false }
                });
            }

            const newContact = await tx.contact.create({
                data: {
                    crmLeadId: leadId,
                    name: name.trim(),
                    role: role || null,
                    phone: phone || null,
                    email: email || null,
                    whatsapp: whatsapp || null,
                    preferredContactMethod: preferredContactMethod || null,
                    isPrimary: !!isPrimary
                }
            });

            return newContact;
        });

        // Log this action to CRMAuditLog
        await prisma.cRMAuditLog.create({
            data: {
                performedBy: 'Admin',
                action: 'CONTACT_ADDED',
                entityType: 'CRMLead',
                entityId: leadId,
                newValue: `Contact "${contact.name}" added as ${contact.isPrimary ? 'Primary' : 'Secondary'}`
            }
        });

        return NextResponse.json(contact, { status: 201 });
    } catch (error: any) {
        console.error('Failed to create global contact:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
