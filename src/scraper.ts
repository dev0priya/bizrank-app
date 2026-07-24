import { ApifyClient } from 'apify-client';
import { Config } from './config';

export interface SearchParams {
    country?: string;
    state?: string;
    city?: string;
    area?: string;
    category?: string;
    maxResults?: number;
}

export class GoogleMapsScraper {
    private client: ApifyClient;

    constructor() {
        if (!Config.APIFY_API_TOKEN) {
            throw new Error("APIFY_API_TOKEN is not set in environment variables.");
        }
        this.client = new ApifyClient({ token: Config.APIFY_API_TOKEN });
    }

    async startSearch({ country, state, city, area, category, maxResults = 20 }: SearchParams) {
        const searchParts: string[] = [];
        if (category) searchParts.push(category);
        if (area) searchParts.push(area);
        if (city) searchParts.push(city);
        if (state) searchParts.push(state);
        if (country) searchParts.push(country);

        const searchQuery = searchParts.join(", ");
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
        
        return run;
    }

    async checkRunStatus(runId: string) {
        return await this.client.run(runId).get();
    }

    async getDatasetItems(datasetId: string) {
        const { items } = await this.client.dataset(datasetId).listItems();
        return items;
    }
}
