import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const history = await prisma.discoverySearchHistory.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        return NextResponse.json(history);
    } catch (error: any) {
        console.error('Failed to get search history:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        await prisma.discoverySearchHistory.deleteMany({});
        return NextResponse.json({ success: true, message: 'Search history cleared successfully.' });
    } catch (error: any) {
        console.error('Failed to clear search history:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
