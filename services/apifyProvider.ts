import { ApifyClient } from 'apify-client';
import { Config } from '../config/config';
import { BusinessProvider, SearchParams } from './providerFactory';

export class ApifyProvider implements BusinessProvider {
    private client: ApifyClient;

    constructor() {
        if (!Config.APIFY_API_TOKEN) {
            throw new Error("APIFY_API_TOKEN is missing. Please configure it in .env to use the Apify provider.");
        }
        this.client = new ApifyClient({ token: Config.APIFY_API_TOKEN });
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

        const run = await this.client.actor(Config.APIFY_ACTOR_ID).start(runInput);
        console.log(`Scraper started. Run ID: ${run.id}`);
        
        return {
            id: run.id,
            status: run.status,
            defaultDatasetId: run.defaultDatasetId
        };
    }

    async checkRunStatus(runId: string) {
        const run = await this.client.run(runId).get();
        return {
            id: run!.id,
            status: run!.status,
            defaultDatasetId: run!.defaultDatasetId
        };
    }

    async getDatasetItems(datasetId: string) {
        const { items } = await this.client.dataset(datasetId).listItems();
        return items;
    }
}
