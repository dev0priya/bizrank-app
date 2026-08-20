import React from 'react';
import { prisma } from '../../../lib/prisma';
import LeadsClient from './LeadsClient';

export const dynamic = 'force-dynamic';

export default async function CRMLeadsPage() {
    // Pre-fetch DB filters dynamically from PostgreSQL (Zero mock data requirement)
    const categories = await prisma.businessCategory.findMany({
        orderBy: { name: 'asc' }
    });

    const states = await prisma.state.findMany({
        orderBy: { name: 'asc' }
    });

    const stages = await prisma.pipelineStage.findMany({
        orderBy: { order: 'asc' }
    });

    return (
        <React.Suspense fallback={
            <div className="crm-workspace" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <h3>Loading Leads...</h3>
            </div>
        }>
            <LeadsClient 
                categories={categories} 
                states={states} 
                stages={stages} 
            />
        </React.Suspense>
    );
}
