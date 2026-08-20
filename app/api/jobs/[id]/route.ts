import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { ProviderFactory } from '../../../../services/providerFactory';
import { DataProcessor } from '../../../../services/processor';
import { WebsiteAuditor } from '../../../../services/auditor';
import { OpportunityScorer } from '../../../../services/opportunityScorer';
import { normalizeCategoryName } from '../../../../services/categoryNormalizer';
import type { WebsiteStatus } from '../../../../config/opportunityConfig';

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
            return NextResponse.json({ error: 'No Provider run associated' }, { status: 500 });
        }

        const scraper = ProviderFactory.createProvider(job.provider || 'apify');
        const runStatus = await scraper.checkRunStatus(job.apifyRunId);

        if (!runStatus) {
            return NextResponse.json({ error: 'Run not found' }, { status: 404 });
        }

        if (runStatus.status === 'RUNNING' || runStatus.status === 'READY') {
            // Rough progress estimate if we know maxResults, Apify doesn't easily return raw progress here.
            // Just return RUNNING.
            return NextResponse.json({ status: 'Running', progress: 50 });
        }

        if (runStatus.status === 'SUCCEEDED') {
            console.log(`[APIFY_RUN_COMPLETED] Run ${runStatus.id} succeeded.`);
            
            const rawItems = await scraper.getDatasetItems(runStatus.defaultDatasetId);
            console.log(`[APIFY_DATASET_READ] Retrieved ${rawItems.length} raw items from dataset ${runStatus.defaultDatasetId}`);
            
            const searchCategory = job.query.split(',')[0]?.trim(); // Best effort from query label
            const processed = DataProcessor.processAndDeduplicate(rawItems, searchCategory);
            console.log(`[DISCOVERY_NORMALIZED] Processed and deduplicated ${processed.length} valid business records.`);
            
            const audited = await WebsiteAuditor.auditBusinesses(processed);

            // Fetch only the categories and relevant locations on-demand to optimize memory and speed
            const categories = await prisma.businessCategory.findMany();
            
            const uniqueCityNames = Array.from(new Set(audited.map(biz => biz.city).filter(Boolean))) as string[];
            const uniqueStateNames = Array.from(new Set(audited.map(biz => biz.state).filter(Boolean))) as string[];
            const uniqueCountryNames = Array.from(new Set(audited.map(biz => biz.country).filter(Boolean))) as string[];

            const cities = uniqueCityNames.length > 0 
                ? await prisma.city.findMany({ 
                    where: { 
                        name: { in: uniqueCityNames, mode: 'insensitive' },
                        ...(job.stateId ? { stateId: job.stateId } : {})
                    } 
                  }) 
                : [];
            const states = uniqueStateNames.length > 0 
                ? await prisma.state.findMany({ where: { name: { in: uniqueStateNames, mode: 'insensitive' } } }) 
                : [];
            const countries = uniqueCountryNames.length > 0 
                ? await prisma.country.findMany({ 
                    where: { 
                        OR: [
                           { name: { in: uniqueCountryNames, mode: 'insensitive' } },
                           { code: { in: uniqueCountryNames, mode: 'insensitive' } }
                        ] 
                    } 
                  }) 
                : [];

            const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), { id: c.id, weight: c.websiteOpportunityWeight, eligible: c.opportunityEligible }]));
            const cityMap = new Map(cities.map(c => [c.name.toLowerCase(), c.id]));
            const stateMap = new Map(states.map(s => [s.name.toLowerCase(), s.id]));
            const countryMap = new Map(countries.map(c => [c.name.toLowerCase(), c.id]));
            const countryCodeMap = new Map(countries.filter(c => c.code).map(c => [c.code!.toLowerCase(), c.id]));

            const getCatInfo = (name: string | null) => {
                if (!name) return null;
                // First try direct match, then normalized via categoryNormalizer
                const direct = categoryMap.get(name.toLowerCase());
                if (direct) return direct;
                const normalized = normalizeCategoryName(name);
                return normalized ? categoryMap.get(normalized.toLowerCase()) || null : null;
            };
            const getCatId = (name: string | null) => getCatInfo(name)?.id || null;
            const getCityId = (name: string | null) => name ? cityMap.get(name.toLowerCase()) || null : null;
            const getStateId = (name: string | null) => name ? stateMap.get(name.toLowerCase()) || null : null;
            const getCountryId = (code: string | null) => {
                if (!code) return null;
                const normalized = code.toLowerCase();
                return countryMap.get(normalized) || countryCodeMap.get(normalized) || null;
            };

            for (const biz of audited) {
                const aiScore = biz.ai_score || 0;
                
                // Resolve geographic and category IDs
                const categoryId = job.categoryId || getCatId(biz.category);
                const catInfo = job.categoryId
                    ? getCatInfo(categories.find(c => c.id === job.categoryId)?.name || null)
                    : getCatInfo(biz.category);

                const resolvedStateId = getStateId(biz.state);
                const stateId = resolvedStateId || job.stateId; // Prefer the actual state of the business

                // GEOGRAPHIC SCOPE VALIDATION: Enforce State isolation (e.g. Delhi vs Haryana vs Gujarat)
                if (job.stateId && resolvedStateId && job.stateId !== resolvedStateId) {
                    console.log(`[DISCOVERY_GEO_FILTERED] REJECTED_OUT_OF_STATE: ${biz.business_name} (Expected State ID ${job.stateId}, got ${resolvedStateId} for ${biz.state})`);
                    continue; // Skip cross-state leak
                }

                const resolvedCityId = getCityId(biz.city);
                const cityId = resolvedCityId || job.cityId;
                const countryId = getCountryId(biz.country) || job.countryId;
                const areaId = job.areaId || null;
                const districtId = job.districtId || null;

                // Determine website status correctly for all providers
                let websiteStatus: WebsiteStatus = 'UNKNOWN';
                if (biz.website) {
                    if (biz.website_exists && aiScore >= 60) websiteStatus = 'WEBSITE_VERIFIED';
                    else if (biz.website_exists && aiScore > 0) websiteStatus = 'LOW_QUALITY_WEBSITE';
                    else websiteStatus = 'WEBSITE_FOUND';
                } else if (!biz.website) {
                    // Absent website field from scraper/API means no website listed
                    websiteStatus = 'NO_WEBSITE';
                }

                // Compute opportunity score
                const opportunityResult = OpportunityScorer.score({
                    websiteStatus,
                    hasPhone: !!biz.phone_number,
                    rating: biz.rating || null,
                    reviewCount: biz.review_count || null,
                    hasInstagram: !!(biz as any).instagram_url,
                    hasFacebook: !!(biz as any).facebook_url,
                    businessStatus: (biz as any).business_status || null,
                    categoryWeight: catInfo?.weight ?? 0.5,
                    opportunityEligible: catInfo?.eligible ?? true,
                    hasEmail: !!(biz as any).email,
                });
                const oppScore = opportunityResult.score;
                const opportunityLevel = opportunityResult.level;
                const opportunityEligible = catInfo?.eligible ?? true;

                let resolvedAreaId = areaId;
                const searchAreaName = biz.area || biz.city;
                if (!resolvedAreaId && cityId && searchAreaName) {
                    const matchedArea = await prisma.area.findFirst({
                        where: {
                            name: { equals: searchAreaName, mode: 'insensitive' },
                            cityId: cityId
                        }
                    });
                    if (matchedArea) resolvedAreaId = matchedArea.id;
                }

                let resolvedDistrictId = districtId;
                if (!resolvedDistrictId && cityId) {
                    const cityWithSub = await prisma.city.findUnique({
                        where: { id: cityId },
                        include: { subdistrict: true }
                    });
                    if (cityWithSub?.subdistrict) {
                        resolvedDistrictId = cityWithSub.subdistrict.districtId;
                    }
                }

                const data = {
                    provider: biz.provider || job.provider || 'apify',
                    place_id: biz.place_id,
                    business_name: biz.business_name,
                    category_id: categoryId,
                    google_category: biz.google_category || biz.category,
                    owner_name: biz.owner_name,
                    business_status: biz.business_status,
                    city_id: cityId,
                    state_id: stateId,
                    country_id: countryId,
                    area_id: resolvedAreaId,
                    district_id: resolvedDistrictId,
                    full_address: biz.full_address,
                    phone_number: biz.phone_number,
                    website: biz.website,
                    website_exists: biz.website_exists,
                    website_status: websiteStatus,
                    email: biz.email,
                    google_maps_url: biz.google_maps_url,
                    rating: biz.rating,
                    review_count: biz.review_count,
                    latitude: biz.latitude,
                    longitude: biz.longitude,
                    ai_score: aiScore,
                    opportunity_score: oppScore,
                    opportunity_level: opportunityLevel,
                    opportunity_eligible: opportunityEligible,
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
                        update: {
                            provider: biz.provider || job.provider || 'apify',
                            job_id: job.id,
                            category_id: categoryId,
                            google_category: biz.google_category || biz.category,
                            state_id: stateId,
                            city_id: cityId,
                            area_id: resolvedAreaId,
                            district_id: resolvedDistrictId,
                            country_id: countryId,
                            full_address: biz.full_address,
                            opportunity_score: oppScore,
                            opportunity_level: opportunityLevel,
                            opportunity_eligible: opportunityEligible,
                            website_status: websiteStatus,
                            rating: biz.rating,
                            review_count: biz.review_count,
                            phone_number: biz.phone_number,
                            website: biz.website,
                            google_maps_url: biz.google_maps_url,
                            website_exists: biz.website_exists,
                            business_status: biz.business_status,
                            email: biz.email,
                            latitude: biz.latitude,
                            longitude: biz.longitude,
                            ai_score: aiScore,
                            audit_mobile_responsive: biz.audit_mobile_responsive,
                            audit_https: biz.audit_https,
                            audit_speed_score: biz.audit_speed_score,
                            audit_seo_score: biz.audit_seo_score,
                            audit_ux_score: biz.audit_ux_score,
                            audit_contact_visible: biz.audit_contact_visible,
                            audit_booking_engine: biz.audit_booking_engine,
                        },
                        create: data
                    });
                } else if (biz.google_maps_url) {
                    // Fallback composite or google maps url
                    const existing = await prisma.business.findFirst({ where: { google_maps_url: biz.google_maps_url } });
                    if (!existing) {
                        await prisma.business.create({ data });
                    } else {
                        await prisma.business.update({
                            where: { id: existing.id },
                            data: {
                                provider: biz.provider || job.provider || 'apify',
                                job_id: job.id,
                                opportunity_score: oppScore,
                                opportunity_level: opportunityLevel,
                                opportunity_eligible: opportunityEligible,
                                website_status: websiteStatus,
                                rating: biz.rating,
                                review_count: biz.review_count,
                                phone_number: biz.phone_number,
                                website: biz.website,
                                google_maps_url: biz.google_maps_url,
                                website_exists: biz.website_exists,
                                business_status: biz.business_status,
                                email: biz.email,
                                latitude: biz.latitude,
                                longitude: biz.longitude,
                                ai_score: aiScore,
                            }
                        });
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
