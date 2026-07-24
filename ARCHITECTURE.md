# Architecture Documentation

## Core Design
BizRank v1.0 utilizes the Next.js App Router for server-rendered UI and optimized API route management.

## Component Flow
1. **Frontend (`app/`)**: Client components dispatch Next.js API requests.
2. **API Routes (`app/api/`)**: Handle RESTful CRUD and trigger scraping operations.
3. **Scraping Layer (`src/scraper.ts`)**: Integrates with Apify to extract Google Maps data. Returns execution status asynchronously.
4. **Data Processor (`src/processor.ts`)**: Cleans extracted data and performs initial validations.
5. **Auditor (`src/auditor.ts`)**: Evaluates online presence logic to calculate `ai_score` and `opportunity_score`.
6. **Persistence (`prisma/schema.prisma`)**: Robust ORM schema ensuring deduplicated inserts based on Google Place IDs.
