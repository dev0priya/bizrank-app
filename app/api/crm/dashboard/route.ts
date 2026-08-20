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
                    { tags: { some: { tag: { name: 'HOT' } } } }
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

        // 7. Connected dashboard worklists. These are intentionally derived from
        // the discovery and CRM records rather than a separate reporting store.
        const [businessesDiscovered, qualifiedBusinesses, websiteOpportunities] = await Promise.all([
            prisma.business.count(),
            prisma.business.count({ where: { discovery_status: 'Qualified' } }),
            prisma.business.count({
                where: {
                    opportunity_eligible: true,
                    opportunity_level: { in: ['HIGH', 'MEDIUM'] }
                }
            })
        ]);

        const stageCount = (match: string) =>
            leadsByStage.find(stage => stage.stageName.toLowerCase().includes(match))?.count || 0;

        const salesFunnel = [
            { label: 'Businesses Discovered', count: businessesDiscovered },
            { label: 'Qualified Businesses', count: qualifiedBusinesses },
            { label: 'Added to CRM', count: totalLeads },
            { label: 'Contacted', count: stageCount('contacted') },
            { label: 'Interested', count: stageCount('interested') },
            { label: 'Meetings', count: stageCount('meeting') },
            { label: 'Proposals', count: stageCount('proposal') },
            { label: 'Won', count: wonDealsCount }
        ];

        const pipelineSummary = stages.map(stage => ({
            stageId: stage.id,
            stageName: stage.name,
            leadCount: stage._count.leads,
            pipelineValue: pipelineValueByStageMap.get(stage.name) || 0
        }));

        const followUpWhere = {
            status: 'PENDING' as const,
            dueAt: { lte: todayEnd }
        };
        const [todayFollowUpsList, hotLeadsList, recentActivities] = await Promise.all([
            prisma.followUp.findMany({
                where: followUpWhere,
                orderBy: { dueAt: 'asc' },
                take: 10,
                include: {
                    crmLead: { include: { business: true } },
                    contact: true
                }
            }),
            prisma.cRMLead.findMany({
                where: {
                    OR: [
                        { priority: 'A' },
                        { tags: { some: { tag: { name: 'HOT' } } } }
                    ]
                },
                orderBy: [{ leadScore: 'desc' }, { updatedAt: 'desc' }],
                take: 10,
                include: {
                    business: { include: { category: true, city: true, state: true } },
                    followUps: {
                        where: { status: 'PENDING' },
                        orderBy: { dueAt: 'asc' },
                        take: 1
                    }
                }
            }),
            prisma.activity.findMany({
                orderBy: { occurredAt: 'desc' },
                take: 10,
                include: {
                    crmLead: { include: { business: true } },
                    contact: true
                }
            })
        ]);

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
                averageDealValue,
                businessesDiscovered,
                qualifiedBusinesses,
                websiteOpportunities,
                crmAdded: totalLeads,
                discoveryConversionRate: businessesDiscovered > 0 ? (totalLeads / businessesDiscovered) * 100 : 0
            },
            charts: {
                leadsByStage,
                pipelineValueByStage,
                activitiesByType
            },
            salesFunnel,
            pipelineSummary,
            todayFollowUps: todayFollowUpsList.map(item => ({
                id: item.id,
                dueAt: item.dueAt,
                leadId: item.crmLeadId,
                businessName: item.crmLead.business.business_name,
                contactName: item.contact?.name || null,
                owner: item.assignedTo || item.crmLead.assignedTo || null,
                status: item.dueAt < todayStart ? 'OVERDUE' : 'DUE_TODAY'
            })),
            hotLeads: hotLeadsList.map(lead => ({
                id: lead.id,
                businessName: lead.business.business_name,
                location: [lead.business.city?.name, lead.business.state?.name].filter(Boolean).join(', ') || null,
                category: lead.business.category?.displayName || lead.business.category?.name || lead.business.google_category || null,
                leadScore: lead.leadScore,
                websiteStatus: lead.business.website_status,
                owner: lead.assignedTo || null,
                nextFollowUp: lead.followUps[0]?.dueAt || null
            })),
            recentActivities: recentActivities.map(activity => ({
                id: activity.id,
                type: activity.type,
                summary: activity.summary,
                occurredAt: activity.occurredAt,
                leadId: activity.crmLeadId,
                businessName: activity.crmLead.business.business_name,
                contactName: activity.contact?.name || null,
                owner: activity.performedBy
            }))
        });
    } catch (error: any) {
        console.error('Failed to load dashboard data:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
