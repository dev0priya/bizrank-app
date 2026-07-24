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
        const categoryId = searchParams.get('categoryId');
        const jobId = searchParams.get('jobId');

        const where: any = {};
        
        if (hasWebsite === 'true') where.website_exists = true;
        if (hasPhone === 'true') where.phone_number = { not: null };
        if (minRating > 0) where.rating = { gte: minRating };
        if (categoryId) where.category_id = parseInt(categoryId);
        if (jobId) where.job_id = parseInt(jobId);

        const businesses = await prisma.business.findMany({
            where,
            skip,
            take: limit,
            include: {
                category: true,
                city: true,
                state: true,
                country: true,
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
