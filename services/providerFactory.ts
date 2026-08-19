import { ApifyProvider } from './apifyProvider';
import { GooglePlacesProvider } from './googlePlacesProvider';
import { MockProvider } from './mockProvider';

export interface SearchParams {
    country?: string;
    state?: string;
    district?: string;
    city?: string;
    area?: string;
    category?: string;
    maxResults?: number;
}

export interface BusinessProvider {
    startSearch(params: SearchParams): Promise<{
        id: string;
        status: string;
        defaultDatasetId: string;
    }>;
    checkRunStatus(runId: string): Promise<{
        id: string;
        status: string;
        defaultDatasetId: string;
    }>;
    getDatasetItems(datasetId: string): Promise<any[]>;
}

export class ProviderFactory {
    static createProvider(providerType: string): BusinessProvider {
        switch (providerType) {
            case 'apify':
                return new ApifyProvider();
            case 'google_places':
                return new GooglePlacesProvider();
            case 'mock':
                return new MockProvider();
            default:
                // Default to Apify if unknown
                console.warn(`[ProviderFactory] Unknown provider type '${providerType}', falling back to 'apify'`);
                return new ApifyProvider();
        }
    }
}
