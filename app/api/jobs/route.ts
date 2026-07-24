import { NextResponse } from 'next/server';
import { prisma } from '../../../src/lib/prisma';
import { GoogleMapsScraper } from '../../../src/scraper';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { country, state, city, area, category, maxResults } = body;

        const scraper = new GoogleMapsScraper();
        
        // Start run async
        const run = await scraper.startSearch({ 
            country, state, city, area, category, 
            maxResults: maxResults || 10 
        });

        // Store Job in Database
        const queryLabel = [category, area, city, state, country].filter(Boolean).join(", ");
        
        const job = await prisma.collectionJob.create({
            data: {
                apifyRunId: run.id,
                status: 'Running',
                query: queryLabel,
                progress: 0,
                total: maxResults || 10
            }
        });

        return NextResponse.json({ jobId: job.id, message: 'Job started successfully.' });
    } catch (error: any) {
        console.error('Failed to start collection job:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
