# BizRank CRM API Specification

This document details the RESTful endpoints, parameters, request payloads, and response structures for the CRM module.

All routes are nested under `/api/crm/` and follow standard Next.js Route Handler conventions.

---

## 1. CRM Dashboard Analytics
Retrieves live KPIs and pipeline breakdown metrics without hardcoded numbers.

* **Endpoint**: `GET /api/crm/dashboard`
* **Response**:
```json
{
  "totalLeads": 420,
  "activeLeads": 182,
  "followUpsToday": 14,
  "overdueFollowUps": 3,
  "totalPipelineValue": 284000.0,
  "wonRevenue": 92000.0,
  "conversionRate": 0.22,
  "stageCounts": [
    { "stage": "New", "count": 24, "value": 35000.0 },
    { "stage": "Contacted", "count": 48, "value": 72000.0 },
    { "stage": "Meeting Scheduled", "count": 18, "value": 45000.0 },
    { "stage": "Proposal Sent", "count": 12, "value": 36000.0 },
    { "stage": "Closed Won", "count": 42, "value": 92000.0 },
    { "stage": "Closed Lost", "count": 38, "value": 0.0 }
  ]
}
```

---

## 2. Lead Operations

### A. Add/Push Business to CRM
Creates a new active `CRMLead` record linking back to the discovered `Business`.

* **Endpoint**: `POST /api/crm/leads`
* **Request Body**:
```json
{
  "businessId": 142,
  "priority": "A",
  "estimatedValue": 5000.0,
  "assignedTo": "sales.agent@bizrank.com"
}
```
* **Response (Success `201`)**:
```json
{
  "success": true,
  "leadId": 45
}
```

### B. List CRM Leads (with Filtering & Pagination)
Retrieves a paginated list of leads based on geo-locations, scoring thresholds, categories, stages, and priority levels.

* **Endpoint**: `GET /api/crm/leads`
* **Parameters**:
  - `page` (default `1`)
  - `limit` (default `50`)
  - `stageId` (optional)
  - `priority` (optional, `A` | `B` | `C`)
  - `cityId` (optional)
  - `categoryId` (optional)
  - `minOppScore` (optional)
  - `assignedTo` (optional)
* **Response**:
```json
{
  "data": [
    {
      "id": 45,
      "businessId": 142,
      "business_name": "ABC Dental Clinic",
      "google_category": "Dentist",
      "city": "Jaipur",
      "pipelineStage": "New",
      "priority": "A",
      "estimatedValue": 5000.0,
      "assignedTo": "sales.agent@bizrank.com",
      "opportunity_score": 90,
      "ai_score": 10
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

### C. Update Lead Properties (Stage / Assignee)
Triggered during Kanban drag-and-drop or manual detail updates.

* **Endpoint**: `PATCH /api/crm/leads/[id]`
* **Request Body**:
```json
{
  "pipelineStageId": 3,
  "assignedTo": "sales.manager@bizrank.com",
  "priority": "B"
}
```
* **Response**:
```json
{
  "success": true,
  "updated": {
    "id": 45,
    "pipelineStageId": 3,
    "assignedTo": "sales.manager@bizrank.com",
    "priority": "B"
  }
}
```

---

## 3. Contacts Management

### A. Create Contact
Associates an individual's details with a CRM Lead.

* **Endpoint**: `POST /api/crm/leads/[id]/contacts`
* **Request Body**:
```json
{
  "name": "Dr. Rajesh Gupta",
  "role": "Owner / Chief Dentist",
  "phone": "+91 98765 43210",
  "email": "dr.rajesh@abcdental.com",
  "preferredContactMethod": "WHATSAPP",
  "isPrimary": true
}
```
* **Response**:
```json
{
  "success": true,
  "contact": { "id": 18, "name": "Dr. Rajesh Gupta" }
}
```

---

## 4. Interaction Timeline & Activity Logs

### A. Log Activity Touchpoint
Updates lead activity tracker (adds CALL, WHATSAPP, EMAIL, etc.).

* **Endpoint**: `POST /api/crm/leads/[id]/activities`
* **Request Body**:
```json
{
  "type": "CALL",
  "summary": "Initial Introduction Call",
  "details": "Spoke to the owner, they are interested in building a website and booking system. Demo scheduled.",
  "outcome": "Connected / Scheduled Demo"
}
```
* **Response**:
```json
{
  "success": true,
  "activityId": 124
}
```

### B. Add Profile Note
Registers a persistent background guideline note.

* **Endpoint**: `POST /api/crm/leads/[id]/notes`
* **Request Body**:
```json
{
  "content": "Owner prefers communication only via WhatsApp. Do not call on weekends."
}
```
* **Response**:
```json
{
  "success": true,
  "noteId": 72
}
```

---

## 5. Follow-Ups & Reminders

### A. Schedule Future Follow-Up Action
* **Endpoint**: `POST /api/crm/leads/[id]/follow-ups`
* **Request Body**:
```json
{
  "assignedTo": "sales.agent@bizrank.com",
  "dueAt": "2026-08-20T10:00:00Z",
  "status": "PENDING"
}
```

### B. Close/Update Follow-Up
* **Endpoint**: `PATCH /api/crm/follow-ups/[id]`
* **Request Body**:
```json
{
  "status": "COMPLETED",
  "outcome": "Conducted product demo. Customer signed contract.",
  "completedAt": "2026-08-20T10:15:00Z"
}
```

---

## 6. Commercial Deals & Financial Tracking

### A. Create Deal
* **Endpoint**: `POST /api/crm/leads/[id]/deals`
* **Request Body**:
```json
{
  "value": 1500.0,
  "expectedCloseDate": "2026-08-30T18:00:00Z"
}
```

### B. Close Deal (Won/Lost)
* **Endpoint**: `PATCH /api/crm/deals/[id]`
* **Request Body**:
```json
{
  "status": "WON",
  "wonAt": "2026-08-22T12:00:00Z"
}
```
*or*
```json
{
  "status": "LOST",
  "lostReason": "Pricing was too high, competitor offered cheaper subscription."
}
```
*Note: Marking a Deal as WON automatically shifts the linked Lead stage to 'WON' and creates an AuditLog.*
