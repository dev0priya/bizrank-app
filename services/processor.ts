import { normalizeWebsiteUrl, resolveGoogleMapsUrl } from './businessLinks';

export interface ProcessedBusiness {
    provider: string | null;
    place_id: string | null;
    business_name: string;
    category: string | null;
    full_address: string | null;
    area: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    phone_number: string | null;
    website: string | null;
    email: string | null;
    google_maps_url: string | null;
    rating: number | null;
    review_count: number | null;
    latitude: number | null;
    longitude: number | null;
    google_category: string | null;
    owner_name: string | null;
    business_status: string | null;
}

export class DataProcessor {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static processAndDeduplicate(rawData: any[], searchCategory?: string): ProcessedBusiness[] {
        const processedRecords: ProcessedBusiness[] = [];
        
        for (const item of rawData) {
            const lat = (item.location && typeof item.location.lat === 'number') ? item.location.lat : (typeof item.latitude === 'number' ? item.latitude : null);
            const lng = (item.location && typeof item.location.lng === 'number') ? item.location.lng : (typeof item.longitude === 'number' ? item.longitude : null);
            
            const placeId = item.placeId || item.place_id || item.id || item.placeIdStr || null;
            const title = item.title || item.name || item.displayName?.text || "Unknown";
            const address = item.address || item.full_address || item.formattedAddress || item.street || null;
            const phone = item.phoneUnformatted || item.phone || item.phoneNumber || item.nationalPhoneNumber || null;
            const rawWebsite = item.website || item.websiteUri || item.domain || null;
            const rawMapsUrl = item.googleMapsUri || item.google_maps_url || item.url || item.mapsUrl || null;
            const rating = typeof item.totalScore === 'number' ? item.totalScore : (typeof item.rating === 'number' ? item.rating : (typeof item.stars === 'number' ? item.stars : null));
            const reviewCount = typeof item.reviewsCount === 'number' ? item.reviewsCount : (typeof item.review_count === 'number' ? item.review_count : (typeof item.reviews === 'number' ? item.reviews : null));
            
            const record: ProcessedBusiness = {
                provider: item.provider || 'apify',
                place_id: placeId,
                business_name: title,
                category: item.categoryName || searchCategory || null,
                full_address: address,
                area: item.neighborhood || item.sublocality || item.area || null,
                city: item.city || item.locality || null,
                state: item.state || item.region || null,
                country: item.countryCode || item.country || null,
                phone_number: phone,
                website: normalizeWebsiteUrl(rawWebsite),
                email: Array.isArray(item.emails) && item.emails.length > 0 ? item.emails[0] : (typeof item.email === 'string' ? item.email : null),
                google_maps_url: resolveGoogleMapsUrl({
                    provider: item.provider || 'apify',
                    placeId,
                    googleMapsUri: rawMapsUrl,
                    placeName: title
                }),
                rating,
                review_count: reviewCount,
                latitude: lat,
                longitude: lng,
                google_category: item.categoryName || null,
                owner_name: item.ownerTitle || item.ownerName || null,
                business_status: item.status || item.businessStatus || null
            };

            // Only add if it has a place_id or google_maps_url or valid title
            if (record.place_id || record.google_maps_url || record.business_name !== "Unknown") {
                processedRecords.push(record);
            }
        }
        
        const initialCount = processedRecords.length;
        
        // Deduplicate based on place_id primarily, fallback to google_maps_url
        const uniqueRecordsMap = new Map<string, ProcessedBusiness>();
        for (const record of processedRecords) {
            const key = record.place_id ? `${record.provider || 'unknown'}:${record.place_id}` : record.google_maps_url;
            if (key && !uniqueRecordsMap.has(key)) {
                uniqueRecordsMap.set(key, record);
            }
        }
        
        const deduplicatedRecords = Array.from(uniqueRecordsMap.values());
        const finalCount = deduplicatedRecords.length;
        
        if (initialCount > 0) {
            console.log(`Deduplication: Removed ${initialCount - finalCount} duplicates.`);
        } else {
            console.log("Warning: No data to process.");
        }
        
        return deduplicatedRecords;
    }
}
