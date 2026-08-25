import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            where: {
                role: {
                    in: ['DEVELOPER', 'COMMUNICATION']
                }
            },
            orderBy: {
                name: 'asc'
            }
        });
        return NextResponse.json(users);
    } catch (error: any) {
        console.error('Failed to retrieve users:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
