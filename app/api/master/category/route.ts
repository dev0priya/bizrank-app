import { NextResponse } from 'next/server';
import { prisma } from '../../../../src/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name } = body;
        
        if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

        const category = await prisma.businessCategory.create({
            data: { name }
        });

        return NextResponse.json({ success: true, data: category });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = parseInt(searchParams.get('id') || '0');
        
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        // Check if category is in use
        const businessesUsingCategory = await prisma.business.count({
            where: { category_id: id }
        });

        if (businessesUsingCategory > 0) {
            return NextResponse.json({ error: `Cannot delete: Category is assigned to ${businessesUsingCategory} businesses.` }, { status: 400 });
        }

        await prisma.businessCategory.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
