import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const saved = await prisma.discoverySavedSearch.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(saved);
    } catch (error: any) {
        console.error('Failed to get saved searches:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            name,
            countryName = 'India',
            stateId,
            stateName,
            locationName,
            categoryId,
            categoryName,
            minRating,
            maxRating,
            minReviews,
            maxReviews,
            websiteFilter,
            phoneFilter,
            opportunityFilter
        } = body;

        if (!name || !locationName) {
            return NextResponse.json({ error: 'Name and Location are required' }, { status: 400 });
        }

        const saved = await prisma.discoverySavedSearch.create({
            data: {
                name,
                countryName,
                stateId: stateId ? parseInt(stateId) : null,
                stateName: stateName || null,
                locationName,
                categoryId: categoryId ? parseInt(categoryId) : null,
                categoryName: categoryName || null,
                minRating: minRating ? parseFloat(minRating) : null,
                maxRating: maxRating ? parseFloat(maxRating) : null,
                minReviews: minReviews ? parseInt(minReviews) : null,
                maxReviews: maxReviews ? parseInt(maxReviews) : null,
                websiteFilter: websiteFilter || null,
                phoneFilter: phoneFilter || null,
                opportunityFilter: opportunityFilter || null
            }
        });

        return NextResponse.json(saved, { status: 201 });
    } catch (error: any) {
        console.error('Failed to create saved search:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const url = new URL(request.url);
        const idStr = url.searchParams.get('id');
        if (!idStr) {
            return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });
        }
        
        await prisma.discoverySavedSearch.delete({
            where: { id: parseInt(idStr) }
        });

        return NextResponse.json({ success: true, message: 'Saved search deleted successfully.' });
    } catch (error: any) {
        console.error('Failed to delete saved search:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
