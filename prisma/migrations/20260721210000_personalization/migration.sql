-- Milestone 6 — Personalization & Intelligence

CREATE TYPE "ExplanationStyle" AS ENUM ('BRIEF', 'GUIDED', 'DETAILED');

ALTER TABLE "LearnerPreferences" ADD COLUMN IF NOT EXISTS "preferredExplanationStyle" "ExplanationStyle" NOT NULL DEFAULT 'GUIDED';

CREATE TABLE IF NOT EXISTS "LearnerAnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LearnerAnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LearnerAnalyticsSnapshot_learnerId_period_periodStart_idx"
  ON "LearnerAnalyticsSnapshot"("learnerId", "period", "periodStart");

ALTER TABLE "LearnerAnalyticsSnapshot" DROP CONSTRAINT IF EXISTS "LearnerAnalyticsSnapshot_learnerId_fkey";
ALTER TABLE "LearnerAnalyticsSnapshot" ADD CONSTRAINT "LearnerAnalyticsSnapshot_learnerId_fkey"
  FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
