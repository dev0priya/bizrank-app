import React from 'react';
import { prisma } from '../../../lib/prisma';
import BusinessDetailClient from './BusinessDetailClient';
import { notFound } from 'next/navigation';

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const p = await params;
    const businessId = parseInt(p.id);

    if (isNaN(businessId)) {
        return notFound();
    }

    const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: {
            category: true,
            city: true,
            state: true,
            country: true,
            area: true,
            job: true,
        }
    });

    if (!business) {
        return notFound();
    }

    return (
        <BusinessDetailClient business={business} />
    );
}
