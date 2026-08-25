# WORKFLOW IMPLEMENTATION PLAN — BIZRANK

> [!NOTE]
> **PLAN ONLY — NO IMPLEMENTATION PERFORMED.**
> This document specifies the exact technical architecture, database migrations, security controls, API schemas, and UI components needed to implement the final business workflow without modifying any code in this phase.

---

## 1. CURRENT ARCHITECTURE AUDIT

An inspection of the existing codebase was performed. Below is the documentation of the existing structures:

1. **User / Team Model**: No `User` model currently exists in `prisma/schema.prisma`. Authentication and roles are mock-simulated via headers (`x-user-role` and `x-user-username`) in `services/auth_middleware.ts` and `components/layout/Topbar.tsx`, stored in the browser's `localStorage` (`bizrank_active_role` and `bizrank_active_username`).
2. **CRMLead**: Exists in `prisma/schema.prisma` mapping to the `crm_leads` table. It contains relations to `pipelineStage`, `contacts`, `activities`, `notes`, `followUps`, `deals`, and `tags`.
3. **Business**: Exists in `prisma/schema.prisma` mapping to the `businesses` table. It represents the discovered businesses and has a 1-to-1 relation to `CRMLead`.
4. **Contact**: Exists as `Contact` model mapping to `crm_contacts`.
5. **Activity**: Exists as `Activity` model mapping to `crm_activities`, tracking communication actions (`CALL`, `WHATSAPP`, `EMAIL`, etc.) with `performedBy` string and `occurredAt` timestamp.
6. **CRMNote**: Exists as `CRMNote` model mapping to `crm_notes`.
7. **FollowUp**: Exists as `FollowUp` model mapping to `crm_follow_ups`, tracking `assignedTo`, `dueAt`, `status`, and `completedAt`.
8. **Deal**: Exists as `Deal` model mapping to `crm_deals`.
9. **Pipeline**: Exists as `Pipeline` model mapping to `crm_pipelines`.
10. **PipelineStage**: Exists as `PipelineStage` model mapping to `crm_pipeline_stages`.
11. **CRMAuditLog**: Exists as `CRMAuditLog` model mapping to `crm_audit_logs`, tracking actions performed in the system.
12. **Business Discovery**: Implemented in `/app/discovery` (UI) and `/api/businesses` & `/api/search` (APIs).
13. **Discovery Jobs**: Managed via the `CollectionJob` database model and `/app/jobs` view.
14. **Apify Provider**: Implemented in `services/apifyProvider.ts` as the primary live google-maps scraper.
15. **Business ➔ CRM Promotion**: Implemented in POST `/api/crm/leads`.
16. **Team Page**: Implemented in `/app/crm/team/page.tsx` and `TeamClient.tsx` tracking agent performance aggregated dynamically from leads data.
17. **Leads Page**: Implemented in `/app/crm/leads/page.tsx` and `LeadsClient.tsx` showing the lead registry.
18. **Tasks Page**: Implemented in `/app/crm/tasks/page.tsx` and `TasksClient.tsx`.
19. **Activities Page**: Implemented in `/app/crm/activities/page.tsx` and `ActivitiesClient.tsx`.
20. **Follow-ups Page**: Implemented in `/app/crm/follow-ups/page.tsx`.

---

## 2. DATABASE PLAN & SCHEMATIC RELATIONSHIP MAP

### Proposed Relational Model Changes

To support the workflow logically and safely without creating duplicate assignment structures, we will introduce a `User` model, seed the four system users, and add clean foreign key relationships to the existing `CRMLead` table.

```
+------------+          +------------+          +------------+
|  Business  | -------> |  CRMLead   | <------- |    User    |
+------------+          +------------+          +------------+
                              |                       |
                              |                       |
                              v                       v
                        +------------+          +------------+
                        |  Contact   |          |  Activity  |
                        +------------+          +------------+
                              |                       |
                              v                       v
                        +------------+          +------------+
                        |  FollowUp  |          |CRMAuditLog |
                        +------------+          +------------+
```

### Schema Modifications (`prisma/schema.prisma`)

We will add/modify these models in `prisma/schema.prisma`:

#### `User` Model [NEW]
```prisma
model User {
  id        String   @id @default(uuid())
  username  String   @unique // e.g. "simran@bizrank.com", "swati@bizrank.com"
  name      String   // e.g. "Simran Kaur", "Swati Chaudhary"
  role      String   // "DEVELOPER" | "COMMUNICATION" | "ADMIN" | "MANAGER" | "VIEWER"
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  assignedDeveloperLeads CRMLead[] @relation("DeveloperLeads")
  assignedSwatiLeads     CRMLead[] @relation("SwatiLeads")
}
```

#### `CRMLead` Model [MODIFY]
Reusing existing `CRMLead` structure, adding dedicated workspace tracking fields:
```prisma
model CRMLead {
  // Existing fields...
  
  // Developer assignment fields
  developerId       String?
  developer         User?           @relation("DeveloperLeads", fields: [developerId], references: [id], onDelete: SetNull)
  websiteStatus     String          @default("ASSIGNED") // "ASSIGNED" | "IN_PROGRESS" | "COMPLETED"
  websiteUrl        String?
  websiteCompletedAt DateTime?
  
  // Swati handoff fields
  swatiId           String?
  swati             User?           @relation("SwatiLeads", fields: [swatiId], references: [id], onDelete: SetNull)
  handoffStatus     String          @default("PENDING") // "PENDING" | "HANDED_OVER" | "IN_PROGRESS" | "CLOSED"
  handoffDate       DateTime?
  
  // Client communication & overall status tracking
  clientStatus      String          @default("Follow-up Required") // "Interested" | "Not Interested" | "Follow-up Required" | "No Response" | "Closed"
}
```

#### Why it is needed:
- Reuses `CRMLead` directly to prevent duplicate records.
- Eliminates hardcoded names from business logic.
- Avoids standalone assignment tables.
- Leverages database-enforced integrity.

---

## 3. USER & ROLE ID ARCHITECTURE

### Default Seeding Strategy
The database seed script (`prisma/seed.ts`) will be extended to seed these exactly:

| ID (UUID) | Username (Email) | Full Name | Role |
|---|---|---|---|
| `dev-usr-simran` | `simran@bizrank.com` | Simran Kaur | `DEVELOPER` |
| `dev-usr-sakshi` | `sakshi@bizrank.com` | Sakshi Sharma | `DEVELOPER` |
| `dev-usr-sumit` | `sumit@bizrank.com` | Sumit Chaudhary | `DEVELOPER` |
| `comm-usr-swati` | `swati@bizrank.com` | Swati Chaudhary | `COMMUNICATION` |

*Note: Real UUIDs will be generated in migrations. The fallback switcher in Topbar will be updated to fetch users from `/api/crm/users` dynamically rather than hardcoding credentials.*

---

## 4. WORKFLOW ARCHITECTURE SPECIFICATION

### Phase 2: Developer Assignment
- Pushed from "Business Discovery" ➔ "Leads".
- **API UI Entry Point**: Assign dropdown shows only users with the `DEVELOPER` role (Simran, Sakshi, Sumit). Swati Chaudhary is excluded.
- **Audit Logging**: Write a `CRMAuditLog` entry with action `LEAD_ASSIGNED_TO_DEVELOPER`.

### Phase 3 & 4: Developer Workspace & Website Completed
- Developer logs in and navigates to the **Team** workspace page filtered by their `User.id` (e.g. `Team ➔ Simran Kaur`).
- They can view:
  1. Business details (Name, Address).
  2. Website Status ("ASSIGNED", "IN_PROGRESS", "COMPLETED").
  3. Client Phone Number (loaded from associated `Contact` record).
- Action buttons:
  - `[ Start Work ]` ➔ sets `websiteStatus` to `"IN_PROGRESS"`.
  - `[ Complete Website ]` ➔ opens modal requesting `websiteUrl`. Sets `websiteStatus` to `"COMPLETED"`, populates `websiteCompletedAt` and `websiteUrl`.
  - `[ Share with Swati ]` ➔ activates only if `websiteStatus` is `"COMPLETED"` and `Contact.phone` is populated. Sets `handoffStatus` to `"HANDED_OVER"` and `handoffDate` to current timestamp, auto-assigning `swatiId` to the seeded communication owner ID.

### Phase 5 & 6: Swati Workspace & Client Communication
- Swati logs into her workspace (e.g. `Team ➔ Swati Chaudhary`).
- Screen categorized by:
  1. **New Handoffs**: Leads with `handoffStatus = "HANDED_OVER"`.
  2. **Follow-ups Today**: FollowUp tasks due today or overdue.
  3. **Interested**: `clientStatus = "Interested"`.
  4. **Not Interested / Nurture**: `clientStatus = "Not Interested"`.
  5. **Closed**: `clientStatus = "Closed"`.
- Clicking on a lead opens the communication card. Swati can:
  - View the shared website link, client phone number, and developer metadata.
  - Open a **Log Communication** form:
    - Input: *Method* (Call, WhatsApp, SMS, Other), *Date/Time*, *What Client Said*, *Status* (Interested, Not Interested, Follow-up Required, No Response, Closed), *Next Follow-up Date/Time* (optional).
    - Submitting records an `Activity` in the lead timeline, creates a `FollowUp` task if a date is set, updates `clientStatus`, and writes an audit log.

---

## 5. API SPECIFICATION

### 1. Assign Developer
- **Method / Route**: `PATCH /api/crm/leads/[id]/developer`
- **Auth**: Roles `ADMIN` or `MANAGER`.
- **Request**: `{ "developerId": "string" }`
- **Response**: `{ "success": true, "lead": { ... } }`
- **Validation**: Enforce `developerId` maps to an active user with role `DEVELOPER`.

### 2. Update Website Development Status
- **Method / Route**: `PATCH /api/crm/leads/[id]/website-status`
- **Auth**: Developer assigned to the lead, `ADMIN`, or `MANAGER`.
- **Request**: `{ "status": "IN_PROGRESS" | "COMPLETED", "websiteUrl": "string" }`
- **Response**: `{ "success": true }`
- **Validation**: If status is `"COMPLETED"`, `websiteUrl` is required and must validate as a valid URL format.

### 3. Share Handoff with Swati
- **Method / Route**: `POST /api/crm/leads/[id]/handoff`
- **Auth**: Developer assigned to the lead, `ADMIN`, or `MANAGER`.
- **Request**: `null` (Server determines targets based on seeded Swati ID)
- **Response**: `{ "success": true, "handoffDate": "DateTime" }`
- **Validation**: Requires `websiteStatus` to be `"COMPLETED"` and at least one primary client contact phone number to exist in the database.

### 4. Log Client Communication
- **Method / Route**: `POST /api/crm/leads/[id]/communication`
- **Auth**: Swati Chaudhary, `ADMIN`, or `MANAGER`.
- **Request**: 
  ```json
  {
    "method": "CALL" | "WHATSAPP" | "SMS" | "OTHER",
    "details": "string",
    "clientStatus": "Interested" | "Not Interested" | "Follow-up Required" | "No Response" | "Closed",
    "nextFollowUpDate": "string (ISO Date string)"
  }
  ```
- **Response**: `{ "success": true }`
- **Database Transaction**:
  1. Create a `crm_activities` record capturing details, performed by Swati, and occurredAt timestamp.
  2. Update `CRMLead.clientStatus`.
  3. If `nextFollowUpDate` is provided, create a `crm_follow_ups` record marked as `PENDING` due at the specified time.

---

## 6. SECURITY & AUTHORIZATION

To safeguard data operations from frontend manipulation:
1. **Access Isolation**: In backend route handlers, verify that if the calling user's role is `DEVELOPER`, they can only write status modifications if `CRMLead.developerId === callingUserId`.
2. **Handoff Validation**: Developers can ONLY assign work to Swati (the communication specialist) via the server-controlled handoff route; they cannot reassign developer IDs or modify `clientStatus` fields directly.
3. **Roles Isolation**: Ensure that `developerId` matches a user with `role === "DEVELOPER"`. Swati Chaudhary's user account will fail this backend constraint check, preventing incorrect assignments.

---

## 7. EDGE CASES & SOLUTIONS

1. **Business assigned twice**: Re-assignment is permitted only for `ADMIN`/`MANAGER`. It clears any active development tasks and resets the status to `ASSIGNED`.
2. **Developer shares without website URL or client phone**: The backend rejects handoff execution with an HTTP 400 Bad Request listing the missing field.
3. **Duplicate Handoffs**: Clicking "Share with Swati" multiple times has no duplicate impact; if `handoffStatus` is already `"HANDED_OVER"`, the server returns a successful 200 indicating it is already shared.
4. **Multiple communication logging**: Each logging event creates a unique `Activity` sequence block in the timeline. Previous records are read-only and preserved chronologically.
5. **Follow-up Overdue Handling**: Swati's workspace lists due follow-ups in a red alert style container under **Follow-ups Today** if the date is past now.

---

## 8. IMPLEMENTATION PHASES

- **PHASE 1**: Create and run the Prisma database migrations for `User` model, relation links, and data seed.
- **PHASE 2**: Add developer assignment selector to Business Discovery promotion card and Leads details.
- **PHASE 3**: Develop Developer Workspace route on the Team page showing assigned worklists.
- **PHASE 4**: Add website completion status mutation action forms with URL validation.
- **PHASE 5**: Build the developer-to-Swati handoff action button and verify the automated record setup.
- **PHASE 6**: Deploy Swati's categorized incoming handoff dashboard workspace.
- **PHASE 7**: Create the client communication logging drawer and activity feed integration.
- **PHASE 8**: Implement the next follow-ups task scheduling and overdue filters.
- **PHASE 9**: Establish role-based authorization checkers on the API route handlers.
- **PHASE 10**: Conduct full end-to-end integration flow verification testing.

---

## 9. EXPLICIT OUT-OF-SCOPE LIST

- Payment gateways or revenue invoicing pages.
- Client membership subscription dashboards.
- Integrations with external WhatsApp, SMS, or telephony Twilio API providers (all logging is manual).
- Redesigning pages unrelated to the discovery-to-developer-to-communication workflow.

---

**PLAN ONLY — NO IMPLEMENTATION PERFORMED.**
