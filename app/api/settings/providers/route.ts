import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        apify: !!process.env.APIFY_API_TOKEN,
        google_places: !!process.env.GOOGLE_MAPS_API_KEY,
        mock: true
    });
}
