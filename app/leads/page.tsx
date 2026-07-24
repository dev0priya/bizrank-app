import { prisma } from '../../src/lib/prisma';
import LeadsClient from '../../components/LeadsClient';

export const dynamic = 'force-dynamic';

export default async function QualifiedLeadsPage() {
    // Only fetch businesses that are explicitly 'Qualified' and not yet in the CRM
    const leads = await prisma.business.findMany({
        where: {
            discovery_status: 'Qualified',
            OR: [
                { crm_status: null },
                { crm_status: 'Unqualified' } // just in case it was downgraded
            ]
        },
        include: {
            category: true,
            city: true
        },
        orderBy: { opportunity_score: 'desc' }
    });

    return <LeadsClient initialLeads={leads} />;
}
