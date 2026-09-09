import { Config } from '../config/config';
import { BusinessProvider, SearchParams } from './providerFactory';

export class ApifyProvider implements BusinessProvider {
    private token: string;

    constructor() {
        this.token = Config.APIFY_API_TOKEN || process.env.APIFY_API_TOKEN || '';
        if (!this.token) {
            throw new Error("APIFY_API_TOKEN is missing. Please configure it in .env to use the Apify provider.");
        }
    }

    async startSearch({ country, state, district, city, area, category, maxResults = 20 }: SearchParams) {
        const searchParts: string[] = [];
        if (category) searchParts.push(category);
        if (area) searchParts.push(area);
        if (city) searchParts.push(city);
        if (district) searchParts.push(district);
        if (state) searchParts.push(state);
        if (country) searchParts.push(country);

        // Split tokens and deduplicate to form a clean query e.g. "Salon, Rohini, Delhi, India"
        const tokens: string[] = [];
        for (const part of searchParts) {
            if (!part) continue;
            const subTokens = part.split(',').map(s => s.trim()).filter(Boolean);
            for (const token of subTokens) {
                if (!tokens.map(t => t.toLowerCase()).includes(token.toLowerCase())) {
                    tokens.push(token);
                }
            }
        }

        const searchQuery = tokens.join(", ");
        if (!searchQuery) {
            throw new Error("At least one search parameter must be provided.");
        }

        console.log(`Starting Async Apify Scraper for query: '${searchQuery}' (max ${maxResults} results)`);

        const runInput = {
            searchStringsArray: [searchQuery],
            maxCrawledPlacesPerSearch: maxResults,
            language: "en",
            maxImages: 0,
            maxReviews: 0,
            scrapeReviewerName: false,
            scrapeReviewerId: false,
            scrapeReviewerUrl: false,
            scrapeResponseFromOwnerText: false,
        };

        const safeActorId = Config.APIFY_ACTOR_ID.replace('/', '~');
        const url = `https://api.apify.com/v2/acts/${safeActorId}/runs?token=${encodeURIComponent(this.token)}`;
        
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(runInput)
        });

        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            let parsedErr: any = null;
            try { parsedErr = JSON.parse(errText); } catch {}
            throw new Error(parsedErr?.error?.message || errText || `Failed to start Apify actor (${res.status})`);
        }

        const json = await res.json() as { data: { id: string; status: string; defaultDatasetId: string } };
        console.log(`Scraper started. Run ID: ${json.data.id}`);
        
        return {
            id: json.data.id,
            status: json.data.status,
            defaultDatasetId: json.data.defaultDatasetId
        };
    }

    async checkRunStatus(runId: string) {
        try {
            const url = `https://api.apify.com/v2/actor-runs/${encodeURIComponent(runId)}?token=${encodeURIComponent(this.token)}`;
            const res = await fetch(url);
            if (!res.ok) {
                return { id: runId, status: 'FAILED', defaultDatasetId: '' };
            }
            const json = await res.json() as { data: { id: string; status: string; defaultDatasetId: string } };
            return {
                id: json.data.id,
                status: json.data.status,
                defaultDatasetId: json.data.defaultDatasetId
            };
        } catch (e: any) {
            console.error('[ApifyProvider] checkRunStatus failed:', e);
            return { id: runId, status: 'FAILED', defaultDatasetId: '' };
        }
    }

    async getDatasetItems(datasetId: string) {
        try {
            if (!datasetId) return [];
            const url = `https://api.apify.com/v2/datasets/${encodeURIComponent(datasetId)}/items?token=${encodeURIComponent(this.token)}&clean=true`;
            const res = await fetch(url);
            if (!res.ok) {
                console.error(`[ApifyProvider] getDatasetItems returned ${res.status}`);
                return [];
            }
            const items = await res.json();
            return Array.isArray(items) ? items : [];
        } catch (e: any) {
            console.error('[ApifyProvider] getDatasetItems failed:', e);
            return [];
        }
    }
}
