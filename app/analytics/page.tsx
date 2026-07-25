import { prisma } from '../../lib/prisma';
import AnalyticsClient from './AnalyticsClient';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
    // 1. Pipeline Revenue by Stage
    const revenueByStage = await prisma.business.groupBy({
        by: ['crm_status'],
        _sum: { revenue: true },
        where: {
            crm_status: { not: null, notIn: ['Unqualified'] }
        }
    });

    // 2. Average AI Score by CRM Stage
    const aiScoreByStage = await prisma.business.groupBy({
        by: ['crm_status'],
        _avg: { ai_score: true },
        where: {
            crm_status: { not: null, notIn: ['Unqualified'] }
        }
    });

    // 3. Leads by Category (Top Categories)
    const categoryGroup = await prisma.business.groupBy({
        by: ['category_id'],
        _count: { id: true },
        where: { category_id: { not: null } },
        orderBy: { _count: { id: 'desc' } },
        take: 10
    });

    // Map Category IDs to Names
    const categoryIds = categoryGroup.map(c => c.category_id as number);
    const categories = await prisma.businessCategory.findMany({
        where: { id: { in: categoryIds } }
    });

    const categoriesMap = new Map(categories.map(c => [c.id, c.name]));

    // Format Data for Recharts
    const pipelineData = revenueByStage
        .filter(s => s.crm_status)
        .map(s => ({
            stage: s.crm_status,
            revenue: s._sum.revenue || 0
        }));

    const aiScoreData = aiScoreByStage
        .filter(s => s.crm_status)
        .map(s => ({
            stage: s.crm_status,
            avgAiScore: Math.round(s._avg.ai_score || 0)
        }));

    const categoryData = categoryGroup.map(c => ({
        name: categoriesMap.get(c.category_id as number) || 'Unknown',
        value: c._count.id
    }));

    return (
        <AnalyticsClient 
            pipelineData={pipelineData} 
            aiScoreData={aiScoreData} 
            categoryData={categoryData} 
        />
    );
}
