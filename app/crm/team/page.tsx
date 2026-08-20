import React from 'react';
import { prisma } from '../../../lib/prisma';
import TeamClient from './TeamClient';

export const dynamic = 'force-dynamic';

export default async function CRMTeamPage() {
    // Group leads by owner to display sales agents performance
    const leads = await prisma.cRMLead.findMany({
        include: {
            pipelineStage: true,
            deals: true
        }
    });

    return <TeamClient leads={leads} />;
}
