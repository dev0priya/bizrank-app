# Deployment Guide

## Infrastructure
- **Hosting:** Vercel (Serverless Edge Network)
- **Database:** Neon (Serverless Postgres)

## Environment Variables
- `DATABASE_URL`: Neon connection string
- `APIFY_API_TOKEN`: Token for scraper
- `NEXT_PUBLIC_APP_URL`: Domain url

## Build Process
1. `npm run typecheck`
2. `next build` (Prisma generates client automatically)
