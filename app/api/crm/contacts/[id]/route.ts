import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const body = await request.json();
        const { name, role, phone, email, whatsapp, preferredContactMethod, isPrimary } = body;

        const existing = await prisma.contact.findUnique({
            where: { id }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }

        const contact = await prisma.$transaction(async (tx) => {
            if (isPrimary === true && !existing.isPrimary) {
                // Set all other contacts for this lead to isPrimary = false
                await tx.contact.updateMany({
                    where: { crmLeadId: existing.crmLeadId, isPrimary: true },
                    data: { isPrimary: false }
                });
            }

            const updated = await tx.contact.update({
                where: { id },
                data: {
                    name: name !== undefined ? name.trim() : undefined,
                    role: role !== undefined ? role : undefined,
                    phone: phone !== undefined ? phone : undefined,
                    email: email !== undefined ? email : undefined,
                    whatsapp: whatsapp !== undefined ? whatsapp : undefined,
                    preferredContactMethod: preferredContactMethod !== undefined ? preferredContactMethod : undefined,
                    isPrimary: isPrimary !== undefined ? !!isPrimary : undefined
                }
            });

            return updated;
        });

        return NextResponse.json(contact);
    } catch (error: any) {
        console.error('Failed to update contact:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        await prisma.contact.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: 'Contact deleted successfully.' });
    } catch (error: any) {
        console.error('Failed to delete contact:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
