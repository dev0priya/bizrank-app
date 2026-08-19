import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const [countries, states, categories] = await Promise.all([
      prisma.country.findMany({ orderBy: { name: 'asc' } }),
      prisma.state.findMany({ orderBy: { name: 'asc' } }),
      prisma.businessCategory.findMany({
        where: { opportunityEligible: true },
        orderBy: { name: 'asc' }
      }),
    ]);

    return NextResponse.json({
      countries,
      states,
      // cities and areas are now handled via /api/locations/search (autocomplete)
      cities: [],
      areas: [],
      categories,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
