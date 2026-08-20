import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const tags = await prisma.tag.findMany({
            include: {
                _count: {
                    select: { leads: true }
                }
            },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(tags);
    } catch (error: any) {
        console.error('Failed to get tags:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name } = body;

        if (!name || name.trim() === '') {
            return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
        }

        const tag = await prisma.tag.upsert({
            where: { name: name.trim().toUpperCase() },
            update: {},
            create: { name: name.trim().toUpperCase() }
        });

        return NextResponse.json(tag, { status: 201 });
    } catch (error: any) {
        console.error('Failed to create tag:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const url = new URL(request.url);
        const idStr = url.searchParams.get('id');
        if (!idStr) {
            return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });
        }

        await prisma.tag.delete({
            where: { id: parseInt(idStr) }
        });

        return NextResponse.json({ success: true, message: 'Tag deleted successfully.' });
    } catch (error: any) {
        console.error('Failed to delete tag:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
