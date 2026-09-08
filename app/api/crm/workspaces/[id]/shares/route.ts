import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { getAuthorizedUser } from '../../../../../../services/auth_middleware';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    const workspaceId = params.id;

    try {
        const shares = await prisma.workspaceShare.findMany({
            where: {
                OR: [
                    { sourceWorkspaceId: workspaceId },
                    { targetWorkspaceId: workspaceId }
                ]
            },
            include: {
                sourceWorkspace: true,
                targetWorkspace: true,
                sharedByUser: true,
                crmLead: {
                    include: { business: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(shares);
    } catch (error: any) {
        console.error('Failed to fetch workspace shares:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    const sourceWorkspaceId = params.id;

    try {
        const { username } = getAuthorizedUser(request);
        const body = await request.json();
        const { targetWorkspaceId, crmLeadId, status } = body;

        if (!targetWorkspaceId || !crmLeadId) {
            return NextResponse.json({ error: 'targetWorkspaceId and crmLeadId are required' }, { status: 400 });
        }

        let user = await prisma.user.findFirst({ where: { username } });
        if (!user) {
            user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        }

        const shareStatus = status || 'ACCEPTED';

        const share = await prisma.workspaceShare.upsert({
            where: {
                sourceWorkspaceId_targetWorkspaceId_crmLeadId: {
                    sourceWorkspaceId,
                    targetWorkspaceId,
                    crmLeadId: parseInt(crmLeadId)
                }
            },
            update: {
                status: shareStatus,
                updatedAt: new Date()
            },
            create: {
                sourceWorkspaceId,
                targetWorkspaceId,
                crmLeadId: parseInt(crmLeadId),
                sharedByUserId: user ? user.id : 'usr-admin-01',
                status: shareStatus,
                permissions: 'READ'
            },
            include: {
                sourceWorkspace: true,
                targetWorkspace: true,
                crmLead: { include: { business: true } }
            }
        });

        return NextResponse.json({ success: true, share });
    } catch (error: any) {
        console.error('Failed to update workspace share:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
