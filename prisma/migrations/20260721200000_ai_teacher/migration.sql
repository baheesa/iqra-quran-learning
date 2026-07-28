-- Milestone 5 — AI Teacher conversations

CREATE TYPE "TeacherMessageRole" AS ENUM ('LEARNER', 'TEACHER', 'SYSTEM');
CREATE TYPE "TeacherIntent" AS ENUM ('ASK', 'WORD', 'PHRASE', 'LESSON', 'RULE', 'REVIEW_SUGGESTION');

CREATE TABLE "TeacherConversation" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TeacherConversation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TeacherConversation_learnerId_updatedAt_idx" ON "TeacherConversation"("learnerId", "updatedAt");

ALTER TABLE "TeacherConversation" ADD CONSTRAINT "TeacherConversation_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TeacherMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "TeacherMessageRole" NOT NULL,
    "intent" "TeacherIntent" NOT NULL DEFAULT 'ASK',
    "content" TEXT NOT NULL,
    "contextSnapshot" JSONB,
    "knowledgeRefs" JSONB,
    "promptVersion" TEXT,
    "provider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TeacherMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TeacherMessage_conversationId_createdAt_idx" ON "TeacherMessage"("conversationId", "createdAt");
CREATE INDEX "TeacherMessage_intent_idx" ON "TeacherMessage"("intent");

ALTER TABLE "TeacherMessage" ADD CONSTRAINT "TeacherMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "TeacherConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TeacherFeedback" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "helpful" BOOLEAN,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TeacherFeedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TeacherFeedback_messageId_key" ON "TeacherFeedback"("messageId");

ALTER TABLE "TeacherFeedback" ADD CONSTRAINT "TeacherFeedback_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "TeacherMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
