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

        let params: SearchParams = {};
        if (datasetId && datasetId.startsWith('places-dataset-')) {
            const b64 = datasetId.replace('places-dataset-', '');
            if (b64) {
                try {
                    const decoded = typeof Buffer !== 'undefined'
                        ? Buffer.from(b64, 'base64').toString('utf8')
                        : decodeURIComponent(escape(atob(b64)));
                    params = JSON.parse(decoded);
                } catch(e) {}
            }
        }

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
                    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.addressComponents,places.location,places.googleMapsUri,places.websiteUri,places.internationalPhoneNumber,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.businessStatus,places.types'
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
                        'X-Goog-FieldMask': 'id,displayName,formattedAddress,addressComponents,location,googleMapsUri,websiteUri,internationalPhoneNumber,nationalPhoneNumber,rating,userRatingCount,businessStatus,types'
                    }
                });
                const detailsData = await detailsRes.json();

                if (!detailsRes.ok) continue;
                const d = detailsData;

                let street: string | null = null;
                let neighborhood: string | null = null;
                let locality: string | null = null;
                let stateComponent: string | null = null;
                let postalCode: string | null = null;
                let countryCode = "IN";

                const components = Array.isArray(d.addressComponents) ? d.addressComponents : (Array.isArray(place.addressComponents) ? place.addressComponents : []);
                for (const comp of components) {
                    const types: string[] = comp.types || [];
                    if (types.includes('route') || types.includes('street_number')) {
                        street = street ? `${comp.longText || ''} ${street}`.trim() : (comp.longText || null);
                    } else if (types.includes('sublocality') || types.includes('sublocality_level_1') || types.includes('neighborhood')) {
                        neighborhood = comp.longText || null;
                    } else if (types.includes('locality')) {
                        locality = comp.longText || null;
                    } else if (types.includes('administrative_area_level_1')) {
                        stateComponent = comp.longText || null;
                    } else if (types.includes('postal_code')) {
                        postalCode = comp.longText || null;
                    } else if (types.includes('country')) {
                        countryCode = comp.shortText || comp.longText || "IN";
                    }
                }
                
                items.push({
                    provider: 'google_places',
                    placeId: placeId,
                    title: d.displayName?.text || place.displayName?.text,
                    categoryName: category,
                    address: d.formattedAddress || d.formatted_address || place.formattedAddress || null,
                    street: street,
                    neighborhood: neighborhood,
                    city: locality,
                    state: stateComponent,
                    postalCode: postalCode,
                    countryCode: countryCode,
                    phoneUnformatted: d.internationalPhoneNumber || d.nationalPhoneNumber || null,
                    website: d.websiteUri || null,
                    googleMapsUri: d.googleMapsUri || place.googleMapsUri || null,
                    url: d.googleMapsUri || place.googleMapsUri || null,
                    totalScore: d.rating || null,
                    reviewsCount: d.userRatingCount || 0,
                    location: {
                        lat: d.location?.latitude ?? place.location?.latitude ?? null,
                        lng: d.location?.longitude ?? place.location?.longitude ?? null
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
