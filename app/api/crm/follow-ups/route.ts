import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { FollowUpStatus } from '@prisma/client';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'ALL'; // TODAY, UPCOMING, OVERDUE, COMPLETED, ALL
    const q = searchParams.get('q') || '';
    const assignedTo = searchParams.get('assignedTo') || '';
    const pipelineStageId = searchParams.get('pipelineStageId') || '';
    const priority = searchParams.get('priority') || '';
    const cityId = searchParams.get('cityId') || '';
    const stateId = searchParams.get('stateId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    try {
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);

        // Build base where clause
        const where: any = {};

        // Tab constraints
        if (tab === 'TODAY') {
            where.status = FollowUpStatus.PENDING;
            where.dueAt = {
                gte: now,
                lte: endOfToday
            };
        } else if (tab === 'UPCOMING') {
            where.status = FollowUpStatus.PENDING;
            where.dueAt = {
                gt: endOfToday
            };
        } else if (tab === 'OVERDUE') {
            where.status = FollowUpStatus.PENDING;
            where.dueAt = {
                lt: now
            };
        } else if (tab === 'COMPLETED') {
            where.status = FollowUpStatus.COMPLETED;
        } else if (tab === 'CANCELLED') {
            where.status = FollowUpStatus.CANCELLED;
        }

        // Search constraint
        if (q.trim()) {
            const query = q.trim();
            where.OR = [
                {
                    crmLead: {
                        business: {
                            business_name: { contains: query, mode: 'insensitive' }
                        }
                    }
                },
                {
                    contact: {
                        name: { contains: query, mode: 'insensitive' }
                    }
                },
                {
                    contact: {
                        phone: { contains: query, mode: 'insensitive' }
                    }
                }
            ];
        }

        // Filter constraints
        if (assignedTo) {
            where.assignedTo = assignedTo;
        }

        // Filters on nested crmLead properties
        const leadFilters: any = {};
        if (pipelineStageId) {
            leadFilters.pipelineStageId = parseInt(pipelineStageId);
        }
        if (priority) {
            leadFilters.priority = priority;
        }

        // Filters on business properties
        const businessFilters: any = {};
        if (cityId) {
            businessFilters.cityId = parseInt(cityId);
        }
        if (stateId) {
            businessFilters.stateId = parseInt(stateId);
        }

        if (Object.keys(businessFilters).length > 0) {
            leadFilters.business = {
                ...leadFilters.business,
                ...businessFilters
            };
        }

        if (Object.keys(leadFilters).length > 0) {
            where.crmLead = {
                ...where.crmLead,
                ...leadFilters
            };
        }

        // Select sorting order depending on the tab
        let orderBy: any = { dueAt: 'asc' };
        if (tab === 'OVERDUE') {
            orderBy = { dueAt: 'asc' }; // Oldest first to prioritize critical followups
        } else if (tab === 'COMPLETED') {
            orderBy = { completedAt: 'desc' }; // Most recently completed first
        } else if (tab === 'TODAY' || tab === 'UPCOMING') {
            orderBy = { dueAt: 'asc' }; // Nearest first
        }

        // Query execution
        const total = await prisma.followUp.count({ where });
        const items = await prisma.followUp.findMany({
            where,
            include: {
                contact: true,
                crmLead: {
                    include: {
                        business: {
                            include: {
                                category: true,
                                city: true,
                                state: true
                            }
                        },
                        pipelineStage: true,
                        activities: {
                            orderBy: { occurredAt: 'desc' },
                            take: 1,
                            include: {
                                contact: true
                            }
                        }
                    }
                }
            },
            orderBy,
            skip,
            take
        });

        const totalPages = Math.ceil(total / pageSize);

        return NextResponse.json({
            items,
            page,
            pageSize,
            total,
            totalPages
        });
    } catch (error: any) {
        console.error('Failed to query follow-ups:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
