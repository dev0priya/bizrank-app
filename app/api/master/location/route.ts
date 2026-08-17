import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, name, parentId } = body; // type = 'country' | 'state' | 'city'
        
        if (!name || !type) return NextResponse.json({ error: 'Name and type required' }, { status: 400 });

        let result;
        if (type === 'country') {
            result = await prisma.country.create({ data: { name } });
        } else if (type === 'state') {
            result = await prisma.state.create({ data: { name, countryId: parentId } });
        } else if (type === 'city') {
            result = await prisma.city.create({ data: { name, stateId: parentId } });
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = parseInt(searchParams.get('id') || '0');
        const type = searchParams.get('type');
        
        if (!id || !type) return NextResponse.json({ error: 'ID and type required' }, { status: 400 });

        if (type === 'country') {
            await prisma.country.delete({ where: { id } });
        } else if (type === 'state') {
            await prisma.state.delete({ where: { id } });
        } else if (type === 'city') {
            await prisma.city.delete({ where: { id } });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Delete failed. Ensure there are no dependent records linked to this location.' }, { status: 400 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const parentId = parseInt(searchParams.get('parentId') || '0');

        if (!type) {
            return NextResponse.json({ error: 'Type is required (state, district, subdistrict, city, area)' }, { status: 400 });
        }

        let data;
        if (type === 'state') {
            data = await prisma.state.findMany({
                where: parentId ? { countryId: parentId } : {},
                orderBy: { name: 'asc' }
            });
        } else if (type === 'district') {
            data = await prisma.district.findMany({
                where: parentId ? { stateId: parentId } : {},
                orderBy: { name: 'asc' }
            });
        } else if (type === 'subdistrict') {
            data = await prisma.subDistrict.findMany({
                where: parentId ? { districtId: parentId } : {},
                orderBy: { name: 'asc' }
            });
        } else if (type === 'city') {
            const stateId = parseInt(searchParams.get('stateId') || '0');
            const subdistrictId = parseInt(searchParams.get('subdistrictId') || '0');
            
            if (subdistrictId) {
                data = await prisma.city.findMany({
                    where: { subdistrictId },
                    orderBy: { name: 'asc' }
                });
            } else if (stateId) {
                // Fetch first 1000 cities of state if no subdistrict specified to prevent huge lists
                data = await prisma.city.findMany({
                    where: { stateId },
                    take: 1000,
                    orderBy: { name: 'asc' }
                });
            } else if (parentId) {
                data = await prisma.city.findMany({
                    where: { OR: [{ stateId: parentId }, { subdistrictId: parentId }] },
                    take: 1000,
                    orderBy: { name: 'asc' }
                });
            } else {
                data = await prisma.city.findMany({
                    take: 100,
                    orderBy: { name: 'asc' }
                });
            }
        } else if (type === 'area') {
            data = await prisma.area.findMany({
                where: parentId ? { cityId: parentId } : {},
                orderBy: { name: 'asc' }
            });
        } else {
            return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
