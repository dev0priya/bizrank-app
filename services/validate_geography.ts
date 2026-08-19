import { prisma } from '../lib/prisma';

async function validateGeography() {
    console.log('--- STARTING GEOGRAPHIC DATABASE INTEGRITY VALIDATION ---');
    let hasCriticalError = false;

    // 1. Fetch counts
    const countries = await prisma.country.findMany();
    const states = await prisma.state.findMany();
    const districts = await prisma.district.findMany();
    const subdistricts = await prisma.subDistrict.findMany();
    const cities = await prisma.city.findMany({ include: { subdistrict: { include: { district: true } } } });
    const areas = await prisma.area.findMany({ include: { city: { include: { subdistrict: { include: { district: true } } } } } });

    console.log(`Total Countries: ${countries.length}`);
    console.log(`Total States: ${states.length}`);
    console.log(`Total Districts: ${districts.length}`);
    console.log(`Total Subdistricts: ${subdistricts.length}`);
    console.log(`Total Cities: ${cities.length}`);
    console.log(`Total Areas: ${areas.length}`);

    // 2. Orphan Checks
    const countryIds = new Set(countries.map(c => c.id));
    const stateIds = new Set(states.map(s => s.id));
    const districtIds = new Set(districts.map(d => d.id));
    const subdistrictIds = new Set(subdistricts.map(sd => sd.id));
    const cityIds = new Set(cities.map(c => c.id));

    // Orphan States (no country)
    const orphanStates = states.filter(s => !countryIds.has(s.countryId));
    // Orphan Districts (no state)
    const orphanDistricts = districts.filter(d => !stateIds.has(d.stateId));
    // Orphan Subdistricts (no district)
    const orphanSubdistricts = subdistricts.filter(sd => !districtIds.has(sd.districtId));
    // Orphan Cities (no state and no subdistrict)
    const orphanCities = cities.filter(c => (!c.stateId && !c.subdistrictId) || (c.stateId && !stateIds.has(c.stateId)));
    // Orphan Areas (no city)
    const orphanAreas = areas.filter(a => !cityIds.has(a.cityId));

    console.log(`Orphan States: ${orphanStates.length}`);
    console.log(`Orphan Districts: ${orphanDistricts.length}`);
    console.log(`Orphan Cities: ${orphanCities.length}`);
    console.log(`Orphan Areas: ${orphanAreas.length}`);

    if (orphanStates.length > 0 || orphanDistricts.length > 0 || orphanCities.length > 0 || orphanAreas.length > 0) {
        console.error('❌ Orphan records detected!');
        hasCriticalError = true;
    }

    // 3. Duplicate Checks under same parent
    const duplicateStates: string[] = [];
    const stateNameSet = new Set<string>();
    states.forEach(s => {
        const key = `${s.countryId}_${s.name.toLowerCase()}`;
        if (stateNameSet.has(key)) duplicateStates.push(s.name);
        stateNameSet.add(key);
    });

    const duplicateDistricts: string[] = [];
    const distNameSet = new Set<string>();
    districts.forEach(d => {
        const key = `${d.stateId}_${d.name.toLowerCase()}`;
        if (distNameSet.has(key)) duplicateDistricts.push(d.name);
        distNameSet.add(key);
    });

    const duplicateCities: string[] = [];
    const cityNameSet = new Set<string>();
    cities.forEach(c => {
        const key = `${c.stateId}_${c.subdistrictId}_${c.name.toLowerCase()}`;
        if (cityNameSet.has(key)) duplicateCities.push(c.name);
        cityNameSet.add(key);
    });

    const duplicateAreas: string[] = [];
    const areaNameSet = new Set<string>();
    areas.forEach(a => {
        const key = `${a.cityId}_${a.name.toLowerCase()}`;
        if (areaNameSet.has(key)) duplicateAreas.push(a.name);
        areaNameSet.add(key);
    });

    console.log(`Duplicate States: ${duplicateStates.length}`);
    console.log(`Duplicate Districts: ${duplicateDistricts.length}`);
    console.log(`Duplicate Cities: ${duplicateCities.length}`);
    console.log(`Duplicate Areas: ${duplicateAreas.length}`);

    // 4. Cross-State and Cross-City Isolation Checks
    let crossStateCitiesCount = 0;
    cities.forEach(c => {
        if (c.subdistrict && c.stateId) {
            const districtStateId = c.subdistrict.district.stateId;
            if (districtStateId !== c.stateId) {
                crossStateCitiesCount++;
                console.error(`❌ City "${c.name}" (ID ${c.id}) is linked to State ID ${c.stateId} but parent district is in State ID ${districtStateId}`);
            }
        }
    });

    let crossCityAreasCount = 0;
    areas.forEach(a => {
        if (a.city && a.city.stateId) {
            // If parent state mismatches area city's state
            const areaStateId = a.city.stateId;
            // Cross-state area verification
            if (!stateIds.has(areaStateId)) {
                crossCityAreasCount++;
                console.error(`❌ Area "${a.name}" (ID ${a.id}) city links to invalid State ID ${areaStateId}`);
            }
        }
    });

    console.log(`Cross-State Cities: ${crossStateCitiesCount}`);
    console.log(`Cross-City Areas: ${crossCityAreasCount}`);

    if (crossStateCitiesCount > 0 || crossCityAreasCount > 0) {
        console.error('❌ Cross-geographic isolation leakage detected!');
        hasCriticalError = true;
    }

    if (hasCriticalError) {
        console.error('--- GEOGRAPHIC VALIDATION FAILED ---');
        process.exit(1);
    } else {
        console.log('✅ ALL GEOGRAPHIC INTEGRITY CHECKS PASSED SUCCESSFULLY!');
        process.exit(0);
    }
}

validateGeography()
    .catch(e => {
        console.error('Validation script crash:', e);
        process.exit(1);
    });
