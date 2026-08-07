export interface SearchParams {
    country?: string;
    state?: string;
    city?: string;
    area?: string;
    category?: string;
    maxResults?: number;
}

export class GooglePlacesProvider {
    private apiKey: string;

    constructor() {
        this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
        if (!this.apiKey) {
            console.warn('[GooglePlacesProvider] WARNING: GOOGLE_MAPS_API_KEY is not set in environment variables.');
        }
    }

    async startSearch(params: SearchParams) {
        // Create a determinist ID so it can be passed around
        const base64Params = Buffer.from(JSON.stringify(params)).toString('base64');
        const runId = 'places-run-' + base64Params;
        
        console.log(`[GooglePlacesProvider] Started search: ${JSON.stringify(params)}`);
        
        // We will execute synchronously for now and cache it by runId logic in getDatasetItems
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
        const b64 = datasetId.replace('places-dataset-', '');
        let params: SearchParams = {};
        try {
            params = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
        } catch(e) {}

        const { country, state, city, area, category, maxResults = 20 } = params;
        
        let queryParts = [];
        if (category) queryParts.push(category);
        if (area) queryParts.push(area);
        if (city) queryParts.push(city);
        if (state) queryParts.push(state);
        if (country) queryParts.push(country);

        const query = queryParts.join(' in ');

        console.log(`[GooglePlacesProvider] Executing Text Search for query: "${query}"`);

        const items = [];

        try {
            const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}`;
            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();

            if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
                console.error('[GooglePlacesProvider] Places Search API Error:', searchData);
                return [];
            }

            const places = searchData.results || [];
            const limitedPlaces = places.slice(0, maxResults);

            for (const place of limitedPlaces) {
                const placeId = place.place_id;
                
                // Fetch Details
                const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,formatted_phone_number,website,geometry,formatted_address,user_ratings_total&key=${this.apiKey}`;
                const detailsRes = await fetch(detailsUrl);
                const detailsData = await detailsRes.json();

                if (detailsData.status !== 'OK') {
                    console.warn(`[GooglePlacesProvider] Could not fetch details for place_id ${placeId}`);
                    continue;
                }

                const d = detailsData.result;
                
                items.push({
                    placeId: placeId,
                    title: d.name,
                    categoryName: category,
                    address: d.formatted_address,
                    neighborhood: area,
                    city: city,
                    state: state,
                    countryCode: "IN",
                    phoneUnformatted: d.formatted_phone_number || null,
                    website: d.website || null,
                    url: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
                    totalScore: d.rating || null,
                    reviewsCount: d.user_ratings_total || 0,
                    location: {
                        lat: d.geometry?.location?.lat || null,
                        lng: d.geometry?.location?.lng || null
                    }
                });
            }

        } catch (error) {
            console.error('[GooglePlacesProvider] Fatal Error during Google Places API call:', error);
        }

        return items;
    }
}
