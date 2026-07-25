# BizRank - Project Audit & Scaling Roadmap

This document outlines the strategic roadmap to evolve BizRank from a functional MVP (which currently scrapes, audits, qualifies, and provides a CRM interface) into a production-grade, multi-tenant SaaS platform.

## 1. Project Audit: Current State vs. Production Readiness

### Product & Features
- **Business Discovery & Audit**: Functional via Apify & Cheerio headless scraping. 
- **CRM Workflow**: Functional with Drag-and-Drop Kanban, Timeline, and Notes.
- **Missing**: Authentication, Multi-tenant team collaboration, Automated Proposal Generation (PDFs), AI Website Redesign Engine.

### UI/UX & Performance
- **Current**: Next.js App Router with Vanilla CSS glassmorphism.
- **Missing**: Server-side pagination for large datasets (10,000+ clients), Advanced charting (Recharts) for analytics, Real-time notifications (WebSockets).

### Security & Database
- **Current**: SQLite database with Prisma. No authentication.
- **Missing**: Migration to PostgreSQL (Neon/Supabase) for scalability. Implementation of NextAuth/Clerk for JWT-based auth and Role-Based Access Control (RBAC). API Rate Limiting.

### Testing & Deployment
- **Current**: Manual TS compilation tests. Vercel-ready config.
- **Missing**: CI/CD (GitHub Actions), E2E Testing (Playwright), Error tracking (Sentry), Logging.

---

## 2. Feature Recommendations

### 🔐 Security, Authentication & Multi-Tenancy
1. **NextAuth / Clerk Integration**
   - *Why:* Secures the platform, allows user accounts.
   - *Priority:* Critical | *Effort:* Medium | *Phase:* 4
2. **PostgreSQL Migration**
   - *Why:* SQLite cannot handle concurrent SaaS writes at scale.
   - *Priority:* Critical | *Effort:* Low (via Prisma) | *Phase:* 4
3. **Multi-Tenant Organizations**
   - *Why:* Allows different marketing agencies to use BizRank in isolated workspaces.
   - *Priority:* High | *Effort:* High | *Phase:* 5

### 🤖 AI & Automation Engines
4. **AI Website Redesign Engine (OpenAI / Claude Vision)**
   - *Why:* Automatically generate mockups of redesigned websites to pitch to leads.
   - *Priority:* High | *Effort:* High | *Phase:* 5
5. **Automated Proposal Generation (PDFs)**
   - *Why:* Converts the Audit + Redesign into a downloadable, branded PDF to email to clients.
   - *Priority:* High | *Effort:* Medium | *Phase:* 5
6. **Automated Email Outreach**
   - *Why:* Connect via Resend/SendGrid to trigger initial outreach emails when a lead hits "Qualified".
   - *Priority:* Medium | *Effort:* Medium | *Phase:* 6

### 📈 CRM & Dashboard Enhancements
7. **Advanced Search, Filtering & Pagination**
   - *Why:* Essential when the DB grows to thousands of collected businesses.
   - *Priority:* High | *Effort:* Medium | *Phase:* 4
8. **Real-time Notifications (Pusher/WebSockets)**
   - *Why:* Alert sales reps when a lead opens a proposal or when a scraping task finishes.
   - *Priority:* Medium | *Effort:* Medium | *Phase:* 6
9. **Data Visualization (Recharts)**
   - *Why:* Interactive graphs for the dashboard (Revenue over time, Conversion funnels).
   - *Priority:* Medium | *Effort:* Low | *Phase:* 6

### 🛠 DevOps, Testing & Monetization
10. **Stripe Billing Integration**
    - *Why:* Monetize the SaaS platform (subscriptions per agency).
    - *Priority:* High | *Effort:* High | *Phase:* Future
11. **Sentry Error Tracking & E2E Testing (Playwright)**
    - *Why:* Ensures 99.9% uptime and zero regressions when deploying.
    - *Priority:* High | *Effort:* Medium | *Phase:* 6

---

## 3. Implementation Roadmap

### Phase 4: Foundational SaaS Hardening
*Objective: Prepare the app for real users and large data.*
- Migrate Database from SQLite to PostgreSQL.
- Implement Authentication & Authorization (NextAuth).
- Implement Server-side Pagination, Advanced Search, and Filtering on the Client Directory.

### Phase 5: The "Pitch" Engine (Core Value Prop)
*Objective: Automate the transition from Lead to Won Client.*
- Build the AI Website Redesign Engine (Vision API mockups).
- Build the Automated PDF Proposal Generator (incorporating audit data and mockups).
- Introduce Multi-tenant Workspaces for different teams.

### Phase 6: Automation & Reliability
*Objective: Make the CRM proactive and stable.*
- Automated Email Outreach pipelines.
- Real-time Notifications & WebSocket events.
- Implement E2E Testing (Playwright), Sentry Logging, and CI/CD.

### Future Enhancements
- Stripe Subscription Billing.
- White-labeling options for agencies.
- Native Mobile App (React Native).
