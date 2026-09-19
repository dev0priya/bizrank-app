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
        const apifyToken = process.env.APIFY_API_TOKEN || (typeof globalThis !== 'undefined' && (globalThis as any).APIFY_API_TOKEN);
        const googleKey = process.env.GOOGLE_MAPS_API_KEY || (typeof globalThis !== 'undefined' && (globalThis as any).GOOGLE_MAPS_API_KEY);

        switch (providerType) {
            case 'apify':
                if (apifyToken) {
                    return new ApifyProvider();
                }
                if (googleKey) {
                    console.info('[ProviderFactory] APIFY_API_TOKEN is not configured, falling back to GooglePlacesProvider');
                    return new GooglePlacesProvider();
                }
                throw new Error('APIFY_API_TOKEN is not configured. Please configure your Apify or Google Places credentials to discover real Google Maps listings.');

            case 'google_places':
                if (googleKey) {
                    return new GooglePlacesProvider();
                }
                if (apifyToken) {
                    return new ApifyProvider();
                }
                throw new Error('GOOGLE_MAPS_API_KEY is not configured.');

            case 'mock':
                return new MockProvider();

            default:
                if (apifyToken) {
                    return new ApifyProvider();
                }
                if (googleKey) return new GooglePlacesProvider();
                return new MockProvider();
        }
    }
}
