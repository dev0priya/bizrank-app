import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

/**
 * GET /api/businesses
 *
 * Filters:
 *   page, limit          — pagination
 *   jobId                — filter by discovery job
 *   stateId              — filter by state
 *   categoryId           — filter by category
 *   opportunityLevel     — HIGH | MEDIUM | LOW | NOT_TARGET
 *   websiteStatus        — UNKNOWN | NO_WEBSITE | WEBSITE_FOUND | WEBSITE_VERIFIED | LOW_QUALITY_WEBSITE
 *   hasPhone             — true | false
 *   minRating, maxRating — rating range
 *   minReviews, maxReviews — review count range
 *   discoveryStatus      — Discovered | Audited | Qualified
 *   opportunityEligible  — true | false (default true for sales view)
 *   sort                 — opportunity_score | rating | review_count | collection_date
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;

    // Filters
    const jobId = searchParams.get('jobId');
    const stateId = searchParams.get('stateId');
    const categoryId = searchParams.get('categoryId');
    const opportunityLevel = searchParams.get('opportunityLevel');
    const websiteStatus = searchParams.get('websiteStatus');
    const hasPhone = searchParams.get('hasPhone');
    const minRating = parseFloat(searchParams.get('minRating') || '0');
    const maxRating = parseFloat(searchParams.get('maxRating') || '0');
    const minReviews = parseInt(searchParams.get('minReviews') || '0');
    const maxReviews = parseInt(searchParams.get('maxReviews') || '0');
    const discoveryStatus = searchParams.get('discoveryStatus');
    const opportunityEligibleParam = searchParams.get('opportunityEligible');
    const sort = searchParams.get('sort') || 'opportunity_score';

    const where: any = {};

    if (jobId) where.job_id = parseInt(jobId);
    if (stateId) where.state_id = parseInt(stateId);
    if (categoryId) where.category_id = parseInt(categoryId);
    if (opportunityLevel) where.opportunity_level = opportunityLevel;
    if (websiteStatus) where.website_status = websiteStatus;
    if (discoveryStatus) where.discovery_status = discoveryStatus;

    // Default: only show opportunity-eligible businesses in sales view
    if (opportunityEligibleParam === 'false') {
      // Show all including non-eligible
    } else {
      // Default: only eligible
      where.opportunity_eligible = true;
    }

    if (hasPhone === 'true') where.phone_number = { not: null };
    if (hasPhone === 'false') where.phone_number = null;

    if (minRating > 0 || maxRating > 0) {
      where.rating = {};
      if (minRating > 0) where.rating.gte = minRating;
      if (maxRating > 0) where.rating.lte = maxRating;
    }

    if (minReviews > 0 || maxReviews > 0) {
      where.review_count = {};
      if (minReviews > 0) where.review_count.gte = minReviews;
      if (maxReviews > 0) where.review_count.lte = maxReviews;
    }

    // Build orderBy
    let orderBy: any;
    switch (sort) {
      case 'rating':
        orderBy = [{ rating: 'desc' }, { review_count: 'desc' }];
        break;
      case 'review_count':
        orderBy = [{ review_count: 'desc' }];
        break;
      case 'collection_date':
        orderBy = [{ collection_date: 'desc' }];
        break;
      default: // opportunity_score (default)
        orderBy = [
          { opportunity_score: 'desc' },
          { rating: 'desc' },
          { review_count: 'desc' },
        ];
    }

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          city: true,
          state: true,
          country: true,
          job: { select: { id: true, query: true, provider: true } },
          crm_lead: { select: { id: true } },
        },
        orderBy,
      }),
      prisma.business.count({ where }),
    ]);

    return NextResponse.json({
      data: businesses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
