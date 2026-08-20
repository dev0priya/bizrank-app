import { BusinessProvider, SearchParams } from './providerFactory';

export class GooglePlacesProvider implements BusinessProvider {
    private apiKey: string;

    constructor() {
        this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
        if (!this.apiKey) {
            console.warn('[GooglePlacesProvider] WARNING: GOOGLE_MAPS_API_KEY is not set. Google Places API calls will fail.');
        }
    }

    async startSearch(params: SearchParams) {
        if (!this.apiKey) {
            throw new Error('GOOGLE_MAPS_API_KEY is missing. Please configure it in .env to use the Discovery Engine.');
        }
        
        const base64Params = Buffer.from(JSON.stringify(params)).toString('base64');
        const runId = 'places-run-' + base64Params;
        return {
            id: runId,
            status: 'SUCCEEDED',
            defaultDatasetId: 'places-dataset-' + base64Params
        };
    }

    async checkRunStatus(runId: string) {
        return {
            id: runId,
            status: 'SUCCEEDED',
            defaultDatasetId: runId.replace('places-run-', 'places-dataset-')
        };
    }

    async getDatasetItems(datasetId: string) {
        if (!this.apiKey) {
            throw new Error('GOOGLE_MAPS_API_KEY is missing.');
        }

        const b64 = datasetId.replace('places-dataset-', '');
        let params: SearchParams = {};
        try {
            params = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
        } catch(e) {}

        const { country, state, district, city, area, category, maxResults = 20 } = params;
        
        const queryParts = [];
        if (category) queryParts.push(category);
        if (area) queryParts.push(area);
        if (city) queryParts.push(city);
        if (district) queryParts.push(district);
        if (state) queryParts.push(state);
        if (country) queryParts.push(country);

        const query = queryParts.join(' in ');
        const items = [];

        try {
            const searchRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': this.apiKey,
                    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.websiteUri,places.internationalPhoneNumber,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.businessStatus,places.types'
                },
                body: JSON.stringify({ textQuery: query, maxResultCount: Math.min(maxResults, 20) })
            });
            const searchData = await searchRes.json();

            if (!searchRes.ok) {
                console.warn('[GooglePlacesProvider] Places Search API Error or no results:', searchData.status);
                throw new Error(`Google Places API returned status: ${searchData.status}`);
            }

            const places = searchData.places || [];
            const limitedPlaces = places.slice(0, maxResults);

            for (const place of limitedPlaces) {
                const placeId = place.id;
                if (!placeId) continue;
                const detailsRes = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
                    headers: {
                        'X-Goog-Api-Key': this.apiKey,
                        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,googleMapsUri,websiteUri,internationalPhoneNumber,nationalPhoneNumber,rating,userRatingCount,businessStatus,types'
                    }
                });
                const detailsData = await detailsRes.json();

                if (!detailsRes.ok) continue;
                const d = detailsData;
                
                items.push({
                    provider: 'google_places',
                    placeId: placeId,
                    title: d.displayName?.text,
                    categoryName: category,
                    address: d.formatted_address,
                    neighborhood: area,
                    city: city,
                    state: state,
                    countryCode: "IN",
                    phoneUnformatted: d.internationalPhoneNumber || d.nationalPhoneNumber || null,
                    website: d.websiteUri || null,
                    googleMapsUri: d.googleMapsUri || null,
                    totalScore: d.rating || null,
                    reviewsCount: d.userRatingCount || 0,
                    location: {
                        lat: d.location?.latitude || null,
                        lng: d.location?.longitude || null
                    }
                });
            }
        } catch (error) {
            console.error('[GooglePlacesProvider] Fatal Error:', error);
            throw error;
        }

        return items;
    }
}
