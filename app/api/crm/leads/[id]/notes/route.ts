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
        const notes = await prisma.cRMNote.findMany({
            where: { crmLeadId: leadId },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(notes);
    } catch (error: any) {
        console.error('Failed to get notes:', error);
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
        const { content, author } = body;

        if (!content || content.trim() === '') {
            return NextResponse.json({ error: 'Content is a required field' }, { status: 400 });
        }

        const note = await prisma.cRMNote.create({
            data: {
                crmLeadId: leadId,
                content: content.trim(),
                author: author || 'Admin'
            }
        });

        // Log this action to CRMAuditLog
        await prisma.cRMAuditLog.create({
            data: {
                performedBy: author || 'Admin',
                action: 'NOTE_ADDED',
                entityType: 'CRMLead',
                entityId: leadId,
                newValue: `Note added by ${note.author}`
            }
        });

        return NextResponse.json(note, { status: 201 });
    } catch (error: any) {
        console.error('Failed to create note:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
