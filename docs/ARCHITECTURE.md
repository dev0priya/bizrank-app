# Architecture

## Frontend
Built on **Next.js 16** leveraging the App Router. Uses Server Components for data fetching and Client Components purely for interactivity. State is managed via React Context and `sessionStorage` for discovery persistence.

## Backend
Next.js API routes (`/api/*`) act as the backend service layer, interacting directly with Prisma.

## Database (Prisma + Neon PostgreSQL)
A fully relational PostgreSQL database hosted on Neon. Serverless-ready and accessed securely via Prisma ORM.

## Google Maps Scraper
Integration with Apify's Google Maps scraper. Jobs are queued via API and progress is tracked asynchronously in the `CollectionJob` table.

## Data Flow
1. User defines discovery parameters.
2. Next.js triggers Apify actor.
3. Apify scrapes Google Maps.
4. Webhook / Polling syncs data to `Business` table.
5. AI scoring evaluates business quality.
6. User qualifies leads into the CRM pipeline.
