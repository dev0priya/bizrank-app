-- ====================================================
-- D1 WORKSPACE & SHARING SCHEMA & SEED DATA
-- ====================================================

PRAGMA foreign_keys = OFF;

-- 1. Create Workspace & Sharing Tables
CREATE TABLE IF NOT EXISTS "workspaces" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "workspace_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "workspace_members_workspaceId_userId_key" ON "workspace_members"("workspaceId", "userId");

CREATE TABLE IF NOT EXISTS "workspace_websites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "crmLeadId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("crmLeadId") REFERENCES "crm_leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "workspace_websites_workspaceId_crmLeadId_key" ON "workspace_websites"("workspaceId", "crmLeadId");

CREATE TABLE IF NOT EXISTS "website_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "crmLeadId" INTEGER NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "assignedToUserId" TEXT NOT NULL,
    "assignedByUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("crmLeadId") REFERENCES "crm_leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("assignedToUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("assignedByUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "workspace_shares" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceWorkspaceId" TEXT NOT NULL,
    "targetWorkspaceId" TEXT NOT NULL,
    "crmLeadId" INTEGER NOT NULL,
    "sharedByUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACCEPTED',
    "permissions" TEXT NOT NULL DEFAULT 'READ',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("sourceWorkspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("targetWorkspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("crmLeadId") REFERENCES "crm_leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("sharedByUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "workspace_shares_source_target_lead_key" ON "workspace_shares"("sourceWorkspaceId", "targetWorkspaceId", "crmLeadId");

-- 2. Seed Pipelines & Pipeline Stages if missing
INSERT OR IGNORE INTO "crm_pipelines" ("id", "name", "createdAt") VALUES (1, "Standard Sales Pipeline", CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "crm_pipeline_stages" ("id", "name", "order", "pipelineId", "createdAt") VALUES (1, "New", 1, 1, CURRENT_TIMESTAMP);

-- 3. Seed Core Users
INSERT OR REPLACE INTO "users" ("id", "username", "name", "email", "role", "isActive", "createdAt", "updatedAt")
VALUES 
  ('usr-admin-01', 'admin@bizrank.com', 'Admin User', 'admin@bizrank.com', 'ADMIN', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('usr-swati-01', 'swati@bizrank.com', 'Swati Chaudhary', 'swati@bizrank.com', 'COMMUNICATION', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('usr-simran-01', 'simran@bizrank.com', 'Simran Kaur', 'simran@bizrank.com', 'DEVELOPER', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('usr-sakshi-01', 'sakshi@bizrank.com', 'Sakshi Sharma', 'sakshi@bizrank.com', 'DEVELOPER', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('usr-sumit-01', 'sumit@bizrank.com', 'Sumit Thakur', 'sumit@bizrank.com', 'DEVELOPER', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4. Seed Core Workspaces
INSERT OR REPLACE INTO "workspaces" ("id", "name", "ownerId", "createdAt", "updatedAt")
VALUES
  ('ws-main-01', 'Main Workspace', 'usr-admin-01', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ws-swati-01', 'Swati Chaudhary Workspace', 'usr-swati-01', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ws-simran-01', 'Simran Kaur Workspace', 'usr-simran-01', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ws-sakshi-01', 'Sakshi Sharma Workspace', 'usr-sakshi-01', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ws-sumit-01', 'Sumit Thakur Workspace', 'usr-sumit-01', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 5. Seed Workspace Memberships
INSERT OR REPLACE INTO "workspace_members" ("id", "workspaceId", "userId", "role", "status", "createdAt", "updatedAt")
VALUES
  ('wm-main-admin', 'ws-main-01', 'usr-admin-01', 'OWNER', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wm-main-swati', 'ws-main-01', 'usr-swati-01', 'MEMBER', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wm-main-simran', 'ws-main-01', 'usr-simran-01', 'MEMBER', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wm-main-sakshi', 'ws-main-01', 'usr-sakshi-01', 'MEMBER', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wm-main-sumit', 'ws-main-01', 'usr-sumit-01', 'MEMBER', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wm-swati-owner', 'ws-swati-01', 'usr-swati-01', 'OWNER', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wm-simran-owner', 'ws-simran-01', 'usr-simran-01', 'OWNER', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wm-sakshi-owner', 'ws-sakshi-01', 'usr-sakshi-01', 'OWNER', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wm-sumit-owner', 'ws-sumit-01', 'usr-sumit-01', 'OWNER', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 6. Seed SHARED Website (ID 999 - Shared with Main Workspace)
INSERT OR IGNORE INTO "businesses" ("id", "provider", "business_name", "full_address", "phone_number", "website", "website_exists", "website_status", "collection_date")
VALUES (999, 'apify', 'Example Enterprises', '123 Tech Park, Delhi', '+919876543210', 'https://example.com', 1, 'WEBSITE_COMPLETED', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "crm_leads" ("id", "businessId", "pipelineStageId", "assignedTo", "websiteStatus", "websiteUrl", "handoffStatus", "clientStatus", "createdAt", "updatedAt")
VALUES (999, 999, 1, 'swati@bizrank.com', 'COMPLETED', 'https://example.com', 'HANDED_OVER', 'New', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR REPLACE INTO "workspace_websites" ("id", "workspaceId", "crmLeadId", "createdAt", "updatedAt")
VALUES ('ww-swati-999', 'ws-swati-01', 999, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR REPLACE INTO "website_assignments" ("id", "crmLeadId", "workspaceId", "assignedToUserId", "assignedByUserId", "status", "createdAt", "updatedAt")
VALUES ('wa-swati-999', 999, 'ws-swati-01', 'usr-swati-01', 'usr-admin-01', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR REPLACE INTO "workspace_shares" ("id", "sourceWorkspaceId", "targetWorkspaceId", "crmLeadId", "sharedByUserId", "status", "permissions", "createdAt", "updatedAt")
VALUES ('ws-swati-to-main-999', 'ws-swati-01', 'ws-main-01', 999, 'usr-swati-01', 'ACCEPTED', 'READ', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 7. Seed UNSHARED / PRIVATE Website (ID 888 - Swati's Private Website NOT shared with Main Workspace)
INSERT OR IGNORE INTO "businesses" ("id", "provider", "business_name", "full_address", "phone_number", "website", "website_exists", "website_status", "collection_date")
VALUES (888, 'apify', 'Swati Private Business', '456 Cyber City, Gurugram', '+919123456789', 'https://swatiprivate.com', 1, 'WEBSITE_IN_PROGRESS', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "crm_leads" ("id", "businessId", "pipelineStageId", "assignedTo", "websiteStatus", "websiteUrl", "handoffStatus", "clientStatus", "createdAt", "updatedAt")
VALUES (888, 888, 1, 'swati@bizrank.com', 'IN_PROGRESS', 'https://swatiprivate.com', 'PENDING', 'New', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR REPLACE INTO "workspace_websites" ("id", "workspaceId", "crmLeadId", "createdAt", "updatedAt")
VALUES ('ww-swati-888', 'ws-swati-01', 888, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR REPLACE INTO "website_assignments" ("id", "crmLeadId", "workspaceId", "assignedToUserId", "assignedByUserId", "status", "createdAt", "updatedAt")
VALUES ('wa-swati-888', 888, 'ws-swati-01', 'usr-swati-01', 'usr-admin-01', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

PRAGMA foreign_keys = ON;
