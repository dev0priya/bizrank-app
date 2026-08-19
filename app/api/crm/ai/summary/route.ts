import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { checkCRMAuthorization } from '../../../../../services/auth_middleware';

export async function GET(request: Request) {
    try {
        const auth = await checkCRMAuthorization(request, 'read');
        if (!auth.authorized) return auth.errorResponse;

        const totalLeads = await prisma.cRMLead.count();
        const priorityALeads = await prisma.cRMLead.count({ where: { priority: 'A' } });
        
        const wonStage = await prisma.pipelineStage.findFirst({ where: { name: 'Closed Won' } });
        const wonLeadsCount = wonStage ? await prisma.cRMLead.count({ where: { pipelineStageId: wonStage.id } }) : 0;
        
        const wonDeals = await prisma.deal.aggregate({
            where: { status: 'WON' },
            _sum: { value: true }
        });
        const totalRevenue = wonDeals._sum.value || 0;

        const pendingFollowUps = await prisma.followUp.count({ where: { status: 'PENDING' } });
        const overdueFollowUps = await prisma.followUp.count({
            where: {
                status: 'PENDING',
                dueAt: { lt: new Date() }
            }
        });

        const conversionRate = totalLeads > 0 ? ((wonLeadsCount / totalLeads) * 100).toFixed(1) : '0';

        const summaryMarkdown = `
### 📊 AI CRM Handoff Summary

Currently, there are **${totalLeads}** active sales leads managed in the CRM workspace.
* **Conversion Rate**: **${conversionRate}%** of leads have been successfully marked as **Closed Won**.
* **Total Revenue**: **$${totalRevenue.toLocaleString()}** generated from successfully closed deals.
* **Stale Warning**: There are **${priorityALeads}** hot (Priority A) leads requiring immediate attention.
* **Follow-Ups Checklist**: **${pendingFollowUps}** tasks are pending, out of which **${overdueFollowUps}** are overdue.

**Hottest Pending Opportunity:**
Pitch services to high-priority leads with missing website presence to unlock immediate web development deals.
        `.trim();

        return NextResponse.json({
            summary: summaryMarkdown,
            stats: {
                totalLeads,
                priorityALeads,
                totalRevenue,
                conversionRate,
                pendingFollowUps,
                overdueFollowUps
            }
        });
    } catch (error: any) {
        console.error('AI summary calculation failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
