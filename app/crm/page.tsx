import { prisma } from '../../src/lib/prisma';
import CRMClient from '../../components/CRMClient';

export const dynamic = 'force-dynamic';

export default async function CRMPage() {
    const deals = await prisma.business.findMany({
        where: {
            crm_status: {
                in: ['Lead', 'Contacted', 'Meeting Scheduled', 'Proposal Sent', 'Closed Won', 'Closed Lost']
            }
        },
        include: {
            category: true
        },
        orderBy: { collection_date: 'desc' }
    });

    return <CRMClient initialDeals={deals} />;
}
