import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
    try {
        const countries = await prisma.country.findMany({ orderBy: { name: 'asc' } });
        const states = await prisma.state.findMany({ orderBy: { name: 'asc' } });
        const cities: any[] = [];
        const areas: any[] = [];
        const categories = await prisma.businessCategory.findMany({ orderBy: { name: 'asc' } });

        return NextResponse.json({
            countries,
            states,
            cities,
            areas,
            categories
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
