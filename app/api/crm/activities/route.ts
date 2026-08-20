import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const activities = await prisma.activity.findMany({
            include: {
                crmLead: {
                    include: {
                        business: true
                    }
                },
                contact: true
            },
            orderBy: { occurredAt: 'desc' },
            take: 100
        });
        return NextResponse.json(activities);
    } catch (error: any) {
        console.error('Failed to fetch global activities:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
