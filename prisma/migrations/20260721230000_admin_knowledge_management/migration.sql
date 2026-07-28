-- Milestone 8: Admin & Knowledge Management

CREATE TYPE "StaffRole" AS ENUM ('ADMIN', 'REVIEWER', 'VIEWER');

CREATE TABLE "StaffMembership" (
    "id" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffMembership_authUserId_key" ON "StaffMembership"("authUserId");
CREATE INDEX "StaffMembership_email_idx" ON "StaffMembership"("email");
CREATE INDEX "StaffMembership_role_idx" ON "StaffMembership"("role");

CREATE TABLE "KnowledgeVersion" (
    "id" TEXT NOT NULL,
    "bookSlug" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "createdBy" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "KnowledgeVersion_bookSlug_objectType_objectId_version_key" ON "KnowledgeVersion"("bookSlug", "objectType", "objectId", "version");
CREATE INDEX "KnowledgeVersion_bookSlug_objectType_objectId_idx" ON "KnowledgeVersion"("bookSlug", "objectType", "objectId");
CREATE INDEX "KnowledgeVersion_createdAt_idx" ON "KnowledgeVersion"("createdAt");

CREATE TABLE "AuditLogEntry" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "objectType" TEXT,
    "objectId" TEXT,
    "bookSlug" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditLogEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLogEntry_createdAt_idx" ON "AuditLogEntry"("createdAt");
CREATE INDEX "AuditLogEntry_action_idx" ON "AuditLogEntry"("action");
CREATE INDEX "AuditLogEntry_bookSlug_idx" ON "AuditLogEntry"("bookSlug");
CREATE INDEX "AuditLogEntry_actorId_idx" ON "AuditLogEntry"("actorId");

CREATE TABLE "PublicationRecord" (
    "id" TEXT NOT NULL,
    "bookSlug" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "validationReport" JSONB,
    "publishedBy" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicationRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PublicationRecord_bookSlug_publishedAt_idx" ON "PublicationRecord"("bookSlug", "publishedAt");
CREATE INDEX "PublicationRecord_status_idx" ON "PublicationRecord"("status");
