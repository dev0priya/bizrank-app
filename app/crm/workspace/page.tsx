import React from 'react';
import { prisma } from '../../../lib/prisma';
import WorkspaceClient from './WorkspaceClient';

export const dynamic = 'force-dynamic';

export default async function CRMWorkspacePage(props: {
    searchParams: Promise<{ section?: string }>
}) {
    const searchParams = await props.searchParams;
    const section = searchParams.section || 'overview';

    // Load stages from db to help with labels
    const stages = await prisma.pipelineStage.findMany({
        orderBy: { order: 'asc' }
    });

    return (
        <React.Suspense fallback={
            <div className="crm-workspace" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <h3>Loading team monitoring workspace...</h3>
            </div>
        }>
            <WorkspaceClient stages={stages} initialSection={section} />
        </React.Suspense>
    );
}
