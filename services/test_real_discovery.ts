import { prisma } from '../lib/prisma';
import axios from 'axios';
import { validateGoogleMapsUrl, validateWebsiteUrl } from './businessLinks';

async function runRealDiscoveryTest() {
  console.log('\n============================================================');
  console.log('REAL BUSINESS DISCOVERY & LINK ACCURACY VERIFICATION');
  console.log('============================================================\n');

  const BASE_URL = 'http://localhost:3000';

  // 1. Fetch Delhi and Salon category
  console.log('1. Fetching master states and categories...');
  const masterRes = await axios.get(`${BASE_URL}/api/master`);
  const states = masterRes.data.states;
  const categories = masterRes.data.categories;

  const delhi = states.find((s: any) => s.name === 'Delhi');
  const salon = categories.find((c: any) => c.name === 'Salon');

  if (!delhi || !salon) {
    throw new Error('Required Delhi state or Salon category not found!');
  }
  console.log(`   Found Delhi State ID: ${delhi.id}, Salon Category ID: ${salon.id}\n`);

  // 2. Resolve Rohini location autocomplete
  console.log('2. Querying location autocomplete: "Rohini" scoped to Delhi...');
  const searchDelhiRes = await axios.get(`${BASE_URL}/api/locations/search?q=Rohini&stateId=${delhi.id}`);
  const delhiLocations = searchDelhiRes.data.data;
  const rohini = delhiLocations.find((l: any) => l.name === 'Rohini');

  if (!rohini) {
    throw new Error('Rohini location autocomplete not found under Delhi state!');
  }
  console.log(`   Found Rohini Location: ${rohini.displayName} (ID: ${rohini.areaId || rohini.cityId})\n`);

  // 3. Trigger Discovery Job using Apify provider
  console.log('3. Triggering Discovery Job with "apify" provider (Delhi -> Rohini -> Salon)...');
  const jobPayload = {
    provider: 'apify',
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
    maxResults: 5, // fetch 5 results for detailed manual verification
  };

  const jobRes = await axios.post(`${BASE_URL}/api/jobs`, jobPayload);
  const jobId = jobRes.data.jobId;
  console.log(`   Discovery job started with ID: ${jobId}. Polling for completion...\n`);

  // 4. Poll job status
  let completed = false;
  let attempts = 0;
  while (!completed && attempts < 40) {
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5 seconds between polls
    const statusRes = await axios.get(`${BASE_URL}/api/jobs/${jobId}`);
    const status = statusRes.data.status;
    console.log(`   [Poll ${attempts}] Job status: ${status}`);
    if (status === 'Completed') {
      completed = true;
    } else if (status === 'Failed') {
      throw new Error('Apify Discovery job failed on actor execution.');
    }
  }

  if (!completed) {
    throw new Error('Apify Discovery job timed out after 200 seconds.');
  }
  console.log('\n   ✅ Discovery job completed successfully!\n');

  // 5. Fetch and verify results
  console.log('5. Fetching discovered businesses to perform link verification...');
  const bizRes = await axios.get(`${BASE_URL}/api/businesses?jobId=${jobId}`);
  const businesses = bizRes.data.data;

  console.log(`   Fetched ${businesses.length} real businesses.\n`);
  if (businesses.length < 5) {
    console.warn(`⚠️ Warning: Expected at least 5 businesses, but got ${businesses.length}.`);
  }

  // Iterate over businesses and print verification report
  const verifiedList = [];
  for (let i = 0; i < Math.min(businesses.length, 5); i++) {
    const b = businesses[i];
    console.log(`------------------------------------------------------------`);
    console.log(`BUSINESS ${i + 1}:`);
    console.log(`Name:              ${b.business_name}`);
    console.log(`Address:           ${b.full_address || 'No Address'}`);
    console.log(`Rating:            ${b.rating || 'No Rating'} (${b.review_count || 0} reviews)`);
    console.log(`Website:           ${b.website || 'No Website'}`);
    console.log(`Website Status:    ${b.website_status}`);
    console.log(`Google Maps URL:   ${b.google_maps_url || 'No Maps URL'}`);
    console.log(`Provider / Place ID: ${b.provider} / ${b.place_id || 'No Place ID'}`);

    // Verification check: Maps URL
    let mapsPass = false;
    if (b.google_maps_url) {
      mapsPass = validateGoogleMapsUrl(b.google_maps_url, b.place_id);
    }

    // Verification check: Website
    let websitePass = true;
    if (b.website) {
      websitePass = validateWebsiteUrl(b.website);
    }

    // Verification check: Place ID exists
    const placeIdPass = !!b.place_id;

    // Separation of links check
    const separationPass = b.google_maps_url !== b.website;

    console.log(`Link Separation:   ${separationPass ? 'PASS (different)' : 'FAIL (matching)'}`);
    console.log(`Maps URL Valid:    ${mapsPass ? 'PASS' : 'FAIL (requires query_place_id)'}`);
    console.log(`Website Valid:     ${websitePass ? 'PASS' : 'FAIL'}`);
    console.log(`Place ID Present:  ${placeIdPass ? 'PASS' : 'FAIL'}`);

    verifiedList.push({
      name: b.business_name,
      rating: b.rating,
      reviews: b.review_count,
      website: b.website,
      website_status: b.website_status,
      mapsUrl: b.google_maps_url,
      placeId: b.place_id,
      mapsPass,
      websitePass,
      placeIdPass,
      separationPass
    });
  }

  console.log(`\n============================================================\n`);

  // 6. Test CRM integration promotion preservation
  if (businesses.length > 0) {
    const testBiz = businesses[0];
    console.log(`6. Testing CRM Lead promotion for: "${testBiz.business_name}"...`);
    const crmRes = await axios.post(`${BASE_URL}/api/crm/leads`, { businessId: testBiz.id });
    const leadId = crmRes.data.leadId;
    console.log(`   CRM Lead promoted successfully (ID: ${leadId}).`);

    const dbLead = await prisma.cRMLead.findUnique({
      where: { id: leadId },
      include: { business: true }
    });

    if (!dbLead) {
      throw new Error('CRM Lead could not be retrieved from database!');
    }

    // Compare fields
    const matches = (
      dbLead.business.business_name === testBiz.business_name &&
      dbLead.business.place_id === testBiz.place_id &&
      dbLead.business.google_maps_url === testBiz.google_maps_url &&
      dbLead.business.website === testBiz.website &&
      dbLead.business.website_status === testBiz.website_status &&
      dbLead.business.full_address === testBiz.full_address &&
      dbLead.business.phone_number === testBiz.phone_number
    );

    if (matches) {
      console.log('   ✅ CRM Link & Meta Preservation: PASS');
    } else {
      console.error('   ❌ CRM Link & Meta Preservation: FAIL');
      console.error('Diff details:', {
        name: { original: testBiz.business_name, db: dbLead.business.business_name },
        placeId: { original: testBiz.place_id, db: dbLead.business.place_id },
        mapsUrl: { original: testBiz.google_maps_url, db: dbLead.business.google_maps_url },
        website: { original: testBiz.website, db: dbLead.business.website }
      });
      throw new Error('CRM Lead does not match the promoted business properties!');
    }
  }

  console.log('\nAll programmatic verifications completed.\n');
}

runRealDiscoveryTest()
  .catch(err => {
    console.error('Error during real discovery test execution:', err.message || err);
    process.exit(1);
  });
