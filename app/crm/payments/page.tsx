import React from 'react';
import { prisma } from '../../../lib/prisma';
import PaymentsClient from './PaymentsClient';

export const dynamic = 'force-dynamic';

export default async function CRMPaymentsPage() {
    // Load deals for payment logs
    const deals = await prisma.deal.findMany({
        include: {
            crmLead: {
                include: {
                    business: {
                        include: {
                            category: true,
                            city: true,
                            state: true
                        }
                    }
                }
            }
        },
        orderBy: { updatedAt: 'desc' }
    });

    return (
        <React.Suspense fallback={
            <div className="crm-workspace" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <h3>Loading payments tracker...</h3>
            </div>
        }>
            <PaymentsClient initialDeals={deals} />
        </React.Suspense>
    );
}
