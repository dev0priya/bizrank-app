import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    APIFY_API_TOKEN = os.getenv("APIFY_API_TOKEN")
    DATABASE_URL = os.getenv("DATABASE_URL")
    
    # Apify Actor Settings
    APIFY_ACTOR_ID = "compass/google-maps-scraper" # Standard Apify Google Maps Scraper

    # Fields to extract
    REQUIRED_FIELDS = [
        "title",              # Business Name
        "categoryName",       # Category
        "address",            # Full Address
        "neighborhood",       # Area
        "city",               # City
        "state",              # State
        "countryCode",        # Country
        "phoneUnformatted",   # Phone Number
        "website",            # Website
        "url",                # Google Maps URL
        "totalScore",         # Rating
        "reviewsCount",       # Review Count
        "location"            # Latitude & Longitude
    ]
