-- Milestone 9: hot-path composite indexes for review queries and admin audit

CREATE INDEX IF NOT EXISTS "VocabularyProgress_learnerId_nextReviewAt_idx" ON "VocabularyProgress"("learnerId", "nextReviewAt");
CREATE INDEX IF NOT EXISTS "RuleProgress_learnerId_nextReviewAt_idx" ON "RuleProgress"("learnerId", "nextReviewAt");
CREATE INDEX IF NOT EXISTS "AuditLogEntry_bookSlug_createdAt_idx" ON "AuditLogEntry"("bookSlug", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLogEntry_actorId_createdAt_idx" ON "AuditLogEntry"("actorId", "createdAt");
