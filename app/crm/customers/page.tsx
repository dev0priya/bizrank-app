import React from 'react';
import { prisma } from '../../../lib/prisma';
import CustomersClient from './CustomersClient';

export const dynamic = 'force-dynamic';

export default async function CRMCustomersPage() {
    // A Lead is considered a Customer when they are in "Closed Won" stage
    // or have at least one deal with status "WON".
    const customers = await prisma.cRMLead.findMany({
        where: {
            OR: [
                { pipelineStage: { name: 'Closed Won' } },
                { deals: { some: { status: 'WON' } } }
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
            deals: true,
            contacts: true
        },
        orderBy: { updatedAt: 'desc' }
    });

    return (
        <React.Suspense fallback={
            <div className="crm-workspace" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <h3>Loading customers list...</h3>
            </div>
        }>
            <CustomersClient initialCustomers={customers} />
        </React.Suspense>
    );
}
