import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
    try {
        // 1. Lead Metrics
        const totalLeads = await prisma.cRMLead.count();
        const newLeads = await prisma.cRMLead.count({
            where: { pipelineStage: { name: 'New' } }
        });
        
        // Hot leads are priority 'A' or have a tag named 'HOT'
        const hotLeads = await prisma.cRMLead.count({
            where: {
                OR: [
                    { priority: 'A' },
                    { tags: { any: { tag: { name: 'HOT' } } } }
                ]
            }
        });

        // 2. Follow-Up Metrics
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const todayFollowUps = await prisma.followUp.count({
            where: {
                status: 'PENDING',
                dueAt: {
                    gte: todayStart,
                    lte: todayEnd
                }
            }
        });

        const overdueFollowUps = await prisma.followUp.count({
            where: {
                status: 'PENDING',
                dueAt: {
                    lt: todayStart
                }
            }
        });

        // 3. Deal & Revenue Metrics
        const openDealsAggregate = await prisma.deal.aggregate({
            where: { status: 'OPEN' },
            _sum: { value: true },
            _count: { id: true }
        });
        const openPipelineValue = openDealsAggregate._sum.value || 0;
        const openDealsCount = openDealsAggregate._count.id;

        const wonDealsAggregate = await prisma.deal.aggregate({
            where: { status: 'WON' },
            _sum: { value: true },
            _count: { id: true }
        });
        const wonRevenue = wonDealsAggregate._sum.value || 0;
        const wonDealsCount = wonDealsAggregate._count.id;

        const lostDealsAggregate = await prisma.deal.aggregate({
            where: { status: 'LOST' },
            _sum: { value: true },
            _count: { id: true }
        });
        const lostValue = lostDealsAggregate._sum.value || 0;
        const lostDealsCount = lostDealsAggregate._count.id;

        const totalClosedDeals = wonDealsCount + lostDealsCount;
        const conversionRate = totalClosedDeals > 0 ? (wonDealsCount / totalClosedDeals) * 100 : 0;
        const averageDealValue = wonDealsCount > 0 ? wonRevenue / wonDealsCount : 0;

        // 4. Chart: Leads by Stage
        const stages = await prisma.pipelineStage.findMany({
            orderBy: { order: 'asc' },
            include: {
                _count: {
                    select: { leads: true }
                }
            }
        });
        const leadsByStage = stages.map(s => ({
            stageId: s.id,
            stageName: s.name,
            count: s._count.leads
        }));

        // 5. Chart: Pipeline Value by Stage of open deals
        const openDeals = await prisma.deal.findMany({
            where: { status: 'OPEN' },
            include: {
                crmLead: {
                    include: { pipelineStage: true }
                }
            }
        });
        
        const pipelineValueByStageMap = new Map<string, number>();
        stages.forEach(s => pipelineValueByStageMap.set(s.name, 0));
        openDeals.forEach(d => {
            if (d.crmLead?.pipelineStage?.name) {
                const sName = d.crmLead.pipelineStage.name;
                pipelineValueByStageMap.set(sName, (pipelineValueByStageMap.get(sName) || 0) + d.value);
            }
        });
        const pipelineValueByStage = Array.from(pipelineValueByStageMap.entries()).map(([stageName, value]) => ({
            stageName,
            value
        }));

        // 6. Chart: Sales Activities by Type
        const activityGroup = await prisma.activity.groupBy({
            by: ['type'],
            _count: { id: true }
        });
        const activitiesByType = activityGroup.map(g => ({
            type: g.type,
            count: g._count.id
        }));

        return NextResponse.json({
            metrics: {
                totalLeads,
                newLeads,
                hotLeads,
                todayFollowUps,
                overdueFollowUps,
                openPipelineValue,
                openDealsCount,
                wonRevenue,
                wonDealsCount,
                lostValue,
                lostDealsCount,
                conversionRate,
                averageDealValue
            },
            charts: {
                leadsByStage,
                pipelineValueByStage,
                activitiesByType
            }
        });
    } catch (error: any) {
        console.error('Failed to load dashboard data:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
