import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getAuthorizedUser } from '../../../../services/auth_middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { username } = getAuthorizedUser(request);

        const user = await prisma.user.findFirst({
            where: { username }
        });

        if (!user) {
            // Return default seeded workspaces fallback
            const allWorkspaces = await prisma.workspace.findMany({
                include: { owner: true }
            });
            return NextResponse.json(allWorkspaces);
        }

        // Fetch workspaces owned by user or where user is a member
        const workspaces = await prisma.workspace.findMany({
            where: {
                OR: [
                    { ownerId: user.id },
                    { members: { some: { userId: user.id, status: 'ACTIVE' } } }
                ]
            },
            include: {
                owner: true,
                members: {
                    include: { user: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(workspaces);
    } catch (error: any) {
        console.error('Failed to fetch workspaces:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { username } = getAuthorizedUser(request);
        const body = await request.json();
        const { name } = body;

        if (!name || typeof name !== 'string') {
            return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
        }

        let user = await prisma.user.findFirst({ where: { username } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    username,
                    name: username.split('@')[0],
                    role: 'ADMIN'
                }
            });
        }

        const newWorkspace = await prisma.workspace.create({
            data: {
                name,
                ownerId: user.id,
                members: {
                    create: {
                        userId: user.id,
                        role: 'OWNER',
                        status: 'ACTIVE'
                    }
                }
            },
            include: { owner: true }
        });

        return NextResponse.json({ success: true, workspace: newWorkspace });
    } catch (error: any) {
        console.error('Failed to create workspace:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
