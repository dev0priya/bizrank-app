import { prisma } from '../../lib/prisma';
import DatabaseClient from './DatabaseClient';

export const dynamic = 'force-dynamic';

export default async function BusinessDatabasePage() {
    // Pre-fetch Master Data for the filters
    const categories = await prisma.businessCategory.findMany();
    const cities = await prisma.city.findMany();
    const states = await prisma.state.findMany();

    return <DatabaseClient categories={categories} cities={cities} states={states} />;
}
