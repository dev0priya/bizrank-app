import React from 'react';
import { prisma } from '../../../lib/prisma';
import ActivitiesClient from './ActivitiesClient';

export const dynamic = 'force-dynamic';

export default async function CRMActivitiesPage() {
    const activities = await prisma.activity.findMany({
        include: {
            crmLead: {
                include: {
                    business: true
                }
            },
            contact: true
        },
        orderBy: { occurredAt: 'desc' },
        take: 100
    });

    return <ActivitiesClient initialActivities={activities} />;
}
