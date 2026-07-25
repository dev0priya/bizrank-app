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
