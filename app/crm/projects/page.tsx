import React from 'react';
import { prisma } from '../../../lib/prisma';
import ProjectsClient from './ProjectsClient';

export const dynamic = 'force-dynamic';

export default async function CRMProjectsPage() {
    const projects = await prisma.cRMLead.findMany({
        where: {
            developerId: { not: null }
        },
        include: {
            business: {
                include: {
                    category: true,
                    city: true,
                    state: true
                }
            },
            developer: true
        },
        orderBy: { updatedAt: 'desc' }
    });

    return <ProjectsClient initialProjects={projects} />;
}
