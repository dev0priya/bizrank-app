import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0,0,0,0);
        const endOfToday = new Date(now);
        endOfToday.setHours(23,59,59,999);

        const [
            overdueFollowUps,
            todayFollowUps,
            hotLeads,
            totalLeads
        ] = await Promise.all([
            prisma.followUp.count({
                where: {
                    status: 'PENDING',
                    dueAt: { lt: now }
                }
            }),
            prisma.followUp.count({
                where: {
                    status: 'PENDING',
                    dueAt: { gte: startOfToday, lte: endOfToday }
                }
            }),
            prisma.cRMLead.count({
                where: {
                    OR: [
                        { priority: 'A' },
                        { tags: { some: { tag: { name: 'HOT' } } } }
                    ]
                }
            }),
            prisma.cRMLead.count()
        ]);

        return NextResponse.json({
            overdueFollowUps,
            todayFollowUps,
            hotLeads,
            totalLeads
        });
    } catch (error: any) {
        console.error('Failed to calculate sidebar badges:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
