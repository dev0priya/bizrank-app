import { NextResponse } from 'next/server';
import { prisma } from '../lib/prisma';

export interface AuthorizedUser {
    role: string;
    username: string;
    workspaceId: string;
}

export function getAuthorizedUser(request: Request): AuthorizedUser {
    const role = (request.headers.get('x-user-role') || 'ADMIN') as string;
    const username = request.headers.get('x-user-username') || 'admin@bizrank.com';
    const workspaceId = request.headers.get('x-workspace-id') || 'ws-main-01';
    return { role, username, workspaceId };
}

export async function checkCRMAuthorization(
    request: Request,
    requiredAction: 'read' | 'write',
    options?: {
        crmLeadId?: number;
        contactId?: number;
        noteId?: number;
        followUpId?: number;
        dealId?: number;
        leadIds?: number[];
    }
): Promise<{ authorized: boolean; errorResponse?: NextResponse }> {
    const { role, username } = getAuthorizedUser(request);

    // 1. Resolve crmLeadId from options if not explicitly provided
    let crmLeadId = options?.crmLeadId;
    if (!crmLeadId) {
        if (options?.contactId) {
            const contact = await prisma.contact.findUnique({ where: { id: options.contactId } });
            if (contact) crmLeadId = contact.crmLeadId;
        } else if (options?.noteId) {
            const note = await prisma.cRMNote.findUnique({ where: { id: options.noteId } });
            if (note) crmLeadId = note.crmLeadId;
        } else if (options?.followUpId) {
            const fu = await prisma.followUp.findUnique({ where: { id: options.followUpId } });
            if (fu) crmLeadId = fu.crmLeadId;
        } else if (options?.dealId) {
            const deal = await prisma.deal.findUnique({ where: { id: options.dealId } });
            if (deal) crmLeadId = deal.crmLeadId;
        }
    }

    // 2. Enforce Workspace Boundary Isolation across ALL roles
    const { workspaceId } = getAuthorizedUser(request);
    if (crmLeadId && workspaceId) {
        const ownedInWorkspace = await prisma.workspaceWebsite.findUnique({
            where: {
                workspaceId_crmLeadId: {
                    workspaceId,
                    crmLeadId
                }
            }
        });

        const sharedWithWorkspace = await prisma.workspaceShare.findFirst({
            where: {
                targetWorkspaceId: workspaceId,
                crmLeadId,
                status: 'ACCEPTED'
            }
        });

        const isLinkedToAnyWorkspace = await prisma.workspaceWebsite.findFirst({
            where: { crmLeadId }
        });

        if (isLinkedToAnyWorkspace && !ownedInWorkspace && !sharedWithWorkspace) {
            return {
                authorized: false,
                errorResponse: NextResponse.json({ error: 'Forbidden: Lead is private to another workspace' }, { status: 403 })
            };
        }
    }

    // 3. ADMIN and MANAGER have full access to workspace resources
    if (role === 'ADMIN' || role === 'MANAGER') {
        return { authorized: true };
    }

    // 4. VIEWER is strictly read-only
    if (requiredAction === 'write' && role === 'VIEWER') {
        return {
            authorized: false,
            errorResponse: NextResponse.json({ error: 'Forbidden: Read-only access' }, { status: 403 })
        };
    }

    // 4. SALES_AGENT restrictions
    if (role === 'SALES_AGENT') {
        // If query parameters or updates target multiple leads (bulk operations)
        if (options?.leadIds && options.leadIds.length > 0) {
            const leads = await prisma.cRMLead.findMany({
                where: { id: { in: options.leadIds } }
            });
            const unassigned = leads.some(l => l.assignedTo !== username);
            if (unassigned) {
                return {
                    authorized: false,
                    errorResponse: NextResponse.json({ error: 'Forbidden: Contains leads not assigned to you' }, { status: 403 })
                };
            }
        }

        // Single lead checks
        if (crmLeadId) {
            const lead = await prisma.cRMLead.findUnique({ where: { id: crmLeadId } });
            if (lead && lead.assignedTo !== username) {
                return {
                    authorized: false,
                    errorResponse: NextResponse.json({ error: 'Forbidden: Lead is not assigned to you' }, { status: 403 })
                };
            }
        }
    }

    return { authorized: true };
}
