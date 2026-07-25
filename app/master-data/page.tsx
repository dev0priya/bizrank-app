import { prisma } from '../../lib/prisma';
import MasterDataClient from './MasterDataClient';

export const dynamic = 'force-dynamic';

export default async function MasterDataPage() {
    // Fetch current state of dictionaries
    const categories = await prisma.businessCategory.findMany({ orderBy: { name: 'asc' } });
    const countries = await prisma.country.findMany({ orderBy: { name: 'asc' } });
    const states = await prisma.state.findMany({ orderBy: { name: 'asc' } });
    const cities = await prisma.city.findMany({ orderBy: { name: 'asc' } });

    return <MasterDataClient 
        initialCategories={categories} 
        initialCountries={countries}
        initialStates={states}
        initialCities={cities}
    />;
}
