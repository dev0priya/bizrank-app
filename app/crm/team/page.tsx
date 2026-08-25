import React from 'react';
import { prisma } from '../../../lib/prisma';
import TeamClient from './TeamClient';

export const dynamic = 'force-dynamic';

export default async function CRMTeamPage() {
    // Retrieve users
    const users = await prisma.user.findMany({
        where: {
            role: {
                in: ['DEVELOPER', 'COMMUNICATION']
            }
        },
        orderBy: {
            name: 'asc'
        }
    });

    // Retrieve leads
    const leads = await prisma.cRMLead.findMany({
        include: {
            business: {
                include: {
                    category: true,
                    city: true,
                    state: true,
                    area: true
                }
            },
            pipelineStage: true,
            contacts: true,
            developer: true,
            swati: true,
            activities: true,
            followUps: true
        }
    });

    return <TeamClient initialUsers={users} initialLeads={leads} />;
}
