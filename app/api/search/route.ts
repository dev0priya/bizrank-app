import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
          { business_name: { contains: q, mode: 'insensitive' } },
          { phone_number: { contains: q, mode: 'insensitive' } },
          { website: { contains: q, mode: 'insensitive' } },
          { google_category: { contains: q, mode: 'insensitive' } },
          { category: { name: { contains: q, mode: 'insensitive' } } },
          { city: { name: { contains: q, mode: 'insensitive' } } },
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
        query: { contains: q, mode: 'insensitive' }
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
