import { NextResponse } from 'next/server';
import { prisma } from '../../../src/lib/prisma';

export async function POST(request: Request) {
  try {
    const { id, status } = await request.json();
    
    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    // Update business status
    await prisma.business.update({
      where: { id: Number(id) },
      data: { crm_status: status }
    });

    // Add timeline event for the manual status change
    await prisma.timelineEvent.create({
      data: {
        business_id: Number(id),
        action: `Status Updated manually to ${status}`,
        user: 'Admin'
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Status update failed:', error);
    return NextResponse.json({ error: 'Failed to update status', details: error.message }, { status: 503 });
  }
}
