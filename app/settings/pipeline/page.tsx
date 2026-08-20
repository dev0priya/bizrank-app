import React from 'react';
import { prisma } from '../../../lib/prisma';
import PipelineSettingsClient from './PipelineSettingsClient';

export const dynamic = 'force-dynamic';

export default async function PipelineSettingsPage() {
    const stages = await prisma.pipelineStage.findMany({
        orderBy: { order: 'asc' }
    });

    return <PipelineSettingsClient initialStages={stages} />;
}
