import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getAuthorizedUser, checkCRMAuthorization } from '../../../../services/auth_middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;

        const search = searchParams.get('search')?.trim();
        const stageId = searchParams.get('stageId');
        const priority = searchParams.get('priority');
        const cityId = searchParams.get('cityId');
        const stateId = searchParams.get('stateId');
        const categoryId = searchParams.get('categoryId');
        const hasWebsite = searchParams.get('hasWebsite');
        const minLeadScore = parseInt(searchParams.get('minLeadScore') || '0');
        const assignedTo = searchParams.get('assignedTo');

        const where: any = {};

        const { role, username } = getAuthorizedUser(request);
        if (role === 'SALES_AGENT') {
            where.assignedTo = username;
        } else if (assignedTo) {
            if (assignedTo === 'UNASSIGNED') {
                where.assignedTo = null;
            } else {
                where.assignedTo = assignedTo;
            }
        }

        // Search criteria
        if (search) {
            where.OR = [
                { business: { business_name: { contains: search, mode: 'insensitive' } } },
                { business: { phone_number: { contains: search, mode: 'insensitive' } } },
                { business: { email: { contains: search, mode: 'insensitive' } } },
                { business: { google_category: { contains: search, mode: 'insensitive' } } },
                { business: { category: { name: { contains: search, mode: 'insensitive' } } } },
                { business: { city: { name: { contains: search, mode: 'insensitive' } } } },
                { business: { area: { name: { contains: search, mode: 'insensitive' } } } },
                { contacts: { some: { name: { contains: search, mode: 'insensitive' } } } },
                { contacts: { some: { phone: { contains: search, mode: 'insensitive' } } } },
                { contacts: { some: { email: { contains: search, mode: 'insensitive' } } } }
            ];
        }

        // Filters
        if (stageId) where.pipelineStageId = parseInt(stageId);
        if (priority) where.priority = priority;
        if (minLeadScore > 0) where.leadScore = { gte: minLeadScore };

        // Nested Business Filters
        const businessFilter: any = {};
        if (cityId) businessFilter.city_id = parseInt(cityId);
        if (stateId) businessFilter.state_id = parseInt(stateId);
        if (categoryId) businessFilter.category_id = parseInt(categoryId);
        if (hasWebsite === 'true') businessFilter.website_exists = true;
        if (hasWebsite === 'false') businessFilter.website_exists = false;

        if (Object.keys(businessFilter).length > 0) {
            where.business = businessFilter;
        }

        // Sorting configuration
        const sortField = searchParams.get('sortField') || 'createdAt';
        const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

        const allowedSortFields = ['createdAt', 'updatedAt', 'leadScore', 'priority', 'estimatedValue'];
        let orderBy: any = { createdAt: 'desc' };

        if (allowedSortFields.includes(sortField)) {
            orderBy = { [sortField]: sortOrder };
        } else if (sortField === 'businessName') {
            orderBy = { business: { business_name: sortOrder } };
        } else if (sortField === 'rating') {
            orderBy = { business: { rating: sortOrder } };
        } else if (sortField === 'reviewCount') {
            orderBy = { business: { review_count: sortOrder } };
        }

        const leads = await prisma.cRMLead.findMany({
            where,
            skip,
            take: limit,
            include: {
                business: {
                    include: {
                        category: true,
                        city: true,
                        state: true,
                        area: true
                    }
                },
                pipelineStage: true,
                followUps: {
                    where: { status: 'PENDING' },
                    orderBy: { dueAt: 'asc' },
                    take: 1
                },
                deals: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy
        });

        const total = await prisma.cRMLead.count({ where });

        return NextResponse.json({
            data: leads,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        console.error('Failed to query CRM leads:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const auth = await checkCRMAuthorization(request, 'write');
        if (!auth.authorized) return auth.errorResponse;

        const body = await request.json();
        const { businessId, priority, estimatedValue, assignedTo } = body;

        if (!businessId) {
            return NextResponse.json({ error: 'Missing businessId' }, { status: 400 });
        }

        // Ensure Business exists
        const business = await prisma.business.findUnique({
            where: { id: parseInt(businessId) }
        });

        if (!business) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        // Check if Lead already exists (Duplicate Protection)
        const existing = await prisma.cRMLead.findUnique({
            where: { businessId: parseInt(businessId) }
        });

        if (existing) {
            // Return existing lead id (Duplicate Protection criteria)
            return NextResponse.json({ success: true, leadId: existing.id, message: 'Lead already promoted' });
        }

        // Get 'New' stage
        const defaultStage = await prisma.pipelineStage.findFirst({
            where: { name: 'New' }
        });

        if (!defaultStage) {
            return NextResponse.json({ error: 'Sales Pipeline not initialized. Run seeding first.' }, { status: 500 });
        }

        const newLead = await prisma.cRMLead.create({
            data: {
                businessId: parseInt(businessId),
                pipelineStageId: defaultStage.id,
                priority: priority || null,
                estimatedValue: estimatedValue ? parseFloat(estimatedValue) : 0,
                assignedTo: assignedTo || null,
                leadScore: business.opportunity_score || 0
            }
        });

        // Log promotion activity
        await prisma.activity.create({
            data: {
                crmLeadId: newLead.id,
                type: 'OTHER',
                summary: 'Lead Promoted to CRM',
                details: 'Business promoted from discovery queue to active CRM sales pipeline.',
                performedBy: 'System',
                outcome: 'Success'
            }
        });

        // Log Audit trailing
        await prisma.cRMAuditLog.create({
            data: {
                performedBy: 'System',
                action: 'LEAD_CREATED',
                entityType: 'CRMLead',
                entityId: newLead.id,
                newValue: 'Promoted to CRM Lead'
            }
        });

        // Keep Business discovery/crm status synced
        await prisma.business.update({
            where: { id: parseInt(businessId) },
            data: {
                discovery_status: 'CRM',
                crm_status: 'Lead'
            }
        });

        return NextResponse.json({ success: true, leadId: newLead.id }, { status: 201 });
    } catch (error: any) {
        console.error('Failed to promote CRM lead:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
