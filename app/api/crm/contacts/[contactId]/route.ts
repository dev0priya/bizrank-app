import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function PATCH(
    request: Request,
    context: { params: Promise<{ contactId: string }> }
) {
    const params = await context.params;
    const contactId = parseInt(params.contactId);

    if (isNaN(contactId)) {
        return NextResponse.json({ error: 'Invalid Contact ID' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { name, role, phone, email, whatsapp, preferredContactMethod, isPrimary } = body;

        // Fetch current contact to obtain parent lead ID
        const currentContact = await prisma.contact.findUnique({
            where: { id: contactId }
        });

        if (!currentContact) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }

        const updateData: any = {};
        if (name !== undefined) {
            if (!name || name.trim() === '') {
                return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
            }
            updateData.name = name.trim();
        }
        if (role !== undefined) updateData.role = role || null;
        if (phone !== undefined) updateData.phone = phone || null;
        if (email !== undefined) updateData.email = email || null;
        if (whatsapp !== undefined) updateData.whatsapp = whatsapp || null;
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

        if (preferredContactMethod !== undefined) {
            if (preferredContactMethod !== null && !['EMAIL', 'PHONE', 'WHATSAPP'].includes(preferredContactMethod)) {
                return NextResponse.json({ error: 'Preferred contact method must be EMAIL, PHONE or WHATSAPP' }, { status: 400 });
            }
            updateData.preferredContactMethod = preferredContactMethod || null;
        }

        let updatedContact = currentContact;

        if (isPrimary !== undefined) {
            updateData.isPrimary = !!isPrimary;

            updatedContact = await prisma.$transaction(async (tx) => {
                if (isPrimary === true) {
                    // Reset all other contacts for the parent lead
                    await tx.contact.updateMany({
                        where: { crmLeadId: currentContact.crmLeadId, id: { not: contactId }, isPrimary: true },
                        data: { isPrimary: false }
                    });
                }
                
                return await tx.contact.update({
                    where: { id: contactId },
                    data: updateData
                });
            });
        } else {
            updatedContact = await prisma.contact.update({
                where: { id: contactId },
                data: updateData
            });
        }

        // Log this action to CRMAuditLog
        await prisma.cRMAuditLog.create({
            data: {
                performedBy: 'Admin',
                action: 'CONTACT_UPDATED',
                entityType: 'CRMLead',
                entityId: currentContact.crmLeadId,
                newValue: `Contact "${updatedContact.name}" updated`
            }
        });

        return NextResponse.json(updatedContact);
    } catch (error: any) {
        console.error('Failed to update contact:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    context: { params: Promise<{ contactId: string }> }
) {
    const params = await context.params;
    const contactId = parseInt(params.contactId);

    if (isNaN(contactId)) {
        return NextResponse.json({ error: 'Invalid Contact ID' }, { status: 400 });
    }

    try {
        const currentContact = await prisma.contact.findUnique({
            where: { id: contactId }
        });

        if (!currentContact) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }

        await prisma.contact.delete({
            where: { id: contactId }
        });

        // Log this action to CRMAuditLog
        await prisma.cRMAuditLog.create({
            data: {
                performedBy: 'Admin',
                action: 'CONTACT_DELETED',
                entityType: 'CRMLead',
                entityId: currentContact.crmLeadId,
                newValue: `Contact "${currentContact.name}" deleted`
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Failed to delete contact:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
