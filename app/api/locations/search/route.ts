import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

/**
 * GET /api/locations/search
 * State-scoped location autocomplete for Business Discovery.
 *
 * Query params:
 *   q       — search query (required, min 1 char)
 *   stateId — filter by state (required for scoped search)
 *   limit   — max results (default 10, max 20)
 *
 * Returns SearchLocation records matching the query within the selected state.
 * The backend enforces state scoping — no global search.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const stateId = parseInt(searchParams.get('stateId') || '0');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

    // If q is empty but stateId is provided, return top state locations
    if (!q) {
      if (stateId) {
        const state = await prisma.state.findUnique({ where: { id: stateId } });
        if (!state) return NextResponse.json({ error: 'State not found' }, { status: 404 });
        const topLocations = await prisma.searchLocation.findMany({
          where: { stateId },
          orderBy: [
            { type: 'asc' },
            { name: 'asc' },
          ],
          take: limit || 12,
          include: {
            state: { select: { id: true, name: true, type: true } },
            city: { select: { id: true, name: true, latitude: true, longitude: true } },
            area: { select: { id: true, name: true } },
          },
        });
        const data = topLocations.map(loc => ({
          id: loc.id,
          name: loc.name,
          displayName: loc.displayName,
          type: loc.type,
          stateId: loc.stateId,
          stateName: loc.state.name,
          cityId: loc.cityId,
          cityName: loc.city?.name || null,
          areaId: loc.areaId,
          areaName: loc.area?.name || null,
          latitude: loc.latitude || loc.city?.latitude || null,
          longitude: loc.longitude || loc.city?.longitude || null,
          source: loc.source,
        }));
        return NextResponse.json({ data, total: data.length, stateId, stateName: state.name });
      }
      return NextResponse.json({ data: [], message: 'Query required' });
    }

    // Require stateId for geographic scoping
    if (!stateId) {
      return NextResponse.json({ error: 'stateId is required for location search' }, { status: 400 });
    }

    // Verify state exists
    const state = await prisma.state.findUnique({ where: { id: stateId } });
    if (!state) {
      return NextResponse.json({ error: 'State not found' }, { status: 404 });
    }

    // Search SearchLocation table scoped to the selected state
    // Uses contains (case-insensitive) for full substring match
    const results = await prisma.searchLocation.findMany({
      where: {
        stateId,
        name: {
          contains: q,
          mode: 'insensitive',
        },
      },
      orderBy: [
        // Prioritize: CITY before AREA, then alphabetical
        { type: 'asc' },
        { name: 'asc' },
      ],
      take: limit,
      include: {
        state: { select: { id: true, name: true, type: true } },
        city: { select: { id: true, name: true, latitude: true, longitude: true } },
        area: { select: { id: true, name: true } },
      },
    });

    const data = results.map(loc => ({
      id: loc.id,
      name: loc.name,
      displayName: loc.displayName,
      type: loc.type,
      stateId: loc.stateId,
      stateName: loc.state.name,
      cityId: loc.cityId,
      cityName: loc.city?.name || null,
      areaId: loc.areaId,
      areaName: loc.area?.name || null,
      latitude: loc.latitude || loc.city?.latitude || null,
      longitude: loc.longitude || loc.city?.longitude || null,
      source: loc.source,
    }));

    return NextResponse.json({
      data,
      total: data.length,
      query: q,
      stateId,
      stateName: state.name,
    });

  } catch (error: any) {
    console.error('[/api/locations/search] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
