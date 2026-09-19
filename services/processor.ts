import { extractPlaceId, normalizeWebsiteUrl, resolveGoogleMapsUrl } from './businessLinks';

export interface ProcessedBusiness {
    provider: string | null;
    place_id: string | null;
    business_name: string;
    category: string | null;
    full_address: string | null;
    area: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
    phone_number: string | null;
    website: string | null;
    email: string | null;
    google_maps_url: string | null;
    cid?: string | null;
    rating: number | null;
    review_count: number | null;
    latitude: number | null;
    longitude: number | null;
    google_category: string | null;
    owner_name: string | null;
    business_status: string | null;
}

function cleanStr(val: any): string | null {
    if (val === null || val === undefined) return null;
    const str = String(val).trim();
    if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') return null;
    return str;
}

export class DataProcessor {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static processAndDeduplicate(rawData: any[], searchCategory?: string): ProcessedBusiness[] {
        const processedRecords: ProcessedBusiness[] = [];
        
        for (const item of rawData) {
            const lat = (item.location && typeof item.location.lat === 'number') ? item.location.lat : (typeof item.latitude === 'number' ? item.latitude : null);
            const lng = (item.location && typeof item.location.lng === 'number') ? item.location.lng : (typeof item.longitude === 'number' ? item.longitude : null);
            
            const rawMapsUrl = cleanStr(item.googleMapsUri || item.google_maps_url || item.url || item.mapsUrl);
            const rawPlaceId = cleanStr(item.placeId || item.place_id || item.googlePlaceId || item.id || item.placeIdStr);
            const placeId = rawPlaceId || extractPlaceId(rawMapsUrl) || null;
            const title = cleanStr(item.title || item.name || item.displayName?.text) || "Unknown";
            
            // Extract individual address components directly from the listing's own actual data
            const rawPostalCode = cleanStr(item.postalCode || item.postal_code || item.zipCode || item.zip || item.postal || item.pincode || item.pin);
            const street = cleanStr(item.street);
            const neighborhood = cleanStr(item.neighborhood || item.sublocality || item.subLocality || item.area);
            const rawCity = cleanStr(item.city || item.locality);
            const rawState = cleanStr(item.state || item.region || item.administrativeArea);
            const country = cleanStr(item.countryCode || item.country);
            const cid = cleanStr(item.cid || item.fid);

            // Clean city (e.g. if scraper returned "New Delhi, Delhi", extract city part)
            let city = rawCity;
            if (city && city.includes(',')) {
                city = cleanStr(city.split(',')[0]) || city;
            }
            const state = rawState;

            // Extract the exact full address from the listing verbatim
            // NEVER mutate or append guessed components to Google Maps' own formatted address
            const rawFormattedAddress = cleanStr(item.address || item.full_address || item.formattedAddress || item.formatted_address);
            let fullAddress: string | null = null;

            if (rawFormattedAddress) {
                // Exact listing address from Google Maps — preserve 100% verbatim
                fullAddress = rawFormattedAddress;
            } else {
                // If no pre-formatted address string exists, construct strictly from listing's OWN scraped components
                // NEVER inject the user's search query location
                const parts = [street, neighborhood, city, state, rawPostalCode, country].filter(Boolean);
                if (parts.length > 0) {
                    fullAddress = parts.join(', ');
                }
            }

            // Extract postal code from address if missing from explicit postal code field
            let postalCode = rawPostalCode;
            if (!postalCode && fullAddress) {
                // Match 6-digit Indian PIN code or standard 5-digit ZIP code
                const pinMatch = fullAddress.match(/\b\d{6}\b/) || fullAddress.match(/\b\d{5}\b/);
                if (pinMatch) {
                    postalCode = pinMatch[0];
                }
            }

            const phone = cleanStr(item.phoneUnformatted || item.phone || item.phoneNumber || item.nationalPhoneNumber);
            const rawWebsite = cleanStr(item.website || item.websiteUri || item.domain);
            const rating = typeof item.totalScore === 'number' ? item.totalScore : (typeof item.rating === 'number' ? item.rating : (typeof item.stars === 'number' ? item.stars : null));
            const reviewCount = typeof item.reviewsCount === 'number' ? item.reviewsCount : (typeof item.review_count === 'number' ? item.review_count : (typeof item.reviews === 'number' ? item.reviews : null));
            
            const record: ProcessedBusiness = {
                provider: item.provider || 'apify',
                place_id: placeId,
                business_name: title,
                category: cleanStr(item.categoryName) || searchCategory || null,
                full_address: fullAddress,
                area: neighborhood,
                city: city,
                state: state,
                postal_code: postalCode,
                country: country,
                phone_number: phone,
                website: normalizeWebsiteUrl(rawWebsite),
                email: Array.isArray(item.emails) && item.emails.length > 0 ? cleanStr(item.emails[0]) : cleanStr(item.email),
                google_maps_url: resolveGoogleMapsUrl({
                    provider: item.provider || 'apify',
                    placeId,
                    googleMapsUri: rawMapsUrl,
                    placeName: title,
                    address: fullAddress
                }),
                cid,
                rating,
                review_count: reviewCount,
                latitude: lat,
                longitude: lng,
                google_category: cleanStr(item.categoryName),
                owner_name: cleanStr(item.ownerTitle || item.ownerName),
                business_status: cleanStr(item.status || item.businessStatus)
            };

            // Must have a valid business name AND a verified place ID, canonical URL, or exact address
            if (record.business_name && record.business_name !== "Unknown" && (record.place_id || record.google_maps_url || record.full_address)) {
                processedRecords.push(record);
            }
        }
        
        const initialCount = processedRecords.length;
        
        // Deduplicate based on place_id primarily, fallback to canonical google_maps_url, fallback to composite key
        // Ensure same-name businesses at different locations are NEVER conflated or deduplicated
        const uniqueRecordsMap = new Map<string, ProcessedBusiness>();
        for (const record of processedRecords) {
            const hasExactUrl = record.google_maps_url && (
                record.google_maps_url.includes('query_place_id=') || 
                record.google_maps_url.includes('cid=') || 
                record.google_maps_url.includes('/place/')
            );
            const key = record.place_id 
                ? `${record.provider || 'unknown'}:${record.place_id}` 
                : (hasExactUrl 
                    ? record.google_maps_url! 
                    : `${record.business_name}::${record.full_address || ''}::${record.latitude ?? ''},${record.longitude ?? ''}`);
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
