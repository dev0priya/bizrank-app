import { BusinessProvider, SearchParams } from './providerFactory';

// Deterministic hash function for string -> number
function xmur3(str: string) {
    let h = 1779033703 ^ str.length;
    for(let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = h << 13 | h >>> 19;
    }
    return function() {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
}

// PRNG generator
function mulberry32(a: number) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

export class MockProvider implements BusinessProvider {
    async startSearch(params: SearchParams) {
        // Create a determinist ID so it can be passed around
        const base64Params = Buffer.from(JSON.stringify(params)).toString('base64');
        const runId = 'mock-run-' + base64Params;
        
        console.log(`[MockProvider] Started mock search: ${JSON.stringify(params)}`);
        
        return {
            id: runId,
            status: 'SUCCEEDED',
            defaultDatasetId: 'mock-dataset-' + base64Params
        };
    }

    async checkRunStatus(runId: string) {
        return {
            id: runId,
            status: 'SUCCEEDED',
            defaultDatasetId: runId.replace('mock-run-', 'mock-dataset-')
        };
    }

    async getDatasetItems(datasetId: string) {
        const b64 = datasetId.replace('mock-dataset-', '');
        let params: SearchParams = {};
        try {
            params = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
        } catch(e) {}

        const { country, state, city, area, category, maxResults = 20 } = params;
        
        const seedStr = `${country}-${state}-${city}-${area}-${category}-${maxResults}`;
        const seed = xmur3(seedStr)();
        const rand = mulberry32(seed);

        const items = [];

        // Naming Maps
        const adjectives = ["The", "Elite", "Urban", "Royal", "Premium", "Aura", "Zen", "NextGen", "Smart", "Green", "Golden", "Silver", "Platinum"];
        
        const nounMap: Record<string, string[]> = {
            'Dental Clinic': ['Dental Care', 'Smiles', 'Dental Studio', 'Tooth Clinic', 'Dentistry', 'SmileCraft Dental'],
            'Skin Clinic': ['Skin Care', 'Derma Center', 'Glow Clinic', 'Aesthetics'],
            'Hair Transplant Clinic': ['Hair Clinic', 'Hair Solutions', 'Follicle Center'],
            'IVF Center': ['IVF Center', 'Fertility Clinic', 'Life Center'],
            'Hospital': ['Hospital', 'Medical Center', 'Healthcare'],
            'Diagnostic Lab': ['Diagnostics', 'Path Labs', 'Testing Center'],
            'Physiotherapy Clinic': ['Physio Care', 'Rehab Center', 'Movement Clinic'],
            'Salon': ['Salon', 'Hair Studio', 'Cuts & Colors', 'Beauty Bar', 'Studio One Salon'],
            'Luxury Salon': ['Luxe Salon', 'Premium Hair', 'Velvet Salon', 'House of Elegance'],
            'Spa': ['Wellness Spa', 'Retreat', 'Relaxation Center'],
            'Gym': ['Fitness', 'Gym', 'Iron Club', 'Active', 'FitLab Gym', 'Elite Fitness Club'],
            'Restaurant': ['Dine', 'Bistro', 'Eats', 'Kitchen', 'The Brew Yard Cafe'],
            'Cafe': ['Cafe', 'Roasters', 'Coffee House', 'Brewery'],
            'Cloud Kitchen': ['Kitchens', 'Foods', 'Delivery'],
            'Bakery': ['Bakes', 'Oven', 'Patisserie'],
            'Hotel': ['Residency', 'Inn', 'Stay', 'Hotel', 'Royal Residency', 'Hotel Riverstone'],
            'Resort': ['Resort', 'Retreat', 'Oasis', 'Green Leaf Resort'],
            'Homestay': ['Homestay', 'Villa', 'Cottage', 'Mountain Stay'],
            'Airbnb Host': ['BnB', 'Stay', 'Villa'],
            'Travel Agency': ['Travels', 'Tours', 'Holidays'],
            'Tour Operator': ['Tours', 'Adventures', 'Expeditions'],
            'Real Estate Agency': ['Real Estate', 'Properties', 'Realty'],
            'Architect': ['Architects', 'Design', 'Skyline Architects'],
            'Interior Designer': ['Interiors', 'Design Studio', 'Decor'],
            'Furniture Store': ['Furniture', 'Woodworks', 'Home Decor', 'Urban Living Furniture'],
            'Clothing Store': ['Apparel', 'Garments', 'Urban Threads'],
            'Boutique': ['Boutique', 'The Velvet Closet', 'Studio'],
            'Designer Boutique': ['Designer Wear', 'Couture', 'Fashion'],
            'Jewellery Store': ['Jewellers', 'Gems', 'Ornaments'],
            'Optical Store': ['Opticals', 'Vision', 'Eye Care'],
            'Software Company': ['Tech', 'Solutions', 'Systems', 'Digital', 'Noida Tech Solutions', 'PixelCraft Studio'],
            'IT Company': ['IT Solutions', 'Technologies', 'Systems'],
            'Law Firm': ['Legal', 'Law Associates', 'Chambers'],
            'CA Firm': ['Associates', 'Advisors', 'Chartered Accountants'],
            'Wedding Planner': ['Weddings', 'Event Planners', 'Dream Wedding Planners']
        };

        const defaultNouns = ['Center', 'Hub', 'Group', 'Associates', 'Studio'];

        for (let i = 0; i < maxResults; i++) {
            const templateType = Math.floor(rand() * 3);
            let businessName = "";
            const nouns = nounMap[category || ''] || defaultNouns;
            
            const adj = adjectives[Math.floor(rand() * adjectives.length)];
            const noun = nouns[Math.floor(rand() * nouns.length)];
            
            // Format 0: Adj + Noun (e.g. Aura Salon)
            // Format 1: Area + Noun (e.g. Pitampura Dental Care)
            // Format 2: Hardcoded Noun if it's already a full name (e.g. Urban Threads)
            
            if (noun.includes(' ') && rand() > 0.5) {
                // E.g., "Dream Wedding Planners"
                businessName = noun;
                // Prepend Area sometimes
                if (rand() > 0.7 && area) {
                    businessName = `${area} ${noun}`;
                }
            } else if (templateType === 0) {
                businessName = `${adj} ${noun}`;
            } else if (templateType === 1 && area) {
                businessName = `${area} ${noun}`;
            } else {
                businessName = `${adj} ${category || 'Business'} ${noun}`;
            }

            businessName = businessName.replace(/\s+/g, ' ').trim();

            // 40-60% of businesses have NO website
            const websiteProbability = 0.4 + (rand() * 0.2); // 0.4 to 0.6
            const hasWebsite = rand() > websiteProbability;
            
            let website = null;
            if (hasWebsite) {
                const domainSuffixes = ['.com', '.in', '.co.in'];
                let cleanName = businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (cleanName.length > 15) cleanName = cleanName.substring(0, 15);
                website = `https://www.${cleanName}${domainSuffixes[Math.floor(rand() * domainSuffixes.length)]}`;
            }

            const placeId = 'ChIJ' + Math.floor(rand() * 10000000000000000).toString(16) + 'mock';

            const fullAddress = `${Math.floor(rand() * 150) + 1}, ${area || 'Main Market'}, ${city || 'City'}, ${state || 'State'}`;

            items.push({
                placeId,
                title: businessName,
                categoryName: category,
                address: fullAddress,
                neighborhood: area,
                city: city,
                state: state,
                countryCode: "IN",
                phoneUnformatted: `+9198${Math.floor(rand() * 100000000).toString().padStart(8, '0')}`,
                website: website,
                url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessName + ' ' + fullAddress)}`,
                totalScore: 3.5 + (rand() * 1.5), 
                reviewsCount: Math.floor(rand() * 1000) + 5,
                location: {
                    lat: 20.0 + (rand() * 10),
                    lng: 70.0 + (rand() * 10)
                }
            });
        }

        return items;
    }
}
