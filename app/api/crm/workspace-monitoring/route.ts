import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getAuthorizedUser } from '../../../../services/auth_middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { role, username } = getAuthorizedUser(request);
        
        // 1. Enforce strict role check: Admin/Owner (ADMIN or MANAGER roles) only
        if (role !== 'ADMIN' && role !== 'MANAGER') {
            return NextResponse.json({ error: 'Forbidden: Admin/Owner access only' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'today';
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');
        const teamMember = searchParams.get('teamMember'); // filter by team member
        const searchQuery = searchParams.get('search')?.trim(); // business search query

        // Resolve Date range
        let start = new Date();
        let end = new Date();
        const now = new Date();

        if (period === 'today') {
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        } else if (period === 'yesterday') {
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        } else if (period === '7days') {
            start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            end = now;
        } else if (period === '30days') {
            start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            end = now;
        } else if (period === 'thisMonth') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = now;
        } else if (period === 'lastMonth') {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        } else if (startDateStr && endDateStr) {
            start = new Date(startDateStr);
            end = new Date(endDateStr);
        } else {
            // default to today
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        }

        // Fetch team members list
        const activeUsers = await prisma.user.findMany({
            where: {
                role: {
                    in: ['DEVELOPER', 'COMMUNICATION', 'SALES_AGENT', 'ADMIN']
                }
            },
            orderBy: { name: 'asc' }
        });

        // 2. Fetch CRM Leads and Activities
        const leadsWhereClause: any = {};
        if (teamMember && teamMember !== 'ALL') {
            leadsWhereClause.assignedTo = teamMember;
        }

        const allLeads = await prisma.cRMLead.findMany({
            where: leadsWhereClause,
            include: {
                business: {
                    include: {
                        category: true,
                        city: true,
                        state: true
                    }
                },
                deals: true,
                contacts: true,
                activities: {
                    orderBy: { occurredAt: 'desc' }
                },
                followUps: true
            }
        });

        // Activities in the date range
        const activityWhereClause: any = {
            occurredAt: { gte: start, lte: end }
        };
        if (teamMember && teamMember !== 'ALL') {
            activityWhereClause.performedBy = teamMember;
        }

        const periodActivities = await prisma.activity.findMany({
            where: activityWhereClause,
            include: {
                crmLead: {
                    include: {
                        business: true
                    }
                }
            },
            orderBy: { occurredAt: 'desc' }
        });

        // Follow-ups in the period
        const followUpsWhere: any = {};
        if (teamMember && teamMember !== 'ALL') {
            followUpsWhere.assignedTo = teamMember;
        }

        const periodFollowUps = await prisma.followUp.findMany({
            where: {
                ...followUpsWhere,
                updatedAt: { gte: start, lte: end }
            },
            include: {
                crmLead: {
                    include: {
                        business: true
                    }
                }
            }
        });

        // Pending follow-ups for monitoring (Overdue, Today, Upcoming)
        const pendingFollowUpsQuery: any = { status: 'PENDING' };
        if (teamMember && teamMember !== 'ALL') {
            pendingFollowUpsQuery.assignedTo = teamMember;
        }
        const followUpsPendingList = await prisma.followUp.findMany({
            where: pendingFollowUpsQuery,
            include: {
                crmLead: {
                    include: {
                        business: true
                    }
                }
            },
            orderBy: { dueAt: 'asc' }
        });

        // Deals won in the period
        const periodWonDeals = await prisma.deal.findMany({
            where: {
                status: 'WON',
                wonAt: { gte: start, lte: end }
            },
            include: {
                crmLead: true
            }
        });

        // FILTER SPECIFIC BUSINESS SEARCH IF PROVIDED
        let searchedBusinessResult = null;
        if (searchQuery) {
            const searchedLeads = await prisma.cRMLead.findMany({
                where: {
                    OR: [
                        { id: parseInt(searchQuery) || -1 },
                        { business: { business_name: { contains: searchQuery, mode: 'insensitive' } } },
                        { business: { phone_number: { contains: searchQuery, mode: 'insensitive' } } },
                        { assignedTo: { contains: searchQuery, mode: 'insensitive' } }
                    ]
                },
                include: {
                    business: {
                        include: {
                            category: true,
                            city: true,
                            state: true
                        }
                    },
                    activities: {
                        orderBy: { occurredAt: 'desc' }
                    },
                    followUps: {
                        orderBy: { dueAt: 'asc' }
                    },
                    deals: true
                },
                take: 10
            });
            searchedBusinessResult = searchedLeads;
        }

        // 3. Calculate Organization-Wide Core KPIs (within period)
        const contactedLeads = Array.from(new Set(periodActivities.map(a => a.crmLeadId)));
        const totalLeadsContacted = contactedLeads.length;
        const totalCalls = periodActivities.filter(a => a.type === 'CALL').length;
        const totalWhatsAppSent = periodActivities.filter(a => a.type === 'WHATSAPP' && (a.summary.toLowerCase().includes('sent') || a.details?.toLowerCase().includes('sent'))).length;
        const totalWhatsAppReplied = periodActivities.filter(a => a.type === 'WHATSAPP' && (a.outcome?.toLowerCase() === 'replied' || a.details?.toLowerCase().includes('replied'))).length;
        const totalConversations = periodActivities.filter(a => a.type === 'CALL' && a.outcome?.toLowerCase() === 'connected').length + totalWhatsAppReplied;

        const followUpsCompleted = periodFollowUps.filter(f => f.status === 'COMPLETED').length;
        const followUpsPending = periodFollowUps.filter(f => f.status === 'PENDING').length;
        const newLeadsAssigned = allLeads.filter(l => l.createdAt >= start && l.createdAt <= end).length;
        const interestedLeadsCount = allLeads.filter(l => l.clientStatus === 'Interested').length;
        const proposalsSent = periodActivities.filter(a => a.type === 'PROPOSAL').length;
        const dealsWonCount = periodWonDeals.length;
        const revenueGenerated = periodWonDeals.reduce((sum, d) => sum + d.value, 0);
        const noResponseCount = allLeads.filter(l => l.clientStatus === 'No Response').length;

        // 4. Calculate Team Activity Overview
        const teamActivity = activeUsers.map(user => {
            const userLeads = allLeads.filter(l => l.assignedTo === user.username);
            const userActivities = periodActivities.filter(a => a.performedBy === user.username);
            const userFollowUps = periodFollowUps.filter(f => f.assignedTo === user.username);

            const calls = userActivities.filter(a => a.type === 'CALL').length;
            const whatsapp = userActivities.filter(a => a.type === 'WHATSAPP').length;
            const conversations = userActivities.filter(a => (a.type === 'CALL' && a.outcome?.toLowerCase() === 'connected') || (a.type === 'WHATSAPP' && a.outcome?.toLowerCase() === 'replied')).length;
            const noResponse = userLeads.filter(l => l.clientStatus === 'No Response').length;
            const followUps = userFollowUps.filter(f => f.status === 'COMPLETED').length;
            const interested = userLeads.filter(l => l.clientStatus === 'Interested').length;

            const userWonDeals = periodWonDeals.filter(d => d.crmLead?.assignedTo === user.username);
            const wonDealsCount = userWonDeals.length;
            const revenue = userWonDeals.reduce((sum, d) => sum + d.value, 0);
            
            // Conversion rate calculations
            const leadsContacted = Array.from(new Set(userActivities.map(a => a.crmLeadId))).length;
            const conversionRate = leadsContacted > 0 ? Math.round((wonDealsCount / leadsContacted) * 100) : 0;

            return {
                username: user.username,
                name: user.name,
                role: user.role,
                leadsCount: userLeads.length,
                calls,
                whatsapp,
                conversations,
                noResponse,
                followUps,
                interested,
                won: wonDealsCount,
                revenue,
                conversionRate,
                leadsContacted,
                proposals: userActivities.filter(a => a.type === 'PROPOSAL').length
            };
        });

        // 5. Communication Activity Detail Lists (within period)
        const callsFeed = periodActivities
            .filter(a => a.type === 'CALL')
            .map(a => ({
                id: a.id,
                businessName: a.crmLead?.business?.business_name || 'Business Link',
                leadId: a.crmLeadId,
                agent: a.performedBy,
                time: a.occurredAt,
                outcome: a.outcome || 'No outcome recorded',
                summary: a.summary
            }));

        const whatsappFeed = periodActivities
            .filter(a => a.type === 'WHATSAPP')
            .map(a => ({
                id: a.id,
                businessName: a.crmLead?.business?.business_name || 'Business Link',
                leadId: a.crmLeadId,
                agent: a.performedBy,
                time: a.occurredAt,
                outcome: a.outcome || 'Sent',
                summary: a.summary
            }));

        const emailsFeed = periodActivities
            .filter(a => a.type === 'EMAIL')
            .map(a => ({
                id: a.id,
                businessName: a.crmLead?.business?.business_name || 'Business Link',
                leadId: a.crmLeadId,
                agent: a.performedBy,
                time: a.occurredAt,
                outcome: a.outcome || 'Sent'
            }));

        const meetingsFeed = periodActivities
            .filter(a => a.type === 'MEETING')
            .map(a => ({
                id: a.id,
                businessName: a.crmLead?.business?.business_name || 'Business Link',
                leadId: a.crmLeadId,
                agent: a.performedBy,
                time: a.occurredAt,
                outcome: a.outcome || 'Completed'
            }));

        // 6. No Response Tracker
        const noResponseTrackerList = allLeads
            .filter(l => l.clientStatus === 'No Response')
            .map(l => {
                const leadActs = l.activities;
                const lastAct = leadActs[0]; // sorted desc
                const pendingFu = l.followUps.find(f => f.status === 'PENDING');

                return {
                    id: l.id,
                    businessName: l.business?.business_name || 'Business Link',
                    assignedTo: l.assignedTo || 'Unassigned',
                    attempts: leadActs.length,
                    lastContactDate: lastAct ? lastAct.occurredAt : null,
                    lastContactMethod: lastAct ? lastAct.type : 'None',
                    nextFollowUp: pendingFu ? pendingFu.dueAt : null,
                    status: l.clientStatus
                };
            });

        // 7. Contact Attempts Count list
        const contactAttemptsList = allLeads
            .filter(l => l.activities.length > 0)
            .map(l => {
                const leadActs = l.activities;
                const lastAct = leadActs[0];

                return {
                    id: l.id,
                    businessName: l.business?.business_name || 'Business Link',
                    assignedTo: l.assignedTo || 'Unassigned',
                    calls: leadActs.filter(a => a.type === 'CALL').length,
                    whatsapp: leadActs.filter(a => a.type === 'WHATSAPP').length,
                    emails: leadActs.filter(a => a.type === 'EMAIL').length,
                    meetings: leadActs.filter(a => a.type === 'MEETING').length,
                    totalAttempts: leadActs.length,
                    lastContactDate: lastAct ? lastAct.occurredAt : null,
                    lastContactMethod: lastAct ? lastAct.type : 'None',
                    responseStatus: lastAct?.outcome || 'No Response',
                    status: l.clientStatus
                };
            });

        // 8. Live Activity Feed
        const liveFeed = periodActivities.map(a => ({
            id: a.id,
            time: a.occurredAt,
            agent: a.performedBy,
            action: a.summary,
            businessName: a.crmLead?.business?.business_name || 'Business Account',
            leadId: a.crmLeadId,
            outcome: a.outcome
        }));

        // 9. Alerts Section (Attention Required)
        const alerts: any[] = [];
        
        // Leads assigned but never contacted
        const uncontactedLeads = allLeads.filter(l => l.activities.length === 0);
        uncontactedLeads.forEach(l => {
            alerts.push({
                type: 'DANGER',
                message: `Lead [${l.business?.business_name || 'Unnamed'}] was assigned to ${l.assignedTo || 'Unassigned'} but has never been contacted.`,
                leadId: l.id
            });
        });

        // Leads with >= 3 attempts and no response
        const multipleNoResponses = contactAttemptsList.filter(c => c.totalAttempts >= 3 && c.status === 'No Response');
        multipleNoResponses.forEach(c => {
            alerts.push({
                type: 'DANGER',
                message: `Lead [${c.businessName}] has ${c.totalAttempts} contact attempts with no response.`,
                leadId: c.id
            });
        });

        // Follow-ups overdue
        allLeads.forEach(l => {
            const overdue = l.followUps.filter(f => f.status === 'PENDING' && new Date(f.dueAt) < new Date());
            overdue.forEach(f => {
                alerts.push({
                    type: 'WARNING',
                    message: `Overdue follow-up for lead [${l.business?.business_name || 'Account'}] assigned to ${f.assignedTo || 'Unassigned'}.`,
                    leadId: l.id
                });
            });
        });

        // Interested leads with no recent activity (no activities in last 7 days)
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const stagnantInterested = allLeads.filter(l => 
            l.clientStatus === 'Interested' && 
            l.activities.every(a => a.occurredAt < sevenDaysAgo)
        );
        stagnantInterested.forEach(l => {
            alerts.push({
                type: 'WARNING',
                message: `Interested lead [${l.business?.business_name || 'Account'}] has had no recorded activity in the last 7 days.`,
                leadId: l.id
            });
        });

        // High value deals without recent activity (value >= 50,000 INR, open status, no activity in last 7 days)
        const stagnantHighDeals = allLeads.filter(l => 
            l.deals.some(d => d.status === 'OPEN' && d.value >= 50000) && 
            l.activities.every(a => a.occurredAt < sevenDaysAgo)
        );
        stagnantHighDeals.forEach(l => {
            alerts.push({
                type: 'WARNING',
                message: `High-value commercial contract for [${l.business?.business_name || 'Account'}] has had no sales activity in the last 7 days.`,
                leadId: l.id
            });
        });

        return NextResponse.json({
            kpi: {
                totalLeadsContacted,
                totalCalls,
                totalWhatsAppSent,
                totalWhatsAppReplied,
                totalConversations,
                noResponseCount,
                followUpsCompleted,
                followUpsPending,
                newLeadsAssigned,
                interestedLeadsCount,
                proposalsSent,
                dealsWonCount,
                revenueGenerated
            },
            teamActivity,
            feeds: {
                calls: callsFeed,
                whatsapp: whatsappFeed,
                emails: emailsFeed,
                meetings: meetingsFeed
            },
            noResponseTracker: noResponseTrackerList,
            contactAttempts: contactAttemptsList,
            liveFeed,
            alerts,
            searchedBusinessResult,
            followUpsList: followUpsPendingList
        });

    } catch (err: any) {
        console.error('Failed to resolve Team Monitoring Workspace metrics:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
