# BizRank — Geographic Architecture

## Overview

BizRank uses a multi-tier geographic model to support the Business Discovery flow:

```
Country
  └── State (28 states + 8 Union Territories)
        ├── District (optional, from Census 2011 import)
        │     └── SubDistrict (optional, from Census 2011 import)
        │           └── City / Town / Village
        │                 └── Area / Locality
        └── City (direct relation, for seed data)
              └── Area / Locality
```

## User-Facing Discovery Flow

The user-facing discovery UI uses a simplified flow:

```
Country [India]
→ State [dropdown — 36 states/UTs separated by group]
→ Location / Area [autocomplete — state-scoped, searches SearchLocation table]
→ Business Category [dropdown — BizRank opportunity taxonomy]
→ Opportunity Filters [collapsible: website status, phone, rating, reviews, opportunity level]
→ Search
```

**District/SubDistrict are not shown to the user.** They are stored for data integrity but hidden in the UX.

## SearchLocation Index

The `SearchLocation` table is a flat, denormalized search index used for autocomplete.

| Field       | Description |
|-------------|-------------|
| `name`      | Search term (e.g., "Rohini") |
| `displayName` | Full display (e.g., "Rohini, Delhi") |
| `type`      | CITY \| AREA \| TOWN \| STATE |
| `stateId`   | **Required** — enforces state-scoping |
| `cityId`    | Parent city (optional) |
| `areaId`    | Area record (optional) |
| `latitude`  | Approx coordinates |
| `longitude` | Approx coordinates |

### API

```
GET /api/locations/search?q=rohini&stateId=1&limit=10
```

- `stateId` is **required** — cross-state search is rejected with 400
- Returns up to `limit` locations sorted: CITY type first, then alphabetical

## State Scoping Rule

**No location may be returned in a search response if its `stateId` does not match the requested `stateId`.**

This is enforced at the database query layer — not in the frontend.

## Data Sources

| Source | Coverage | Format |
|--------|----------|--------|
| **BizRank Seed** | 36 states/UTs, major cities and commercial areas | Embedded in `prisma/seed.ts` |
| **Census 2011** | Full national hierarchy (cities/towns/villages) | XLSX via `services/import_geography.ts` |
| **LGD (Local Government Directory)** | States, Districts, SubDistricts | DWR API via `services/import_geography.ts` |

The embedded seed is sufficient for commercial discovery. The Census/LGD import can be run in cloud environments for full granularity.

## Geographic Integrity Tests

```bash
npm run test:geo
```

Tests verify:
- All 36 states/UTs are present
- State type (STATE vs UNION_TERRITORY) is correct
- City-state parent containment (e.g., Rohini → Delhi, not Haryana)
- Cross-state isolation (Rohini not visible when searching in Haryana scope)
- SearchLocation state-scoping enforcement
- Category eligibility data integrity
