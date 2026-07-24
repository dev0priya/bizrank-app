# Deployment Guide

## Prerequisites
- Node.js 20+
- Vercel Account
- Neon Database (PostgreSQL)
- Apify Account (Google Maps Scraper Token)

## Environment Variables
Ensure the following are set both locally (`.env`) and in the Vercel Dashboard (**Settings > Environment Variables**):
- `DATABASE_URL`: Connection string starting with `postgresql://`
- `APIFY_API_TOKEN`: Your valid authentication token for the Apify platform.

## Local Deployment
1. `npm install`
2. `npx prisma generate`
3. `npx prisma db push` (To sync schema)
4. `npm run dev`

## Production Deployment (Vercel)
1. Push your branch to GitHub (`git push origin main`).
2. Vercel automatically intercepts the push and executes Next.js build (`npm run build`).
3. Ensure no local `vercel.json` exists in the repository, as Next.js zero-config routing is preferred.
