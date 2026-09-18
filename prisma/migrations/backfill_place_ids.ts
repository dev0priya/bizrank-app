import 'dotenv/config';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db';
import { PrismaClient } from '@prisma/client';
import { extractPlaceId } from '../../services/businessLinks';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Scanning businesses for place_id backfill ---');
  const businesses = await prisma.business.findMany({
    where: {
      place_id: null,
      google_maps_url: { not: null }
    },
    select: {
      id: true,
      business_name: true,
      google_maps_url: true
    }
  });

  console.log(`Found ${businesses.length} candidate businesses.`);
  let updatedCount = 0;

  for (const b of businesses) {
    const extractedId = extractPlaceId(b.google_maps_url);
    if (extractedId) {
      const existing = await prisma.business.findUnique({
        where: { place_id: extractedId }
      });
      if (!existing) {
        await prisma.business.update({
          where: { id: b.id },
          data: { place_id: extractedId }
        });
        updatedCount++;
        console.log(`[BACKFILLED] Business #${b.id} "${b.business_name}" -> place_id: ${extractedId}`);
      } else {
        console.log(`[SKIPPED] Collision for Business #${b.id} with existing record #${existing.id}`);
      }
    }
  }

  console.log(`--- Backfill complete: updated ${updatedCount} businesses. ---`);
}

main()
  .catch((e) => {
    console.error('Backfill error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
