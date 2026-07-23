from scraper import GoogleMapsScraper
from processor import DataProcessor
from storage import StorageHandler

def main():
    print("Starting Phase 1: Business Collection")
    
    # Initialize the scraper
    scraper = GoogleMapsScraper()
    
    # Define a test search (e.g. Restaurants in New York)
    print("Running initial search...")
    raw_data = scraper.search_businesses(
        country="USA",
        state="NY",
        city="New York",
        category="Restaurant",
        max_results=5
    )
    
    # Process and deduplicate
    print("Processing and deduplicating data...")
    processor = DataProcessor()
    processed_data = processor.process_and_deduplicate(raw_data)
    
    # Save the data
    print("Saving data to various formats...")
    storage = StorageHandler(processed_data)
    
    storage.save_to_json("businesses.json")
    storage.save_to_csv("businesses.csv")
    storage.save_to_excel("businesses.xlsx")
    storage.save_to_postgres("scraped_businesses")
    
    print("Phase 1 completed successfully.")

if __name__ == "__main__":
    main()
