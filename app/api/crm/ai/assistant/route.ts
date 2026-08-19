import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { checkCRMAuthorization, getAuthorizedUser } from '../../../../../services/auth_middleware';

export async function POST(request: Request) {
    try {
        const auth = await checkCRMAuthorization(request, 'read');
        if (!auth.authorized) return auth.errorResponse;

        const { username } = getAuthorizedUser(request);
        const body = await request.json();
        const query = (body.query || '').trim().toLowerCase();

        if (!query) {
            return NextResponse.json({
                message: "Please enter a valid sales query or type 'help' for instructions.",
                data: []
            });
        }

        // 1. Help instructions query
        if (query === 'help' || query === 'commands' || query === 'actions' || query.includes('what can you do')) {
            return NextResponse.json({
                message: `
I am your deterministic AI CRM Assistant. You can query me using the following natural language questions:
* **"total leads"** or **"how many leads"** - Counts total active leads
* **"hot leads"** or **"priority a"** - Returns leads marked with Priority A (High)
* **"lost leads"** or **"closed lost"** - Returns leads currently in Closed Lost stage
* **"revenue"** or **"won value"** - Sums up all Closed Won deal amounts
* **"overdue followups"** or **"pending followups"** - Lists overdue tasks
* **"my leads"** or **"assigned to me"** - Returns leads assigned to your active user
* **Or type any business name** (e.g. "Pizza", "Clinic") to search leads directly.
                `.trim(),
                data: []
            });
        }

        // 2. Count leads query
        if (query.includes('total leads') || query.includes('how many leads') || query.includes('number of leads')) {
            const count = await prisma.cRMLead.count();
            return NextResponse.json({
                message: `You currently have **${count}** active CRM leads in your sales pipeline.`,
                data: { count }
            });
        }

        // 3. Hot leads query
        if (query.includes('hot') || query.includes('priority a') || query.includes('high priority')) {
            const leads = await prisma.cRMLead.findMany({
                where: { priority: 'A' },
                include: { business: true, pipelineStage: true }
            });
            return NextResponse.json({
                message: `Found **${leads.length}** high-priority (Priority A) leads.`,
                data: leads
            });
        }

        // 4. Lost leads query
        if (query.includes('lost') || query.includes('closed lost')) {
            const stage = await prisma.pipelineStage.findFirst({ where: { name: 'Closed Lost' } });
            const leads = stage ? await prisma.cRMLead.findMany({
                where: { pipelineStageId: stage.id },
                include: { business: true, pipelineStage: true }
            }) : [];
            return NextResponse.json({
                message: `Found **${leads.length}** leads currently in Closed Lost stage.`,
                data: leads
            });
        }

        // 5. Total revenue query
        if (query.includes('revenue') || query.includes('won value') || query.includes('earnings')) {
            const wonDeals = await prisma.deal.aggregate({
                where: { status: 'WON' },
                _sum: { value: true }
            });
            const sum = wonDeals._sum.value || 0;
            return NextResponse.json({
                message: `The total revenue generated from Closed Won deals is **$${sum.toLocaleString()}**.`,
                data: { revenue: sum }
            });
        }

        // 6. Overdue follow-ups query
        if (query.includes('overdue') || query.includes('pending followups') || query.includes('tasks')) {
            const followUps = await prisma.followUp.findMany({
                where: {
                    status: 'PENDING',
                    dueAt: { lt: new Date() }
                },
                include: { crmLead: { include: { business: true } } }
            });
            return NextResponse.json({
                message: `Found **${followUps.length}** pending follow-up tasks that are currently overdue.`,
                data: followUps
            });
        }

        // 7. Assigned leads query
        if (query.includes('my leads') || query.includes('assigned to me') || query.includes('assigned to ') && query.includes('me')) {
            const leads = await prisma.cRMLead.findMany({
                where: { assignedTo: username },
                include: { business: true, pipelineStage: true }
            });
            return NextResponse.json({
                message: `Found **${leads.length}** leads assigned to your email (${username}).`,
                data: leads
            });
        }

        // 8. Default search: Fuzzy query match on business name
        const leads = await prisma.cRMLead.findMany({
            where: {
                business: {
                    business_name: {
                        contains: query,
                        mode: 'insensitive'
                    }
                }
            },
            include: { business: true, pipelineStage: true }
        });

        if (leads.length > 0) {
            return NextResponse.json({
                message: `Found **${leads.length}** matching leads containing "${query}" in their business name.`,
                data: leads
            });
        }

        return NextResponse.json({
            message: `No explicit metrics or business names matched "${query}". Type "help" to see available commands.`,
            data: []
        });

    } catch (error: any) {
        console.error('AI assistant query execution failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
