import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { ProviderFactory } from '../../../services/providerFactory';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      provider = 'apify',
      // IDs
      countryId, stateId, districtId, cityId, areaId, categoryId,
      // Name strings for provider query
      country, state, city, area, category,
      // New: resolved location data
      locationName, locationLat, locationLng, radiusKm = 5.0,
      maxResults = 20,
    } = body;

    console.log('\n--- DISCOVERY JOB PAYLOAD ---');
    console.log(JSON.stringify({
      provider, country, state, city, area, category, maxResults,
      countryId, stateId, cityId, areaId, categoryId,
      locationName, locationLat, locationLng, radiusKm
    }, null, 2));

    // Validate: at minimum we need a state
    if (!stateId && !state) {
      return NextResponse.json({ error: 'State is required to start discovery' }, { status: 400 });
    }

    const scraper = ProviderFactory.createProvider(provider);

    // Build provider search params
    const searchParams = {
      country: country || 'India',
      state,
      city: locationName || city,
      area,
      category,
      maxResults: maxResults || 10,
      latitude: locationLat || null,
      longitude: locationLng || null,
      radiusKm: radiusKm || 5.0,
    };

    // Start provider run async
    const run = await scraper.startSearch(searchParams);

    // Build query label for display
    const queryLabel = [category, locationName || area, city, state, country]
      .filter(Boolean)
      .join(', ');

    // Create CollectionJob record
    const job = await prisma.collectionJob.create({
      data: {
        apifyRunId: run.id,
        provider,
        status: 'Running',
        query: queryLabel,
        progress: 0,
        total: maxResults || 10,
        countryId: countryId || null,
        stateId: stateId || null,
        districtId: districtId || null,
        cityId: cityId || null,
        areaId: areaId || null,
        categoryId: categoryId || null,
        locationName: locationName || null,
        locationLat: locationLat || null,
        locationLng: locationLng || null,
        radiusKm: radiusKm || 5.0,
      }
    });

    return NextResponse.json({
      jobId: job.id,
      message: 'Discovery job started successfully.',
      query: queryLabel,
    });

  } catch (error: any) {
    console.error('[/api/jobs POST] Failed to start discovery job:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const jobs = await prisma.collectionJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        _count: {
          select: { businesses: true }
        }
      }
    });
    return NextResponse.json(jobs);
  } catch (error: any) {
    console.error('[/api/jobs GET] Failed to fetch jobs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
