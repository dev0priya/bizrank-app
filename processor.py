import pandas as pd

class DataProcessor:
    @staticmethod
    def process_and_deduplicate(raw_data):
        """
        Takes raw data from Apify, extracts required fields, and removes duplicates.
        """
        processed_records = []
        
        for item in raw_data:
            # Safely extract location
            location = item.get("location", {})
            lat = location.get("lat") if isinstance(location, dict) else None
            lng = location.get("lng") if isinstance(location, dict) else None
            
            record = {
                "business_name": item.get("title"),
                "category": item.get("categoryName"),
                "full_address": item.get("address"),
                "area": item.get("neighborhood"),
                "city": item.get("city"),
                "state": item.get("state"),
                "country": item.get("countryCode"),
                "phone_number": item.get("phoneUnformatted"),
                "website": item.get("website"),
                "google_maps_url": item.get("url"),
                "rating": item.get("totalScore"),
                "review_count": item.get("reviewsCount"),
                "latitude": lat,
                "longitude": lng
            }
            processed_records.append(record)
            
        df = pd.DataFrame(processed_records)
        
        if not df.empty:
            initial_count = len(df)
            # Deduplicate based on google_maps_url, which is a unique identifier
            df = df.drop_duplicates(subset=['google_maps_url'], keep='first')
            final_count = len(df)
            print(f"Deduplication: Removed {initial_count - final_count} duplicates.")
        else:
            print("Warning: No data to process.")
            
        return df.to_dict('records')
