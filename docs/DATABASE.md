# Database Schema

## Models

### Business
Core entity storing scraped business intelligence (Name, Phone, Website, Lat/Long, Ratings, AI Score).

### CollectionJob
Tracks async scraping runs triggered via Apify.

### Location Models
- **Country**, **State**, **City**, **Area**: Hierarchical master data.

### Category
Standardized business categories.

### Lead & CRM
- **Lead**: Information regarding a qualified prospect.
- **CRM**: The sales pipeline tracking table.

## Relationships
- A `CollectionJob` has many `Business` records.
- `Business` references `City`, `Area`, and `Category` for exact normalization.
