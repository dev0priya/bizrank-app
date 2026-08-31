import React from 'react';
import { prisma } from '../../../lib/prisma';
import TasksClient from './TasksClient';

export const dynamic = 'force-dynamic';

export default async function CRMTasksPage() {
    const tasks = await prisma.followUp.findMany({
        include: {
            crmLead: {
                include: {
                    business: true
                }
            },
            contact: true
        },
        orderBy: { dueAt: 'asc' }
    });

    return (
        <React.Suspense fallback={
            <div className="crm-workspace" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <h3>Loading Tasks...</h3>
            </div>
        }>
            <TasksClient initialTasks={tasks} />
        </React.Suspense>
    );
}
