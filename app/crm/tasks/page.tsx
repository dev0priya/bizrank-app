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

    return <TasksClient initialTasks={tasks} />;
}
