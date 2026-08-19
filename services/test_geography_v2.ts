import { prisma } from '../lib/prisma';

// ==========================================
// GEOGRAPHY INTEGRATION TESTS V2
// Tests all 10 required states
// Tests cross-state isolation
// Tests location search API
// ==========================================

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}`);
    failed++;
  }
}

async function testGeographyV2() {
  console.log('\n==========================================');
  console.log('GEOGRAPHY INTEGRATION TESTS V2');
  console.log('==========================================\n');

  // -------------------------------------------
  // 1. Verify all required states exist
  // -------------------------------------------
  console.log('Test Group 1: All required states present');
  const requiredStates = [
    'Delhi', 'Haryana', 'Punjab', 'Uttar Pradesh', 'Uttarakhand',
    'Rajasthan', 'Maharashtra', 'Gujarat', 'Karnataka', 'Kerala',
    'Tamil Nadu', 'Telangana', 'West Bengal', 'Assam', 'Bihar',
    'Madhya Pradesh', 'Chhattisgarh', 'Odisha', 'Jharkhand',
    'Andhra Pradesh', 'Himachal Pradesh', 'Goa', 'Chandigarh',
    'Jammu and Kashmir', 'Sikkim', 'Nagaland', 'Manipur',
    'Meghalaya', 'Tripura', 'Mizoram', 'Arunachal Pradesh',
    'Puducherry', 'Ladakh',
  ];

  const allStates = await prisma.state.findMany({ select: { name: true, type: true } });
  const stateNames = allStates.map(s => s.name);

  for (const name of requiredStates) {
    assert(stateNames.includes(name), `State exists: ${name}`);
  }

  // -------------------------------------------
  // 2. Verify UTs vs States
  // -------------------------------------------
  console.log('\nTest Group 2: State types correct');
  const delhi = allStates.find(s => s.name === 'Delhi');
  assert(delhi?.type === 'UNION_TERRITORY', 'Delhi is UNION_TERRITORY');
  const chandigarh = allStates.find(s => s.name === 'Chandigarh');
  assert(chandigarh?.type === 'UNION_TERRITORY', 'Chandigarh is UNION_TERRITORY');
  const maharashtra = allStates.find(s => s.name === 'Maharashtra');
  assert(maharashtra?.type === 'STATE', 'Maharashtra is STATE');
  const karnataka = allStates.find(s => s.name === 'Karnataka');
  assert(karnataka?.type === 'STATE', 'Karnataka is STATE');

  // -------------------------------------------
  // 3. Delhi city-state containment
  // -------------------------------------------
  console.log('\nTest Group 3: Delhi geographic containment');
  const delhiState = await prisma.state.findFirst({ where: { name: 'Delhi' } });
  assert(!!delhiState, 'Delhi state exists');

  const delhiCity = await prisma.city.findFirst({ where: { name: 'Delhi', stateId: delhiState!.id } });
  assert(!!delhiCity, 'Delhi city exists under Delhi state');
  assert(delhiCity!.stateId === delhiState!.id, 'Delhi city stateId matches Delhi state id');

  const delhiAreas = await prisma.area.findMany({ where: { cityId: delhiCity!.id } });
  const delhiAreaNames = delhiAreas.map(a => a.name.toLowerCase());
  assert(delhiAreaNames.includes('rohini'), 'Delhi has Rohini area');
  assert(delhiAreaNames.includes('pitampura'), 'Delhi has Pitampura area');
  assert(delhiAreaNames.includes('dwarka'), 'Delhi has Dwarka area');
  assert(delhiAreaNames.includes('karol bagh'), 'Delhi has Karol Bagh area');

  // -------------------------------------------
  // 4. Cross-state isolation test
  // -------------------------------------------
  console.log('\nTest Group 4: Cross-state isolation');
  const haryanaState = await prisma.state.findFirst({ where: { name: 'Haryana' } });
  assert(!!haryanaState, 'Haryana state exists');
  assert(haryanaState!.id !== delhiState!.id, 'Haryana and Delhi have different state IDs');

  // Rohtak must be in Haryana only
  const rohtakCity = await prisma.city.findFirst({ where: { name: 'Rohtak' } });
  assert(!!rohtakCity, 'Rohtak city exists');
  assert(rohtakCity!.stateId === haryanaState!.id, 'Rohtak is in Haryana, not Delhi');

  // Areas under Delhi city must NOT include Haryana areas
  const illegalHaryanaAreas = ['cyber city', 'dlf phase 1', 'ambala cantt'];
  const hasLeakedHaryana = illegalHaryanaAreas.some(a => delhiAreaNames.includes(a));
  assert(!hasLeakedHaryana, 'Delhi areas contain no Haryana area names');

  // -------------------------------------------
  // 5. Haryana city containment
  // -------------------------------------------
  console.log('\nTest Group 5: Haryana geographic containment');
  const gurugramCity = await prisma.city.findFirst({ where: { name: 'Gurugram' } });
  assert(!!gurugramCity, 'Gurugram exists');
  assert(gurugramCity!.stateId === haryanaState!.id, 'Gurugram is in Haryana');

  const gurugramAreas = await prisma.area.findMany({ where: { cityId: gurugramCity!.id } });
  const gurugramAreaNames = gurugramAreas.map(a => a.name.toLowerCase());
  assert(gurugramAreaNames.includes('cyber city'), 'Gurugram has Cyber City area');
  assert(gurugramAreaNames.includes('dlf phase 1'), 'Gurugram has DLF Phase 1 area');
  assert(!gurugramAreaNames.includes('rohini'), 'Gurugram does NOT have Rohini (Delhi area)');

  // -------------------------------------------
  // 6. Maharashtra city containment
  // -------------------------------------------
  console.log('\nTest Group 6: Maharashtra geographic containment');
  const maharashtraState = await prisma.state.findFirst({ where: { name: 'Maharashtra' } });
  const mumbaiCity = await prisma.city.findFirst({ where: { name: 'Mumbai' } });
  assert(!!mumbaiCity, 'Mumbai exists');
  assert(mumbaiCity!.stateId === maharashtraState!.id, 'Mumbai is in Maharashtra');

  const mumbaiAreas = await prisma.area.findMany({ where: { cityId: mumbaiCity!.id } });
  const mumbaiAreaNames = mumbaiAreas.map(a => a.name.toLowerCase());
  assert(mumbaiAreaNames.includes('bandra'), 'Mumbai has Bandra');
  assert(mumbaiAreaNames.includes('andheri'), 'Mumbai has Andheri');
  assert(!mumbaiAreaNames.includes('rohini'), 'Mumbai does NOT have Rohini (Delhi)');
  assert(!mumbaiAreaNames.includes('cyber city'), 'Mumbai does NOT have Cyber City (Gurugram)');

  // -------------------------------------------
  // 7. Karnataka city containment
  // -------------------------------------------
  console.log('\nTest Group 7: Karnataka geographic containment');
  const karnatakaState = await prisma.state.findFirst({ where: { name: 'Karnataka' } });
  const bengaluruCity = await prisma.city.findFirst({ where: { name: 'Bengaluru' } });
  assert(!!bengaluruCity, 'Bengaluru exists');
  assert(bengaluruCity!.stateId === karnatakaState!.id, 'Bengaluru is in Karnataka');

  const bengaluruAreas = await prisma.area.findMany({ where: { cityId: bengaluruCity!.id } });
  const bengaluruAreaNames = bengaluruAreas.map(a => a.name.toLowerCase());
  assert(bengaluruAreaNames.includes('koramangala'), 'Bengaluru has Koramangala');
  assert(bengaluruAreaNames.includes('indiranagar'), 'Bengaluru has Indiranagar');
  assert(bengaluruAreaNames.includes('whitefield'), 'Bengaluru has Whitefield');
  assert(!bengaluruAreaNames.includes('banjara hills'), 'Bengaluru does NOT have Banjara Hills (Hyderabad)');

  // -------------------------------------------
  // 8. SearchLocation state scoping
  // -------------------------------------------
  console.log('\nTest Group 8: SearchLocation state scoping');
  const rohinSearchInDelhi = await prisma.searchLocation.findMany({
    where: {
      stateId: delhiState!.id,
      name: { contains: 'Rohini', mode: 'insensitive' },
    }
  });
  assert(rohinSearchInDelhi.length > 0, 'Rohini found in Delhi SearchLocation scope');

  // Searching for Rohini scoped to Haryana should return nothing (Rohini is Delhi)
  const rohinSearchInHaryana = await prisma.searchLocation.findMany({
    where: {
      stateId: haryanaState!.id,
      name: { equals: 'Rohini', mode: 'insensitive' },
    }
  });
  assert(rohinSearchInHaryana.length === 0, 'Rohini NOT found in Haryana SearchLocation scope (cross-state isolation)');

  // Gurugram found in Haryana scope
  const gurugramSearch = await prisma.searchLocation.findMany({
    where: {
      stateId: haryanaState!.id,
      name: { contains: 'Gurugram', mode: 'insensitive' },
    }
  });
  assert(gurugramSearch.length > 0, 'Gurugram found in Haryana SearchLocation scope');

  // -------------------------------------------
  // 9. Category data
  // -------------------------------------------
  console.log('\nTest Group 9: Business Category data');
  const cats = await prisma.businessCategory.findMany();
  assert(cats.length >= 50, `Enough categories seeded: ${cats.length}`);
  const salonCat = cats.find(c => c.name === 'Salon');
  assert(!!salonCat, 'Salon category exists');
  assert(salonCat!.opportunityEligible === true, 'Salon is opportunity eligible');
  assert(salonCat!.websiteOpportunityWeight >= 0.85, `Salon has high opportunity weight: ${salonCat?.websiteOpportunityWeight}`);
  
  const atmCat = cats.find(c => c.name === 'ATM');
  assert(!!atmCat, 'ATM category exists');
  assert(atmCat!.opportunityEligible === false, 'ATM is NOT opportunity eligible');
  assert(atmCat!.websiteOpportunityWeight === 0, 'ATM has 0 opportunity weight');

  // -------------------------------------------
  // SUMMARY
  // -------------------------------------------
  console.log('\n==========================================');
  if (failed === 0) {
    console.log(`ALL ${passed} TESTS PASSED ✅`);
  } else {
    console.log(`${passed} passed, ${failed} FAILED ❌`);
  }
  console.log('==========================================\n');

  if (failed > 0) process.exit(1);
}

testGeographyV2()
  .catch(e => {
    console.error('Geography test crashed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
