-- Milestone 4 — Learning Engine

CREATE TYPE "LearningStage" AS ENUM ('UNKNOWN', 'SEEN', 'RECOGNIZING', 'UNDERSTOOD', 'MASTERED', 'NEEDS_REVIEW');

CREATE TYPE "LearningSessionPhase" AS ENUM ('REVIEW', 'READING', 'RECOGNIZE', 'NEW_WORDS', 'REFLECTION', 'FINISHED');

CREATE TYPE "LearningSessionStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED');

ALTER TABLE "Vocabulary" ADD COLUMN IF NOT EXISTS "occurrenceCount" INTEGER;

ALTER TABLE "VocabularyProgress" ADD COLUMN IF NOT EXISTS "stage" "LearningStage" NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "VocabularyProgress" ADD COLUMN IF NOT EXISTS "lastReviewedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "VocabularyProgress_stage_idx" ON "VocabularyProgress"("stage");

ALTER TABLE "RuleProgress" ADD COLUMN IF NOT EXISTS "stage" "LearningStage" NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "RuleProgress" ADD COLUMN IF NOT EXISTS "revisionCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "RuleProgress" ADD COLUMN IF NOT EXISTS "revisionHistory" JSONB;
ALTER TABLE "RuleProgress" ADD COLUMN IF NOT EXISTS "understandingNote" TEXT;

CREATE INDEX IF NOT EXISTS "RuleProgress_stage_idx" ON "RuleProgress"("stage");

ALTER TABLE "LessonProgress" ADD COLUMN IF NOT EXISTS "completionPercent" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "LessonProgress" ADD COLUMN IF NOT EXISTS "vocabularyMastery" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "LessonProgress" ADD COLUMN IF NOT EXISTS "ruleMastery" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "LessonProgress" ADD COLUMN IF NOT EXISTS "readingComplete" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "LessonProgress" ADD COLUMN IF NOT EXISTS "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'PENDING';

CREATE TABLE IF NOT EXISTS "LearningSession" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "status" "LearningSessionStatus" NOT NULL DEFAULT 'PLANNED',
    "phase" "LearningSessionPhase" NOT NULL DEFAULT 'REVIEW',
    "targetMinutes" INTEGER NOT NULL DEFAULT 20,
    "elapsedSeconds" INTEGER NOT NULL DEFAULT 0,
    "estimatedRemainingMinutes" INTEGER,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "reviewWordIds" TEXT[],
    "newWordIds" TEXT[],
    "reflectionId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LearningSession_learnerId_startedAt_idx" ON "LearningSession"("learnerId", "startedAt");
CREATE INDEX IF NOT EXISTS "LearningSession_status_phase_idx" ON "LearningSession"("status", "phase");

ALTER TABLE "LearningSession" DROP CONSTRAINT IF EXISTS "LearningSession_learnerId_fkey";
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Reflection" ADD COLUMN IF NOT EXISTS "sessionId" TEXT;
ALTER TABLE "Reflection" ADD COLUMN IF NOT EXISTS "understoodToday" TEXT;
ALTER TABLE "Reflection" ADD COLUMN IF NOT EXISTS "difficultWords" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Reflection" ADD COLUMN IF NOT EXISTS "reviewTomorrow" TEXT;

CREATE INDEX IF NOT EXISTS "Reflection_sessionId_idx" ON "Reflection"("sessionId");
