import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { GoogleMapsScraper } from '../../../../services/scraper';
import { DataProcessor } from '../../../../services/processor';
import { WebsiteAuditor } from '../../../../services/auditor';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    const params = await context.params;
    const jobId = parseInt(params.id);
    if (isNaN(jobId)) {
        return NextResponse.json({ error: 'Invalid Job ID' }, { status: 400 });
    }

    try {
        const job = await prisma.collectionJob.findUnique({ where: { id: jobId } });
        if (!job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        if (job.status === 'Completed' || job.status === 'Failed') {
            return NextResponse.json({ status: job.status, progress: job.progress });
        }

        if (!job.apifyRunId) {
            return NextResponse.json({ error: 'No Apify run associated' }, { status: 500 });
        }

        const scraper = new GoogleMapsScraper();
        const runStatus = await scraper.checkRunStatus(job.apifyRunId);

        if (!runStatus) {
            return NextResponse.json({ error: 'Apify run not found' }, { status: 404 });
        }

        if (runStatus.status === 'RUNNING' || runStatus.status === 'READY') {
            // Rough progress estimate if we know maxResults, Apify doesn't easily return raw progress here.
            // Just return RUNNING.
            return NextResponse.json({ status: 'Running', progress: 50 });
        }

        if (runStatus.status === 'SUCCEEDED') {
            console.log(`Apify Run ${runStatus.id} succeeded. Processing data...`);
            
            const rawItems = await scraper.getDatasetItems(runStatus.defaultDatasetId);
            const searchCategory = job.query.split(',')[0]?.trim(); // Best effort from query label
            const processed = DataProcessor.processAndDeduplicate(rawItems, searchCategory);
            const audited = await WebsiteAuditor.auditBusinesses(processed);

            // Fetch Master Tables to resolve IDs (simple cache)
            const categories = await prisma.businessCategory.findMany();
            const cities = await prisma.city.findMany();
            const states = await prisma.state.findMany();
            const countries = await prisma.country.findMany();

            const getCatId = (name: string | null) => categories.find(c => c.name.toLowerCase() === name?.toLowerCase())?.id || null;
            const getCityId = (name: string | null) => cities.find(c => c.name.toLowerCase() === name?.toLowerCase())?.id || null;
            const getStateId = (name: string | null) => states.find(c => c.name.toLowerCase() === name?.toLowerCase())?.id || null;
            const getCountryId = (code: string | null) => countries.find(c => c.code?.toLowerCase() === code?.toLowerCase() || c.name.toLowerCase() === code?.toLowerCase())?.id || null;

            for (const biz of audited) {
                const aiScore = biz.ai_score || 0;
                const oppScore = biz.website_exists ? (100 - aiScore) : 90; // High opportunity if no website or bad website
                
                const data = {
                    place_id: biz.place_id,
                    business_name: biz.business_name,
                    category_id: getCatId(biz.category),
                    google_category: biz.google_category || biz.category, // Exact Google Category
                    owner_name: biz.owner_name,
                    business_status: biz.business_status,
                    city_id: getCityId(biz.city),
                    state_id: getStateId(biz.state),
                    country_id: getCountryId(biz.country),
                    full_address: biz.full_address,
                    phone_number: biz.phone_number,
                    website: biz.website,
                    website_exists: biz.website_exists,
                    email: biz.email,
                    google_maps_url: biz.google_maps_url,
                    rating: biz.rating,
                    review_count: biz.review_count,
                    latitude: biz.latitude,
                    longitude: biz.longitude,
                    ai_score: aiScore,
                    opportunity_score: oppScore,
                    audit_mobile_responsive: biz.audit_mobile_responsive,
                    audit_https: biz.audit_https,
                    audit_speed_score: biz.audit_speed_score,
                    audit_seo_score: biz.audit_seo_score,
                    audit_ux_score: biz.audit_ux_score,
                    audit_contact_visible: biz.audit_contact_visible,
                    audit_booking_engine: biz.audit_booking_engine,
                    job_id: job.id,
                    discovery_status: 'Discovered'
                };

                // Deduplicate using place_id or google_maps_url
                if (biz.place_id) {
                    await prisma.business.upsert({
                        where: { place_id: biz.place_id },
                        update: {}, // Don't overwrite existing
                        create: data
                    });
                } else if (biz.google_maps_url) {
                    // Fallback composite or google maps url
                    const existing = await prisma.business.findFirst({ where: { google_maps_url: biz.google_maps_url } });
                    if (!existing) {
                        await prisma.business.create({ data });
                    }
                }
            }

            await prisma.collectionJob.update({
                where: { id: jobId },
                data: { status: 'Completed', progress: 100 }
            });

            return NextResponse.json({ status: 'Completed', progress: 100 });
        }

        if (runStatus.status === 'FAILED' || runStatus.status === 'ABORTED') {
            await prisma.collectionJob.update({
                where: { id: jobId },
                data: { status: 'Failed' }
            });
            return NextResponse.json({ status: 'Failed', progress: 0 });
        }

        return NextResponse.json({ status: 'Unknown', progress: 0 });

    } catch (error: any) {
        console.error('Failed to poll job:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    const params = await context.params;
    const jobId = parseInt(params.id);
    if (isNaN(jobId)) {
        return NextResponse.json({ error: 'Invalid Job ID' }, { status: 400 });
    }

    try {
        // Cascade delete is handled by Prisma or DB schema if configured, 
        // but wait, schema.prisma doesn't have onDelete: Cascade for businesses -> jobs
        // Let's delete businesses first
        await prisma.business.deleteMany({ where: { job_id: jobId } });
        
        // Then delete the job
        await prisma.collectionJob.delete({ where: { id: jobId } });
        
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Failed to delete job:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
