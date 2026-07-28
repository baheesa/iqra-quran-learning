-- Milestone 7 — Authentication & Cloud Sync

CREATE TABLE IF NOT EXISTS "LearnerCloudState" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "checksum" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LearnerCloudState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LearnerCloudState_learnerId_key" ON "LearnerCloudState"("learnerId");
CREATE UNIQUE INDEX IF NOT EXISTS "LearnerCloudState_authUserId_key" ON "LearnerCloudState"("authUserId");
CREATE INDEX IF NOT EXISTS "LearnerCloudState_authUserId_idx" ON "LearnerCloudState"("authUserId");
CREATE INDEX IF NOT EXISTS "LearnerCloudState_updatedAt_idx" ON "LearnerCloudState"("updatedAt");

ALTER TABLE "LearnerCloudState" DROP CONSTRAINT IF EXISTS "LearnerCloudState_learnerId_fkey";
ALTER TABLE "LearnerCloudState" ADD CONSTRAINT "LearnerCloudState_learnerId_fkey"
  FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "SyncConflictLog" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "localRevision" INTEGER NOT NULL,
    "remoteRevision" INTEGER NOT NULL,
    "resolution" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SyncConflictLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SyncConflictLog_learnerId_createdAt_idx" ON "SyncConflictLog"("learnerId", "createdAt");
CREATE INDEX IF NOT EXISTS "SyncConflictLog_authUserId_idx" ON "SyncConflictLog"("authUserId");

ALTER TABLE "SyncConflictLog" DROP CONSTRAINT IF EXISTS "SyncConflictLog_learnerId_fkey";
ALTER TABLE "SyncConflictLog" ADD CONSTRAINT "SyncConflictLog_learnerId_fkey"
  FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
