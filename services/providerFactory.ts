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
                    try {
                        return new ApifyProvider();
                    } catch (e) {
                        console.warn('[ProviderFactory] ApifyProvider instantiation failed, falling back to MockProvider:', e);
                    }
                }
                console.warn('[ProviderFactory] APIFY_API_TOKEN is not configured in environment, falling back to mock provider');
                if (googleKey) return new GooglePlacesProvider();
                return new MockProvider();

            case 'google_places':
                if (googleKey) {
                    return new GooglePlacesProvider();
                }
                console.warn('[ProviderFactory] GOOGLE_MAPS_API_KEY is not configured in environment, falling back to mock provider');
                return new MockProvider();

            case 'mock':
                return new MockProvider();

            default:
                if (apifyToken) {
                    try { return new ApifyProvider(); } catch (e) {}
                }
                if (googleKey) return new GooglePlacesProvider();
                return new MockProvider();
        }
    }
}
