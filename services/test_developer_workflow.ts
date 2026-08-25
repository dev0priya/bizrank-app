import { prisma } from '../lib/prisma';

async function runDeveloperWorkflowTest() {
  console.log('\n==================================================');
  console.log('CRM DEVELOPER WORKFLOW RELATIONSHIP TEST');
  console.log('==================================================\n');

  // 1. Fetch developer user accounts from DB
  const devs = await prisma.user.findMany({
    where: { role: 'DEVELOPER' }
  });
  console.log(`Found ${devs.length} seeded developer(s) in DB:`, devs.map(d => d.name));
  if (devs.length === 0) {
    throw new Error('No developers found in database! Seeding is required.');
  }

  // 2. Fetch Swati's account
  const swati = await prisma.user.findFirst({
    where: { role: 'COMMUNICATION' }
  });
  console.log(`Found Swati account: ${swati ? swati.name : 'NOT FOUND'}`);
  if (!swati) {
    throw new Error('Swati account not found in database! Seeding is required.');
  }

  // 3. Find or create a test Lead
  let lead = await prisma.cRMLead.findFirst({
    include: { business: true }
  });

  if (!lead) {
    console.log('No lead found. Promoting a business first...');
    const business = await prisma.business.findFirst();
    if (!business) {
      throw new Error('No business found to promote! Seeding is required.');
    }
    const defaultStage = await prisma.pipelineStage.findFirst();
    if (!defaultStage) {
      throw new Error('No pipeline stages found! Seeding is required.');
    }
    lead = await prisma.cRMLead.create({
      data: {
        businessId: business.id,
        pipelineStageId: defaultStage.id,
        priority: 'B',
        estimatedValue: 1000.0,
        leadScore: 50
      },
      include: { business: true }
    });
  }

  console.log(`Target Lead ID: ${lead.id} for business "${lead.business.business_name}"`);

  // 4. Test Developer Assignment
  const testDev = devs[0];
  console.log(`Assigning lead to developer "${testDev.name}"...`);
  
  const updatedLead = await prisma.cRMLead.update({
    where: { id: lead.id },
    data: {
      developerId: testDev.id,
      websiteStatus: 'ASSIGNED'
    },
    include: {
      developer: true,
      swati: true
    }
  });

  if (updatedLead.developerId !== testDev.id || updatedLead.developer?.name !== testDev.name) {
    throw new Error('Developer assignment failed!');
  }
  console.log('✅ Developer assigned successfully.');

  // 5. Test Swati (Communication) Assignment
  console.log(`Assigning communication role to "${swati.name}"...`);
  const withSwatiLead = await prisma.cRMLead.update({
    where: { id: lead.id },
    data: {
      swatiId: swati.id,
      handoffStatus: 'HANDED_OVER',
      handoffDate: new Date()
    },
    include: {
      developer: true,
      swati: true
    }
  });

  if (withSwatiLead.swatiId !== swati.id || withSwatiLead.swati?.name !== swati.name) {
    throw new Error('Swati assignment failed!');
  }
  console.log('✅ Swati (communication) assigned and handoff status updated successfully.');

  // 6. Verify Fetch Lead Details includes swati relationship
  console.log('Verifying include block queries return both developer and swati relations...');
  const leadDetails = await prisma.cRMLead.findUnique({
    where: { id: lead.id },
    include: {
      developer: true,
      swati: true
    }
  });

  if (!leadDetails || !leadDetails.developer || !leadDetails.swati) {
    throw new Error('Relationship fetching failed! Developer or Swati relation not returned.');
  }

  console.log('✅ Relationship fetching test passed successfully.');
  console.log(`   Lead developer: ${leadDetails.developer.name}`);
  console.log(`   Lead communication: ${leadDetails.swati.name}`);

  console.log('\n==================================================');
  console.log('ALL DEVELOPER WORKFLOW CHECKS PASSED ✅');
  console.log('==================================================\n');
}

runDeveloperWorkflowTest()
  .catch(err => {
    console.error('❌ Developer workflow test failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
