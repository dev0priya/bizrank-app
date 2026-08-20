import React from 'react';
import { prisma } from '../../../lib/prisma';
import AIClient from './AIClient';

export const dynamic = 'force-dynamic';

export default async function AICrmPage() {
    // Pre-fetch actual database records for recommendations
    const [hotLeads, overdueFollowUps, recentLeads] = await Promise.all([
        prisma.cRMLead.findMany({
            where: { priority: 'A' },
            include: { business: { include: { category: true } } },
            orderBy: { leadScore: 'desc' },
            take: 5
        }),
        prisma.followUp.findMany({
            where: { status: 'PENDING', dueAt: { lt: new Date() } },
            include: { crmLead: { include: { business: true } } },
            orderBy: { dueAt: 'asc' },
            take: 5
        }),
        prisma.cRMLead.findMany({
            include: { business: { include: { category: true } } },
            orderBy: { createdAt: 'desc' },
            take: 5
        })
    ]);

    return (
        <AIClient 
            hotLeads={hotLeads} 
            overdueFollowUps={overdueFollowUps}
            recentLeads={recentLeads}
        />
    );
}
