import React from 'react';
import { prisma } from '../../../lib/prisma';
import ContactsClient from './ContactsClient';

export const dynamic = 'force-dynamic';

export default async function CRMContactsPage() {
    const [contacts, leads] = await Promise.all([
        prisma.contact.findMany({
            include: {
                crmLead: {
                    include: {
                        business: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        }),
        prisma.cRMLead.findMany({
            include: {
                business: true
            },
            orderBy: { business: { business_name: 'asc' } }
        })
    ]);

    return <ContactsClient initialContacts={contacts} leads={leads} />;
}
