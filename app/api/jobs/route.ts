import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { MockProvider } from '../../../services/mockProvider';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { country, state, city, area, category, maxResults } = body;
        console.log(`\n--- MOCK PROVIDER PAYLOAD ---`);
        console.log(`Payload: ${JSON.stringify({ country, state, city, area, category, maxResults }, null, 2)}`);
        
        const scraper = new MockProvider();
        
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
        console.error('Failed to fetch jobs:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
