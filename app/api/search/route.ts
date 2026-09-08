import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q || q.length < 2) {
      return NextResponse.json({ businesses: [], jobs: [] });
    }

    // Search Businesses
    const businesses = await prisma.business.findMany({
      where: {
        OR: [
          { business_name: { contains: q } },
          { phone_number: { contains: q } },
          { website: { contains: q } },
          { google_category: { contains: q } },
          { category: { name: { contains: q } } },
          { city: { name: { contains: q } } },
        ]
      },
      include: {
        category: true,
        city: true
      },
      take: 10
    });

    // Search Jobs
    const jobs = await prisma.collectionJob.findMany({
      where: {
        query: { contains: q }
      },
      take: 5
    });

    return NextResponse.json({
      businesses,
      jobs
    });

  } catch (error: any) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
