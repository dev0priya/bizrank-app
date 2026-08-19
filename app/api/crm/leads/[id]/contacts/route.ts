import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';

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
        const contacts = await prisma.contact.findMany({
            where: { crmLeadId: leadId },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(contacts);
    } catch (error: any) {
        console.error('Failed to get contacts:', error);
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
        const { name, role, phone, email, whatsapp, preferredContactMethod, isPrimary } = body;

        if (!name || name.trim() === '') {
            return NextResponse.json({ error: 'Name is a required field' }, { status: 400 });
        }

        // Validate preferredContactMethod if provided
        if (preferredContactMethod && !['EMAIL', 'PHONE', 'WHATSAPP'].includes(preferredContactMethod)) {
            return NextResponse.json({ error: 'Preferred contact method must be EMAIL, PHONE or WHATSAPP' }, { status: 400 });
        }

        // Format validations
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 });
        }

        if (phone && !/^\+?[0-9\s\-()]+$/.test(phone)) {
            return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
        }

        if (whatsapp && !/^\+?[0-9\s\-()]+$/.test(whatsapp)) {
            return NextResponse.json({ error: 'Invalid WhatsApp format' }, { status: 400 });
        }

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
        console.error('Failed to create contact:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
