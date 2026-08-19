import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const search = searchParams.get('search')?.trim();
        const status = searchParams.get('status');
        const assignedTo = searchParams.get('assignedTo');
        const minValue = searchParams.get('minValue');
        const maxValue = searchParams.get('maxValue');
        const expectedCloseFrom = searchParams.get('expectedCloseFrom');
        const expectedCloseTo = searchParams.get('expectedCloseTo');
        const stateId = searchParams.get('stateId');
        const categoryId = searchParams.get('categoryId');

        const where: any = {};

        // Status Filter
        if (status) {
            where.status = status;
        }

        // Value Range Filter
        if (minValue || maxValue) {
            where.value = {};
            if (minValue) where.value.gte = parseFloat(minValue);
            if (maxValue) where.value.lte = parseFloat(maxValue);
        }

        // Expected Close Date Range Filter
        if (expectedCloseFrom || expectedCloseTo) {
            where.expectedCloseDate = {};
            if (expectedCloseFrom) where.expectedCloseDate.gte = new Date(expectedCloseFrom);
            if (expectedCloseTo) where.expectedCloseDate.lte = new Date(expectedCloseTo);
        }

        // Search Matches: Deal Name, Business Name, or Contact Name
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { crmLead: { business: { business_name: { contains: search, mode: 'insensitive' } } } },
                { crmLead: { contacts: { some: { name: { contains: search, mode: 'insensitive' } } } } }
            ];
        }

        // Lead assignedTo filter
        if (assignedTo) {
            where.crmLead = {
                ...where.crmLead,
                assignedTo: assignedTo
            };
        }

        // Business nesting filters
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

        const total = await prisma.deal.count({ where });

        return NextResponse.json({
            data: deals,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        console.error('Failed to query CRM deals:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
