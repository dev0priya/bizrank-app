import React from 'react';
import { prisma } from '../../../../lib/prisma';
import DealDetailClient from './DealDetailClient';

export const dynamic = 'force-dynamic';

export default async function DealDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const resolvedParams = await params;
    const dealId = parseInt(resolvedParams.id);

    if (isNaN(dealId)) {
        return (
            <div className="glass-panel" style={{ padding: '48px', margin: '24px auto', maxWidth: '600px', textAlign: 'center' }}>
                <h3>Invalid Deal Identifier</h3>
                <p style={{ color: 'var(--text-muted)' }}>The requested deal ID parameter is missing or corrupted.</p>
            </div>
        );
    }

    const categories = await prisma.businessCategory.findMany({
        orderBy: { name: 'asc' }
    });

    const states = await prisma.state.findMany({
        orderBy: { name: 'asc' }
    });

    // Query deal with associated CRM Lead, Business information, contacts, and logs
    const deal = await prisma.deal.findUnique({
        where: { id: dealId },
        include: {
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
                    contacts: true,
                    activities: {
                        orderBy: { createdAt: 'desc' }
                    }
                }
            }
        }
    });

    if (!deal) {
        return (
            <div className="glass-panel" style={{ padding: '48px', margin: '24px auto', maxWidth: '600px', textAlign: 'center' }}>
                <h3>Deal Not Found</h3>
                <p style={{ color: 'var(--text-muted)' }}>The requested deal record does not exist in the database.</p>
            </div>
        );
    }

    // Load Deal Audit history logs
    const auditLogs = await prisma.cRMAuditLog.findMany({
        where: {
            entityId: dealId,
            entityType: 'Deal'
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <DealDetailClient 
            categories={categories}
            states={states}
            initialDeal={deal}
            initialAuditLogs={auditLogs}
        />
    );
}
