# BizRank

## Project Overview
BizRank is a production-grade AI-powered Business Discovery and Lead Intelligence SaaS platform. It automates the extraction, qualification, and management of local business leads via Google Maps.

## Features
- **Business Discovery**: Automated scraping via Apify.
- **AI Qualification**: Intelligent scoring and filtering.
- **CRM Pipeline**: Integrated Kanban tracking.
- **Master Data**: Configurable categories and locations.
- **Global Search**: Instantly find jobs and businesses.

## Technology Stack
- **Frontend**: Next.js 16 (App Router), React, Tailwind CSS / Vanilla CSS, Framer Motion
- **Backend**: Next.js Server Actions & API Routes, Node.js
- **Database**: Prisma ORM, Neon PostgreSQL
- **Infrastructure**: Vercel
- **Scraping**: Apify Google Maps SDK

## Architecture Diagram
See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Installation & Running Locally
1. Clone the repository
2. `npm install`
3. Set up `.env` with `DATABASE_URL` and `APIFY_API_TOKEN`
4. `npx prisma db push`
5. `npm run dev`

## Deployment
See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Roadmap
See [docs/ROADMAP.md](docs/ROADMAP.md)

## Developer Information
See [DEVELOPER.md](DEVELOPER.md)
