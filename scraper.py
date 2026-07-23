from apify_client import ApifyClient
from config import Config

class GoogleMapsScraper:
    def __init__(self):
        if not Config.APIFY_API_TOKEN:
            raise ValueError("APIFY_API_TOKEN is not set in environment variables.")
        self.client = ApifyClient(Config.APIFY_API_TOKEN)
        
    def search_businesses(self, country=None, state=None, city=None, area=None, category=None, max_results=20):
        """
        Builds the search string based on the provided parameters and runs the scraper.
        """
        search_parts = []
        if category:
            search_parts.append(category)
        if area:
            search_parts.append(area)
        if city:
            search_parts.append(city)
        if state:
            search_parts.append(state)
        if country:
            search_parts.append(country)
            
        search_query = ", ".join(search_parts)
        if not search_query:
            raise ValueError("At least one search parameter must be provided.")
            
        print(f"Starting Apify Scraper for query: '{search_query}' (max {max_results} results)")
        
        # Prepare the Actor input
        run_input = {
            "searchStringsArray": [search_query],
            "maxCrawledPlacesPerSearch": max_results,
            "language": "en",
            "maxImages": 0,
            "maxReviews": 0,
            "scrapeReviewerName": False,
            "scrapeReviewerId": False,
            "scrapeReviewerUrl": False,
            "scrapeResponseFromOwnerText": False,
        }
        
        # Run the Actor and wait for it to finish
        run = self.client.actor(Config.APIFY_ACTOR_ID).call(run_input=run_input)
        
        print(f"Scraper finished. Run ID: {run['id']}")
        print("Fetching results...")
        
        # Fetch and yield the results from the run's dataset
        dataset_items = self.client.dataset(run["defaultDatasetId"]).iterate_items()
        
        results = list(dataset_items)
        print(f"Fetched {len(results)} raw items from Apify.")
        return results
