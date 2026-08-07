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

        const { country, state, city, area, category, maxResults = 20 } = params;
        
        let queryParts = [];
        if (category) queryParts.push(category);
        if (area) queryParts.push(area);
        if (city) queryParts.push(city);
        if (state) queryParts.push(state);
        if (country) queryParts.push(country);

        const query = queryParts.join(' in ');
        const items = [];

        try {
            const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}`;
            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();

            if (searchData.status !== 'OK') {
                console.warn('[GooglePlacesProvider] Places Search API Error or no results:', searchData.status);
                throw new Error(`Google Places API returned status: ${searchData.status}`);
            }

            const places = searchData.results || [];
            const limitedPlaces = places.slice(0, maxResults);

            for (const place of limitedPlaces) {
                const placeId = place.place_id;
                
                const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,formatted_phone_number,website,geometry,formatted_address,user_ratings_total&key=${this.apiKey}`;
                const detailsRes = await fetch(detailsUrl);
                const detailsData = await detailsRes.json();

                if (detailsData.status !== 'OK') continue;

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
            console.error('[GooglePlacesProvider] Fatal Error:', error);
            throw error;
        }

        return items;
    }
}
