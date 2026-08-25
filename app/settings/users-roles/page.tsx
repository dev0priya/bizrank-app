import React from 'react';
import { prisma } from '../../../lib/prisma';
import RolesClient from './RolesClient';

export const dynamic = 'force-dynamic';

export default async function UsersRolesSettingsPage() {
    const users = await prisma.user.findMany({
        orderBy: { name: 'asc' }
    });
    return <RolesClient initialUsers={users} />;
}
