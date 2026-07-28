-- AlterEnum
ALTER TYPE "VerificationStatus" ADD VALUE IF NOT EXISTS 'PENDING';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "KnowledgePipelineStatus" AS ENUM ('DISCOVERED', 'REGISTERED', 'PAGES_EXTRACTED', 'OCR_COMPLETE', 'EXTRACTED', 'VERIFIED', 'APPROVED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable MuallimBook
ALTER TABLE "MuallimBook" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "MuallimBook" ADD COLUMN IF NOT EXISTS "status" "KnowledgePipelineStatus" NOT NULL DEFAULT 'DISCOVERED';
CREATE UNIQUE INDEX IF NOT EXISTS "MuallimBook_slug_key" ON "MuallimBook"("slug");
CREATE INDEX IF NOT EXISTS "MuallimBook_status_idx" ON "MuallimBook"("status");

-- AlterTable MuallimPage default (best-effort)
ALTER TABLE "MuallimPage" ALTER COLUMN "verificationStatus" SET DEFAULT 'PENDING';

-- CreateTable OcrResult
CREATE TABLE IF NOT EXISTS "OcrResult" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "language" TEXT,
    "boundingBoxes" JSONB,
    "sourceImagePath" TEXT,
    "version" TEXT NOT NULL DEFAULT '1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OcrResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable PageExtraction
CREATE TABLE IF NOT EXISTS "PageExtraction" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "version" TEXT NOT NULL DEFAULT '1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PageExtraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable VerificationRecord
CREATE TABLE IF NOT EXISTS "VerificationRecord" (
    "id" TEXT NOT NULL,
    "pageId" TEXT,
    "bookId" TEXT,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VerificationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable ExtractionLog
CREATE TABLE IF NOT EXISTS "ExtractionLog" (
    "id" TEXT NOT NULL,
    "bookId" TEXT,
    "stage" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'info',
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExtractionLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OcrResult_pageId_version_idx" ON "OcrResult"("pageId", "version");
CREATE INDEX IF NOT EXISTS "OcrResult_provider_idx" ON "OcrResult"("provider");
CREATE INDEX IF NOT EXISTS "PageExtraction_pageId_version_idx" ON "PageExtraction"("pageId", "version");
CREATE INDEX IF NOT EXISTS "PageExtraction_verificationStatus_idx" ON "PageExtraction"("verificationStatus");
CREATE INDEX IF NOT EXISTS "VerificationRecord_objectType_objectId_idx" ON "VerificationRecord"("objectType", "objectId");
CREATE INDEX IF NOT EXISTS "VerificationRecord_status_idx" ON "VerificationRecord"("status");
CREATE INDEX IF NOT EXISTS "ExtractionLog_bookId_stage_idx" ON "ExtractionLog"("bookId", "stage");
CREATE INDEX IF NOT EXISTS "ExtractionLog_createdAt_idx" ON "ExtractionLog"("createdAt");

DO $$ BEGIN
 ALTER TABLE "OcrResult" ADD CONSTRAINT "OcrResult_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "MuallimPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
 ALTER TABLE "PageExtraction" ADD CONSTRAINT "PageExtraction_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "MuallimPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
 ALTER TABLE "VerificationRecord" ADD CONSTRAINT "VerificationRecord_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "MuallimPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
 ALTER TABLE "ExtractionLog" ADD CONSTRAINT "ExtractionLog_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "MuallimBook"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
