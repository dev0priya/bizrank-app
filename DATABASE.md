# Database Documentation

## Stack
- **Database:** PostgreSQL (Neon Managed)
- **ORM:** Prisma v5

## Schema Highlights
- **Master Data Tables**: `Country`, `State`, `City`, `Area`, `BusinessCategory`. These tables act as strict references to normalize geo-location and segment data.
- **`CollectionJob`**: Acts as the tracking ledger for all Apify scrapes, storing statuses (`Pending`, `Running`, `Completed`, `Failed`).
- **`Business`**: Centralized storage for collected leads. Enforces deduplication via `google_maps_url` and `place_id`. Contains granular fields for audit scoring (`ai_score`, `opportunity_score`) and full address profiles.
- **CRM Tables**: `Client`, `PipelineStage`, `Opportunity`. Forms the foundational workflow for post-discovery sales operations.
