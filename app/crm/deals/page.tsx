import React from 'react';
import { prisma } from '../../../lib/prisma';
import DealsClient from './DealsClient';

export const dynamic = 'force-dynamic';

export default async function CRMDealsPage({
    searchParams
}: {
    searchParams: Promise<{
        search?: string;
        status?: string;
        minValue?: string;
        maxValue?: string;
        expectedCloseFrom?: string;
        expectedCloseTo?: string;
        assignedTo?: string;
        stateId?: string;
        categoryId?: string;
        page?: string;
    }>;
}) {
    // Resolve search parameters
    const params = await searchParams;
    const search = params.search?.trim();
    const status = params.status;
    const minValue = params.minValue;
    const maxValue = params.maxValue;
    const expectedCloseFrom = params.expectedCloseFrom;
    const expectedCloseTo = params.expectedCloseTo;
    const assignedTo = params.assignedTo;
    const stateId = params.stateId;
    const categoryId = params.categoryId;
    const page = parseInt(params.page || '1');
    const limit = 20;
    const skip = (page - 1) * limit;

    // Load static filters
    const categories = await prisma.businessCategory.findMany({
        orderBy: { name: 'asc' }
    });

    const states = await prisma.state.findMany({
        orderBy: { name: 'asc' }
    });

    // 1. Calculate Revenue and Pipeline Metrics using DB Aggregations
    const wonDealsAgg = await prisma.deal.aggregate({
        _sum: { value: true },
        _count: { id: true },
        where: { status: 'WON' }
    });

    const openDealsAgg = await prisma.deal.aggregate({
        _sum: { value: true },
        where: { status: 'OPEN' }
    });

    const wonRevenue = wonDealsAgg._sum.value || 0;
    const wonCount = wonDealsAgg._count.id || 0;
    const openPipeline = openDealsAgg._sum.value || 0;

    // 2. Query Deals matching filters
    const where: any = {};

    if (status) {
        where.status = status;
    }

    if (minValue || maxValue) {
        where.value = {};
        if (minValue) where.value.gte = parseFloat(minValue);
        if (maxValue) where.value.lte = parseFloat(maxValue);
    }

    if (expectedCloseFrom || expectedCloseTo) {
        where.expectedCloseDate = {};
        if (expectedCloseFrom) where.expectedCloseDate.gte = new Date(expectedCloseFrom);
        if (expectedCloseTo) where.expectedCloseDate.lte = new Date(expectedCloseTo);
    }

    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { crmLead: { business: { business_name: { contains: search, mode: 'insensitive' } } } },
            { crmLead: { contacts: { some: { name: { contains: search, mode: 'insensitive' } } } } }
        ];
    }

    if (assignedTo) {
        where.crmLead = {
            ...where.crmLead,
            assignedTo: assignedTo
        };
    }

    const businessFilter: any = {};
    if (stateId) businessFilter.state_id = parseInt(stateId);
    if (categoryId) businessFilter.category_id = parseInt(categoryId);

    if (Object.keys(businessFilter).length > 0) {
        where.crmLead = {
            ...where.crmLead,
            business: businessFilter
        };
    }

    const deals = await prisma.deal.findMany({
        where,
        skip,
        take: limit,
        include: {
            crmLead: {
                include: {
                    business: {
                        include: {
                            category: true,
                            city: true,
                            state: true
                        }
                    },
                    pipelineStage: true,
                    contacts: {
                        where: { isPrimary: true },
                        take: 1
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const totalCount = await prisma.deal.count({ where });

    return (
        <DealsClient 
            categories={categories}
            states={states}
            deals={deals}
            metrics={{
                wonRevenue,
                wonCount,
                openPipeline
            }}
            pagination={{
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }}
        />
    );
}
