import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
    try {
        const countries = await prisma.country.findMany();
        const states = await prisma.state.findMany();
        const cities = await prisma.city.findMany();
        const areas = await prisma.area.findMany();
        const categories = await prisma.businessCategory.findMany();

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
