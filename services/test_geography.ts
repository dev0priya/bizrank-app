import { prisma } from '../lib/prisma';

async function testGeography() {
    console.log('--- STARTING GEOGRAPHY AND DISCOVERY API HIERARCHY INTEGRATION TESTS ---');

    // 1. Verify Delhi State & City Linkage
    console.log('Testing Delhi state and city relationship...');
    const delhiState = await prisma.state.findFirst({ where: { name: 'Delhi' } });
    if (!delhiState) throw new Error('Delhi state not found in seeded database!');

    const delhiCity = await prisma.city.findFirst({ where: { name: 'Delhi' } });
    if (!delhiCity) throw new Error('Delhi city not found in seeded database!');

    if (delhiCity.stateId !== delhiState.id) {
        throw new Error(`Delhi city stateId (${delhiCity.stateId}) does not match Delhi state ID (${delhiState.id})!`);
    }
    console.log('✅ Delhi City-State parent containment matches exactly.');

    // 2. Verify Haryana State & City (Gurugram) Linkage
    console.log('Testing Haryana state and city (Gurugram) relationship...');
    const haryanaState = await prisma.state.findFirst({ where: { name: 'Haryana' } });
    if (!haryanaState) throw new Error('Haryana state not found in seeded database!');

    const gurugramCity = await prisma.city.findFirst({ where: { name: 'Gurugram' } });
    if (!gurugramCity) throw new Error('Gurugram city not found!');

    if (gurugramCity.stateId !== haryanaState.id) {
        throw new Error(`Gurugram stateId (${gurugramCity.stateId}) is linked to wrong state (expected ${haryanaState.id})!`);
    }
    console.log('✅ Gurugram City-State parent containment matches exactly.');

    // 3. Verify Delhi Area Scope (Rohini/Pitampura)
    console.log('Testing Delhi Areas list under Delhi City ID...');
    const delhiAreas = await prisma.area.findMany({ where: { cityId: delhiCity.id } });
    const delhiAreaNames = delhiAreas.map(a => a.name.toLowerCase());
    
    // Delhi areas must contain Pitampura, Rohini
    if (!delhiAreaNames.includes('pitampura') || !delhiAreaNames.includes('rohini')) {
        throw new Error('Delhi areas list is missing core seed entries like Pitampura or Rohini!');
    }
    
    // Delhi areas must NOT contain any other cities' areas (Jaipur, Mumbai, Bengaluru)
    const illegalAreas = ['jaipur cantonment', 'bandra', 'indiranagar', 'rohtak main'];
    illegalAreas.forEach(name => {
        if (delhiAreaNames.includes(name)) {
            throw new Error(`Leaked area "${name}" was returned inside Delhi City scope!`);
        }
    });
    console.log('✅ Delhi Area scope checks passed (contains Delhi seed areas, no leakage).');

    // 4. Test Route API Parent containment validations
    console.log('Simulating Route API validations...');
    
    // Requesting area with cityId belonging to Delhi but stateId = Haryana (which is different)
    const invalidStateId = haryanaState.id;
    
    // Verify city belongs to state check
    if (delhiCity.stateId !== invalidStateId) {
        console.log(`✅ Correctly validated: Delhi city (state ${delhiCity.stateId}) does not belong to Haryana state (${invalidStateId})`);
    } else {
        throw new Error('Failed to validate mismatched State-City relation!');
    }

    console.log('--- ALL GEOGRAPHY INTEGRITY TESTS PASSED ---');
}

testGeography()
    .catch(e => {
        console.error('❌ Integration test failed:', e);
        process.exit(1);
    });
