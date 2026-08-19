import { prisma } from '../lib/prisma';

async function seedStages() {
    console.log('--- SEEDING/UPDATING CRM PIPELINE STAGES ---');

    // 1. Find or create default pipeline
    let pipeline = await prisma.pipeline.findUnique({
        where: { name: 'Sales Pipeline' }
    });

    if (!pipeline) {
        pipeline = await prisma.pipeline.create({
            data: { name: 'Sales Pipeline' }
        });
        console.log(`Created pipeline: "${pipeline.name}"`);
    } else {
        console.log(`Found pipeline: "${pipeline.name}"`);
    }

    // 2. Define stages with order
    const defaultStages = [
        { name: 'New', order: 1 },
        { name: 'Contacted', order: 2 },
        { name: 'Interested', order: 3 },
        { name: 'Meeting Scheduled', order: 4 },
        { name: 'Proposal Sent', order: 5 },
        { name: 'Negotiation', order: 6 },
        { name: 'Closed Won', order: 7 },
        { name: 'Closed Lost', order: 8 }
    ];

    // 3. Upsert stages to prevent breaking existing leads
    for (const stage of defaultStages) {
        const existing = await prisma.pipelineStage.findFirst({
            where: { name: stage.name, pipelineId: pipeline.id }
        });

        if (existing) {
            // Update order
            await prisma.pipelineStage.update({
                where: { id: existing.id },
                data: { order: stage.order }
            });
            console.log(`Updated Stage order: "${stage.name}" -> Order ${stage.order}`);
        } else {
            // Create stage
            const created = await prisma.pipelineStage.create({
                data: {
                    name: stage.name,
                    order: stage.order,
                    pipelineId: pipeline.id
                }
            });
            console.log(`Created Stage: "${stage.name}" -> Order ${stage.order} (ID: ${created.id})`);
        }
    }

    console.log('✅ Pipeline stage seeding complete!');
}

seedStages()
    .catch((e) => {
        console.error('❌ Stage seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
