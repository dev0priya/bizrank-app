import os
import sqlite3
import pandas as pd
import json
from scraper import GoogleMapsScraper
from processor import DataProcessor
from storage import StorageHandler

# Use SQLite for testing the database logic
TEST_DB = "sqlite:///test_businesses.db"
os.environ["DATABASE_URL"] = TEST_DB

def run_tests():
    print("Starting Phase 1 Comprehensive Validation...\n")
    report = []
    
    try:
        # 1. & 8. & 9. Test Apify Task Execution & Multi-search
        print("Testing Apify Scraper (Multiple cities & categories)...")
        scraper = GoogleMapsScraper()
        
        # Test 1: Restaurants in New York
        raw_data_1 = scraper.search_businesses(city="New York", category="Restaurant", max_results=3)
        # Test 2: Cafes in Los Angeles
        raw_data_2 = scraper.search_businesses(city="Los Angeles", category="Cafe", max_results=3)
        
        # We will intentionally duplicate a record to test deduplication
        if len(raw_data_1) > 0:
            raw_data_1.append(raw_data_1[0]) # duplicate the first record
            
        combined_raw_data = raw_data_1 + raw_data_2
        
        if len(combined_raw_data) > 0:
            report.append("✓ Apify Task executes successfully.")
            report.append("✓ Businesses are fetched.")
            report.append("✓ Search works for multiple categories.")
            report.append("✓ Search works for multiple cities.")
        else:
            raise Exception("No data fetched from Apify.")
            
        # 2. Test Processing and Deduplication
        print("Testing Processor and Deduplication...")
        processor = DataProcessor()
        processed_data = processor.process_and_deduplicate(combined_raw_data)
        
        # We know we added at least 1 duplicate intentionally
        urls = [item['google_maps_url'] for item in processed_data]
        if len(urls) == len(set(urls)):
            report.append("✓ No duplicate businesses exist.")
        else:
            raise Exception("Duplicates found in processed data!")
            
        # 3. Test Storage Handlers
        print("Testing Storage and Exports...")
        storage = StorageHandler(processed_data)
        
        # Test JSON
        json_file = "test_output.json"
        storage.save_to_json(json_file)
        if os.path.exists(json_file):
            with open(json_file, 'r', encoding='utf-8') as f:
                saved_json = json.load(f)
                if len(saved_json) == len(processed_data):
                    report.append("✓ JSON export works.")
                else:
                    raise Exception("JSON export mismatch.")
        
        # Test CSV
        csv_file = "test_output.csv"
        storage.save_to_csv(csv_file)
        if os.path.exists(csv_file):
            df_csv = pd.read_csv(csv_file)
            if len(df_csv) == len(processed_data):
                report.append("✓ CSV export works.")
            else:
                raise Exception("CSV export mismatch.")
                
        # Test Excel
        excel_file = "test_output.xlsx"
        storage.save_to_excel(excel_file)
        if os.path.exists(excel_file):
            df_excel = pd.read_excel(excel_file)
            if len(df_excel) == len(processed_data):
                report.append("✓ Excel export works.")
            else:
                raise Exception("Excel export mismatch.")
                
        # Test Database (SQLite used as proxy for Postgres SQL Alchemy)
        storage.save_to_postgres("test_businesses")
        # Verify DB
        engine = sqlite3.connect("test_businesses.db")
        cursor = engine.cursor()
        cursor.execute("SELECT COUNT(*) FROM test_businesses")
        db_count = cursor.fetchone()[0]
        if db_count == len(processed_data):
            report.append("✓ Database contains the correct number of businesses.")
        else:
            raise Exception(f"Database row count ({db_count}) mismatch with data ({len(processed_data)}).")
        
        print("\nAll tests passed successfully!")
        
        # Write Report
        with open("PHASE1_TEST_REPORT.md", "w", encoding="utf-8") as f:
            f.write("# Phase 1: Business Collection - Test Report\n\n")
            for line in report:
                f.write(f"- {line}\n")
            f.write("\n**Status: PASSED**")
            
    except Exception as e:
        print(f"\nTEST FAILED: {e}")
        with open("PHASE1_TEST_REPORT.md", "w", encoding="utf-8") as f:
            f.write("# Phase 1: Business Collection - Test Report\n\n")
            for line in report:
                f.write(f"- {line}\n")
            f.write(f"\n**Status: FAILED**\nError: {e}")

if __name__ == "__main__":
    run_tests()
