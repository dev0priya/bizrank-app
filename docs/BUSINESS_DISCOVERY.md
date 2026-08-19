# BizRank — Business Discovery & Qualification

## Discovery Flow

```
1. User sets: Country → State → Location → Category → Filters
2. POST /api/jobs — starts a provider run (Apify / Google Places / Mock)
3. Poll GET /api/jobs/:id — provider processes results
4. On completion:
   a. Raw results → DataProcessor.processAndDeduplicate()
   b. ProcessedBusiness → WebsiteAuditor.auditSingleWebsite()
   c. AuditedBusiness → OpportunityScorer.score()
   d. Save to businesses table with opportunity_score, opportunity_level, website_status
5. GET /api/businesses?jobId=X&opportunityLevel=HIGH — fetch qualified results
6. Business cards show: Opportunity badge, website status, rating, phone, location
7. User clicks "Add to CRM" → POST /api/crm/leads
```

## Business Qualification

Businesses are classified into opportunity levels based on a deterministic scoring engine.

### Website Status (websiteStatus)

| Status | Description |
|--------|-------------|
| `UNKNOWN` | No audit performed yet |
| `NO_WEBSITE` | Provider returned no URL, confirmed by audit |
| `WEBSITE_FOUND` | URL provided by provider, not yet verified |
| `WEBSITE_VERIFIED` | Audit confirmed working, quality site |
| `LOW_QUALITY_WEBSITE` | Site exists but poor quality (ai_score < 60) |

### Opportunity Score (0-100)

Computed by `services/opportunityScorer.ts` using signals from `config/opportunityConfig.ts`:

| Signal | Points |
|--------|--------|
| No verified website | +25 |
| Phone available | +15 |
| Strong rating (≥4.0) | +10 |
| Meaningful reviews (≥10) | +10 |
| Social presence without website | +10 |
| Strong category (weight ≥0.85) | +10 |
| Active business status | +10 |
| Has email but no website | +5 |
| Low quality website | +5 |

### Opportunity Level

| Level | Score Range |
|-------|-------------|
| `HIGH` | ≥70 |
| `MEDIUM` | ≥45 |
| `LOW` | ≥20 |
| `NOT_TARGET` | <20 or category.opportunityEligible = false |

### NOT_TARGET Categories

Some business types can never be website leads and are always classified as NOT_TARGET:
- ATM
- Petrol Pump / Fuel Station
- Government Office
- Police Station
- Post Office
- Public Park / Garden

These categories are stored with `opportunityEligible = false` in `BusinessCategory`.

## Category Normalization

Provider category names (raw Google Maps strings) are normalized to BizRank taxonomy via `services/categoryNormalizer.ts`.

Example:
- `"beauty_salon"` → `"Salon"`
- `"hair_salon"` → `"Salon"`
- `"gym"` → `"Gym"`
- `"gas_station"` → `"Petrol Pump"` → `NOT_TARGET`

## Scoring Configuration

All scoring weights and thresholds are in `config/opportunityConfig.ts`. To adjust:

```typescript
export const OPPORTUNITY_SCORING = {
  NO_WEBSITE: 25,    // Increase to prioritize no-website businesses more
  HAS_PHONE: 15,     // Decrease if phone isn't a strong signal
  // ...
};
export const OPPORTUNITY_THRESHOLDS = {
  HIGH: 70,          // Decrease to show more businesses as HIGH
  MEDIUM: 45,
  LOW: 20,
};
```

## Running Tests

```bash
npm run test:opp    # OpportunityScorer unit tests
npm run test:geo    # Geography integration tests
npm run test:all    # Both
```
