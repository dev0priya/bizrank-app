import React from 'react';
import { prisma } from '../../../lib/prisma';
import TagsClient from './TagsClient';

export const dynamic = 'force-dynamic';

export default async function CRMTagsPage() {
    const tags = await prisma.tag.findMany({
        include: {
            _count: {
                select: { leads: true }
            }
        },
        orderBy: { name: 'asc' }
    });

    return <TagsClient initialTags={tags} />;
}
