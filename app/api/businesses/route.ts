import { NextResponse } from 'next/server';
import { prisma } from '../../../src/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;

        const hasWebsite = searchParams.get('hasWebsite');
        const hasPhone = searchParams.get('hasPhone');
        const minRating = parseFloat(searchParams.get('minRating') || '0');
        const minAiScore = parseInt(searchParams.get('minAiScore') || '0');
        const minOppScore = parseInt(searchParams.get('minOppScore') || '0');
        const categoryId = searchParams.get('categoryId');
        const jobId = searchParams.get('jobId');
        const discoveryStatus = searchParams.get('discoveryStatus');
        const crmStatus = searchParams.get('crmStatus');

        const where: any = {};
        
        if (hasWebsite === 'true') where.website_exists = true;
        if (hasPhone === 'true') where.phone_number = { not: null };
        if (minRating > 0) where.rating = { gte: minRating };
        if (minAiScore > 0) where.ai_score = { gte: minAiScore };
        if (minOppScore > 0) where.opportunity_score = { gte: minOppScore };
        if (categoryId) where.category_id = parseInt(categoryId);
        if (jobId) where.job_id = parseInt(jobId);
        if (discoveryStatus) where.discovery_status = discoveryStatus;
        if (crmStatus) where.crm_status = crmStatus;

        const businesses = await prisma.business.findMany({
            where,
            skip,
            take: limit,
            include: {
                category: true,
                city: true,
                state: true,
                country: true,
                job: true,
            },
            orderBy: { collection_date: 'desc' }
        });

        const total = await prisma.business.count({ where });

        return NextResponse.json({
            data: businesses,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
