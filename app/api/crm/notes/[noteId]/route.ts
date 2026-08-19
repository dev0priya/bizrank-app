import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function PATCH(
    request: Request,
    context: { params: Promise<{ noteId: string }> }
) {
    const params = await context.params;
    const noteId = parseInt(params.noteId);

    if (isNaN(noteId)) {
        return NextResponse.json({ error: 'Invalid Note ID' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { content } = body;

        if (!content || content.trim() === '') {
            return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 });
        }

        const currentNote = await prisma.cRMNote.findUnique({
            where: { id: noteId }
        });

        if (!currentNote) {
            return NextResponse.json({ error: 'Note not found' }, { status: 404 });
        }

        const updatedNote = await prisma.cRMNote.update({
            where: { id: noteId },
            data: { content: content.trim() }
        });

        // Log this action to CRMAuditLog
        await prisma.cRMAuditLog.create({
            data: {
                performedBy: 'Admin',
                action: 'NOTE_UPDATED',
                entityType: 'CRMLead',
                entityId: currentNote.crmLeadId,
                newValue: 'Note content modified'
            }
        });

        return NextResponse.json(updatedNote);
    } catch (error: any) {
        console.error('Failed to update note:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    context: { params: Promise<{ noteId: string }> }
) {
    const params = await context.params;
    const noteId = parseInt(params.noteId);

    if (isNaN(noteId)) {
        return NextResponse.json({ error: 'Invalid Note ID' }, { status: 400 });
    }

    try {
        const currentNote = await prisma.cRMNote.findUnique({
            where: { id: noteId }
        });

        if (!currentNote) {
            return NextResponse.json({ error: 'Note not found' }, { status: 404 });
        }

        await prisma.cRMNote.delete({
            where: { id: noteId }
        });

        // Log this action to CRMAuditLog
        await prisma.cRMAuditLog.create({
            data: {
                performedBy: 'Admin',
                action: 'NOTE_DELETED',
                entityType: 'CRMLead',
                entityId: currentNote.crmLeadId,
                newValue: 'Note deleted'
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Failed to delete note:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
