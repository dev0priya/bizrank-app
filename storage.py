import json
import pandas as pd
from sqlalchemy import create_engine, text
from config import Config

class StorageHandler:
    def __init__(self, data):
        self.data = data
        self.df = pd.DataFrame(data)
        
    def save_to_json(self, filename="output.json"):
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, ensure_ascii=False, indent=4)
        print(f"Data saved to {filename}")

    def save_to_csv(self, filename="output.csv"):
        if self.df.empty:
            print(f"No data to save to {filename}")
            return
        self.df.to_csv(filename, index=False, encoding='utf-8')
        print(f"Data saved to {filename}")

    def save_to_excel(self, filename="output.xlsx"):
        if self.df.empty:
            print(f"No data to save to {filename}")
            return
        self.df.to_excel(filename, index=False)
        print(f"Data saved to {filename}")

    def save_to_postgres(self, table_name="businesses"):
        if not Config.DATABASE_URL:
            print("PostgreSQL export skipped: DATABASE_URL not provided.")
            return
            
        if self.df.empty:
            print("PostgreSQL export skipped: No data to export.")
            return
            
        try:
            engine = create_engine(Config.DATABASE_URL)
            self.df.to_sql(table_name, engine, if_exists='append', index=False)
            print(f"Data successfully saved to PostgreSQL table '{table_name}'.")
        except Exception as e:
            print(f"Failed to save to PostgreSQL: {e}")
