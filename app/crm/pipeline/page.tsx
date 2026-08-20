import React from 'react';
import { prisma } from '../../../lib/prisma';
import PipelineClient from './PipelineClient';

export const dynamic = 'force-dynamic';

export default async function PipelinePage({
    searchParams
}: {
    searchParams: Promise<{
        search?: string;
        priority?: string;
        leadScore?: string;
        assignedTo?: string;
        stateId?: string;
        categoryId?: string;
    }>;
}) {
    // Resolve search parameters
    const params = await searchParams;
    const search = params.search?.trim();
    const priority = params.priority;
    const leadScore = params.leadScore;
    const assignedTo = params.assignedTo;
    const stateId = params.stateId;
    const categoryId = params.categoryId;

    // Load static filters
    const categories = await prisma.businessCategory.findMany({
        orderBy: { name: 'asc' }
    });

    const states = await prisma.state.findMany({
        orderBy: { name: 'asc' }
    });

    const stages = await prisma.pipelineStage.findMany({
        orderBy: { order: 'asc' }
    });

    // Build filter query
    const where: any = {};
    if (search) {
        where.OR = [
            { business: { business_name: { contains: search, mode: 'insensitive' } } },
            { business: { phone_number: { contains: search, mode: 'insensitive' } } },
            { business: { google_category: { contains: search, mode: 'insensitive' } } },
            { business: { category: { name: { contains: search, mode: 'insensitive' } } } },
            { business: { city: { name: { contains: search, mode: 'insensitive' } } } },
            { contacts: { some: { name: { contains: search, mode: 'insensitive' } } } }
        ];
    }

    if (priority) where.priority = priority;
    if (assignedTo) where.assignedTo = assignedTo;
    if (leadScore) {
        const scoreVal = parseInt(leadScore);
        if (!isNaN(scoreVal)) {
            where.leadScore = { gte: scoreVal };
        }
    }

    const businessFilter: any = {};
    if (stateId) businessFilter.state_id = parseInt(stateId);
    if (categoryId) businessFilter.category_id = parseInt(categoryId);
    if (Object.keys(businessFilter).length > 0) {
        where.business = businessFilter;
    }

    // Load active leads
    const leads = await prisma.cRMLead.findMany({
        where,
        include: {
            business: {
                include: {
                    category: true,
                    city: true,
                    state: true
                }
            },
            pipelineStage: true,
            followUps: {
                where: { status: 'PENDING' },
                orderBy: { dueAt: 'asc' },
                take: 1
            }
        },
        orderBy: { updatedAt: 'desc' }
    });

    // Aggregate metrics
    const totalLeads = leads.length;
    const openPipeline = leads
        .filter(l => l.pipelineStage.name !== 'Closed Won' && l.pipelineStage.name !== 'Closed Lost')
        .reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
    const wonPipeline = leads
        .filter(l => l.pipelineStage.name === 'Closed Won')
        .reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

    return (
        <React.Suspense fallback={
            <div className="crm-workspace" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <h3>Loading Sales Pipeline...</h3>
            </div>
        }>
            <PipelineClient 
                categories={categories}
                states={states}
                stages={stages}
                initialLeads={leads}
                metrics={{
                    totalLeads,
                    openPipeline,
                    wonPipeline
                }}
            />
        </React.Suspense>
    );
}
