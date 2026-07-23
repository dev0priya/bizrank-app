export interface ProcessedBusiness {
    business_name: string;
    category: string | null;
    full_address: string | null;
    area: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    phone_number: string | null;
    website: string | null;
    google_maps_url: string;
    rating: number | null;
    review_count: number | null;
    latitude: number | null;
    longitude: number | null;
}

export class DataProcessor {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static processAndDeduplicate(rawData: any[]): ProcessedBusiness[] {
        const processedRecords: ProcessedBusiness[] = [];
        
        for (const item of rawData) {
            const lat = item.location && typeof item.location.lat === 'number' ? item.location.lat : null;
            const lng = item.location && typeof item.location.lng === 'number' ? item.location.lng : null;
            
            const record: ProcessedBusiness = {
                business_name: item.title || "Unknown",
                category: item.categoryName || null,
                full_address: item.address || null,
                area: item.neighborhood || null,
                city: item.city || null,
                state: item.state || null,
                country: item.countryCode || null,
                phone_number: item.phoneUnformatted || null,
                website: item.website || null,
                google_maps_url: item.url || "",
                rating: typeof item.totalScore === 'number' ? item.totalScore : null,
                review_count: typeof item.reviewsCount === 'number' ? item.reviewsCount : null,
                latitude: lat,
                longitude: lng
            };

            if (record.google_maps_url) {
                processedRecords.push(record);
            }
        }
        
        const initialCount = processedRecords.length;
        
        // Deduplicate based on google_maps_url
        const uniqueRecordsMap = new Map<string, ProcessedBusiness>();
        for (const record of processedRecords) {
            if (!uniqueRecordsMap.has(record.google_maps_url)) {
                uniqueRecordsMap.set(record.google_maps_url, record);
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
