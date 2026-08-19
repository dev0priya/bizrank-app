import { prisma } from '../lib/prisma';
import axios from 'axios';

async function runE2EVerification() {
  console.log('\n==========================================');
  console.log('E2E DISCOVERY FLOW VERIFICATION');
  console.log('==========================================\n');

  const BASE_URL = 'http://localhost:3000';

  // 1. Fetch Master States and Categories
  console.log('1. Fetching master states and categories...');
  const masterRes = await axios.get(`${BASE_URL}/api/master`);
  const states = masterRes.data.states;
  const categories = masterRes.data.categories;

  const delhi = states.find((s: any) => s.name === 'Delhi');
  const haryana = states.find((s: any) => s.name === 'Haryana');
  const salon = categories.find((c: any) => c.name === 'Salon');

  if (!delhi || !haryana || !salon) {
    throw new Error('Required seed data (Delhi, Haryana, or Salon category) not found in master data!');
  }
  console.log(`  ✅ Found Delhi (ID: ${delhi.id}), Haryana (ID: ${haryana.id}), and Salon (ID: ${salon.id})\n`);

  // 2. Test Location Autocomplete - Delhi Scoped
  console.log('2. Testing location search autocomplete: "Rohini" scoped to Delhi...');
  const searchDelhiRes = await axios.get(`${BASE_URL}/api/locations/search?q=Rohini&stateId=${delhi.id}`);
  const delhiLocations = searchDelhiRes.data.data;
  console.log(`  Found ${delhiLocations.length} suggestions:`, delhiLocations.map((l: any) => l.displayName));
  
  const rohini = delhiLocations.find((l: any) => l.name === 'Rohini');
  if (!rohini) {
    throw new Error('Rohini not found in Delhi scope suggestions!');
  }
  console.log('  ✅ Rohini autocomplete suggestion is valid.\n');

  // 3. Test Location Autocomplete Isolation - Rohini scoped to Haryana (should return empty)
  console.log('3. Testing location search isolation: "Rohini" scoped to Haryana...');
  const searchHaryanaRes = await axios.get(`${BASE_URL}/api/locations/search?q=Rohini&stateId=${haryana.id}`);
  const haryanaLocations = searchHaryanaRes.data.data;
  console.log(`  Found ${haryanaLocations.length} suggestions scoped to Haryana.`);
  if (haryanaLocations.length > 0) {
    throw new Error(`GEOGRAPHIC LEAK: Rohini suggestion leaked into Haryana scope: ${JSON.stringify(haryanaLocations)}`);
  }
  console.log('  ✅ Cross-state isolation passed (Rohini is not visible in Haryana).\n');

  // 4. Test Job Execution using Mock Provider
  console.log('4. Starting mock discovery job for Salon in Rohini, Delhi...');
  const jobPayload = {
    provider: 'mock',
    country: 'India',
    state: delhi.name,
    city: rohini.cityName,
    area: rohini.areaName,
    locationName: rohini.name,
    locationLat: rohini.latitude,
    locationLng: rohini.longitude,
    radiusKm: 5.0,
    category: salon.name,
    countryId: delhi.countryId,
    stateId: delhi.id,
    cityId: rohini.cityId,
    areaId: rohini.areaId,
    categoryId: salon.id,
    maxResults: 10,
  };

  const jobRes = await axios.post(`${BASE_URL}/api/jobs`, jobPayload);
  const jobId = jobRes.data.jobId;
  console.log(`  Discovery job started with ID: ${jobId}`);

  // 5. Poll Job until completion
  console.log('5. Polling job status until Completed...');
  let jobCompleted = false;
  let attempts = 0;
  while (!jobCompleted && attempts < 10) {
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 1500));
    const statusRes = await axios.get(`${BASE_URL}/api/jobs/${jobId}`);
    const status = statusRes.data.status;
    console.log(`  Attempt ${attempts}: status is "${status}"`);
    if (status === 'Completed') {
      jobCompleted = true;
    } else if (status === 'Failed') {
      throw new Error('Discovery job failed!');
    }
  }
  if (!jobCompleted) {
    throw new Error('Discovery job timed out!');
  }
  console.log('  ✅ Discovery job completed successfully.\n');

  // 6. Fetch and Verify Business Results
  console.log('6. Fetching and verifying discovery business results...');
  const bizRes = await axios.get(`${BASE_URL}/api/businesses?jobId=${jobId}`);
  const businesses = bizRes.data.data;
  console.log(`  Found ${businesses.length} businesses matching jobId ${jobId}`);
  if (businesses.length === 0) {
    throw new Error('No businesses returned for completed mock job!');
  }

  // Check some records
  for (const biz of businesses) {
    console.log(`  - Business: "${biz.business_name}"`);
    console.log(`    Address:  ${biz.full_address}`);
    console.log(`    Category: ${biz.category?.name} (ID: ${biz.category_id})`);
    console.log(`    Location: ${biz.city?.name}, ${biz.state?.name}`);
    console.log(`    Website:  ${biz.website} (${biz.website_status})`);
    console.log(`    Rating:   ${biz.rating} (${biz.review_count} reviews)`);
    console.log(`    Score:    ${biz.opportunity_score} (Level: ${biz.opportunity_level})`);

    // Verification asserts
    if (biz.state_id !== delhi.id) {
      throw new Error(`Result contains business from wrong state! Expected Delhi (${delhi.id}), got state_id ${biz.state_id}`);
    }
    if (biz.category_id !== salon.id) {
      throw new Error(`Result contains business with wrong category! Expected Salon (${salon.id}), got ${biz.category_id}`);
    }
    if (biz.opportunity_level === 'UNKNOWN') {
      throw new Error('Result has UNKNOWN opportunity level!');
    }
    if (biz.opportunity_score === null || biz.opportunity_score === undefined) {
      throw new Error('Result has null/undefined opportunity score!');
    }
  }
  console.log('  ✅ Geographic state isolation and category mapping validated successfully on all business results.\n');

  // 7. Test Add to CRM Lead Integration
  console.log('7. Testing CRM Lead creation for a discovery result...');
  const targetBiz = businesses[0];
  const crmRes = await axios.post(`${BASE_URL}/api/crm/leads`, { businessId: targetBiz.id });
  const leadId = crmRes.data.leadId;
  console.log(`  Created CRM lead with ID: ${leadId}`);

  // Fetch lead to verify
  const leadVerify = await prisma.cRMLead.findUnique({
    where: { id: leadId },
    include: { business: true }
  });
  if (!leadVerify) {
    throw new Error(`CRM Lead with ID ${leadId} not found in DB!`);
  }
  console.log(`  Verified CRM Lead details in DB: Business Name: "${leadVerify.business.business_name}", stageId: ${leadVerify.pipelineStageId}`);
  console.log('  ✅ Add to CRM lead flow verified.\n');

  console.log('==========================================');
  console.log('ALL E2E DISCOVERY VERIFICATIONS PASSED ✅');
  console.log('==========================================\n');
}

runE2EVerification()
  .catch(e => {
    console.error('❌ E2E Verification failed:', e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
