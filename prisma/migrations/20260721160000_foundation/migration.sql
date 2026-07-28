-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNKNOWN', 'NEEDS_REVIEW', 'VERIFIED', 'APPROVED');

-- CreateEnum
CREATE TYPE "ReviewObjectType" AS ENUM ('VOCABULARY', 'RULE', 'LESSON', 'EXERCISE', 'QURAN_WORD');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'DUE', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('RECOGNITION', 'MATCHING', 'FILL_MISSING', 'CONTEXT', 'MEANING_RECALL', 'REFLECTION', 'OTHER');

-- CreateTable
CREATE TABLE "Learner" (
    "id" TEXT NOT NULL,
    "authUserId" TEXT,
    "displayName" TEXT,
    "currentVolume" INTEGER NOT NULL DEFAULT 1,
    "currentUnit" INTEGER NOT NULL DEFAULT 1,
    "currentLessonId" TEXT,
    "currentJuz" INTEGER NOT NULL DEFAULT 1,
    "currentSurah" INTEGER NOT NULL DEFAULT 1,
    "currentAyah" INTEGER NOT NULL DEFAULT 1,
    "dailyGoalMinutes" INTEGER NOT NULL DEFAULT 20,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Learner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnerPreferences" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "fontSize" TEXT NOT NULL DEFAULT 'medium',
    "preferredReviewLength" INTEGER NOT NULL DEFAULT 5,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Surah" (
    "id" INTEGER NOT NULL,
    "nameArabic" TEXT NOT NULL,
    "nameUrdu" TEXT,
    "nameEnglish" TEXT,
    "ayahCount" INTEGER NOT NULL,
    "revelationType" TEXT,

    CONSTRAINT "Surah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ayah" (
    "id" TEXT NOT NULL,
    "surahId" INTEGER NOT NULL,
    "ayahNumber" INTEGER NOT NULL,
    "juz" INTEGER NOT NULL,
    "page" INTEGER,
    "arabicText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ayah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuranWord" (
    "id" TEXT NOT NULL,
    "ayahId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "arabic" TEXT NOT NULL,
    "root" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuranWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MuallimBook" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "volume" INTEGER,
    "unit" INTEGER,
    "edition" TEXT,
    "pdfPath" TEXT NOT NULL,
    "checksum" TEXT,
    "pageCount" INTEGER,
    "version" TEXT NOT NULL DEFAULT '1',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MuallimBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MuallimPage" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "imagePath" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "resolution" TEXT,
    "ocrText" TEXT,
    "visionOutput" JSONB,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNKNOWN',
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MuallimPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "bookId" TEXT,
    "volume" INTEGER NOT NULL,
    "unit" INTEGER NOT NULL,
    "lessonNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "objectives" TEXT[],
    "summary" TEXT,
    "pageStart" INTEGER,
    "pageEnd" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vocabulary" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "arabic" TEXT NOT NULL,
    "urduMeaning" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "frequency" INTEGER,
    "root" TEXT,
    "examples" TEXT[],
    "sourcePage" INTEGER,
    "confidence" DOUBLE PRECISION,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNKNOWN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "examples" TEXT[],
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "sourcePage" INTEGER,
    "confidence" DOUBLE PRECISION,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNKNOWN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "exerciseType" "ExerciseType" NOT NULL DEFAULT 'OTHER',
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "estimatedMinutes" INTEGER,
    "sourcePage" INTEGER,
    "confidence" DOUBLE PRECISION,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNKNOWN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuranLink" (
    "id" TEXT NOT NULL,
    "vocabularyId" TEXT,
    "ruleId" TEXT,
    "lessonId" TEXT,
    "ayahId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuranLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabularyProgress" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "vocabularyId" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "timesSeen" INTEGER NOT NULL DEFAULT 0,
    "timesRecognized" INTEGER NOT NULL DEFAULT 0,
    "timesForgotten" INTEGER NOT NULL DEFAULT 0,
    "firstSeenAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VocabularyProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleProgress" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "mistakes" INTEGER NOT NULL DEFAULT 0,
    "lastReviewed" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuleProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonProgress" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingSession" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "startSurah" INTEGER NOT NULL,
    "startAyah" INTEGER NOT NULL,
    "endSurah" INTEGER,
    "endAyah" INTEGER,
    "wordsTapped" INTEGER NOT NULL DEFAULT 0,
    "questionsAsked" INTEGER NOT NULL DEFAULT 0,
    "reflectionText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewQueueItem" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "objectType" "ReviewObjectType" NOT NULL,
    "objectId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewQueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reflection" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "lessonId" TEXT,
    "sessionNote" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reflection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "surahId" INTEGER NOT NULL,
    "ayahNumber" INTEGER NOT NULL,
    "title" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_VocabularyRules" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_VocabularyRules_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Learner_authUserId_key" ON "Learner"("authUserId");

-- CreateIndex
CREATE INDEX "Learner_currentJuz_currentSurah_currentAyah_idx" ON "Learner"("currentJuz", "currentSurah", "currentAyah");

-- CreateIndex
CREATE UNIQUE INDEX "LearnerPreferences_learnerId_key" ON "LearnerPreferences"("learnerId");

-- CreateIndex
CREATE INDEX "Ayah_juz_idx" ON "Ayah"("juz");

-- CreateIndex
CREATE INDEX "Ayah_page_idx" ON "Ayah"("page");

-- CreateIndex
CREATE UNIQUE INDEX "Ayah_surahId_ayahNumber_key" ON "Ayah"("surahId", "ayahNumber");

-- CreateIndex
CREATE INDEX "QuranWord_arabic_idx" ON "QuranWord"("arabic");

-- CreateIndex
CREATE UNIQUE INDEX "QuranWord_ayahId_position_key" ON "QuranWord"("ayahId", "position");

-- CreateIndex
CREATE INDEX "MuallimBook_volume_unit_idx" ON "MuallimBook"("volume", "unit");

-- CreateIndex
CREATE INDEX "MuallimPage_verificationStatus_idx" ON "MuallimPage"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "MuallimPage_bookId_pageNumber_key" ON "MuallimPage"("bookId", "pageNumber");

-- CreateIndex
CREATE INDEX "Lesson_unit_lessonNumber_idx" ON "Lesson"("unit", "lessonNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_volume_unit_lessonNumber_key" ON "Lesson"("volume", "unit", "lessonNumber");

-- CreateIndex
CREATE INDEX "Vocabulary_arabic_idx" ON "Vocabulary"("arabic");

-- CreateIndex
CREATE INDEX "Vocabulary_lessonId_idx" ON "Vocabulary"("lessonId");

-- CreateIndex
CREATE INDEX "Vocabulary_verificationStatus_idx" ON "Vocabulary"("verificationStatus");

-- CreateIndex
CREATE INDEX "Rule_lessonId_idx" ON "Rule"("lessonId");

-- CreateIndex
CREATE INDEX "Rule_verificationStatus_idx" ON "Rule"("verificationStatus");

-- CreateIndex
CREATE INDEX "Exercise_lessonId_idx" ON "Exercise"("lessonId");

-- CreateIndex
CREATE INDEX "Exercise_verificationStatus_idx" ON "Exercise"("verificationStatus");

-- CreateIndex
CREATE INDEX "QuranLink_vocabularyId_idx" ON "QuranLink"("vocabularyId");

-- CreateIndex
CREATE INDEX "QuranLink_ruleId_idx" ON "QuranLink"("ruleId");

-- CreateIndex
CREATE INDEX "QuranLink_lessonId_idx" ON "QuranLink"("lessonId");

-- CreateIndex
CREATE INDEX "QuranLink_ayahId_idx" ON "QuranLink"("ayahId");

-- CreateIndex
CREATE INDEX "VocabularyProgress_nextReviewAt_idx" ON "VocabularyProgress"("nextReviewAt");

-- CreateIndex
CREATE INDEX "VocabularyProgress_confidence_idx" ON "VocabularyProgress"("confidence");

-- CreateIndex
CREATE UNIQUE INDEX "VocabularyProgress_learnerId_vocabularyId_key" ON "VocabularyProgress"("learnerId", "vocabularyId");

-- CreateIndex
CREATE INDEX "RuleProgress_nextReviewAt_idx" ON "RuleProgress"("nextReviewAt");

-- CreateIndex
CREATE UNIQUE INDEX "RuleProgress_learnerId_ruleId_key" ON "RuleProgress"("learnerId", "ruleId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonProgress_learnerId_lessonId_key" ON "LessonProgress"("learnerId", "lessonId");

-- CreateIndex
CREATE INDEX "ReadingSession_learnerId_startedAt_idx" ON "ReadingSession"("learnerId", "startedAt");

-- CreateIndex
CREATE INDEX "ReviewQueueItem_learnerId_dueAt_status_idx" ON "ReviewQueueItem"("learnerId", "dueAt", "status");

-- CreateIndex
CREATE INDEX "ReviewQueueItem_objectType_objectId_idx" ON "ReviewQueueItem"("objectType", "objectId");

-- CreateIndex
CREATE INDEX "Reflection_learnerId_createdAt_idx" ON "Reflection"("learnerId", "createdAt");

-- CreateIndex
CREATE INDEX "Bookmark_learnerId_idx" ON "Bookmark"("learnerId");

-- CreateIndex
CREATE INDEX "Bookmark_surahId_ayahNumber_idx" ON "Bookmark"("surahId", "ayahNumber");

-- CreateIndex
CREATE INDEX "_VocabularyRules_B_index" ON "_VocabularyRules"("B");

-- AddForeignKey
ALTER TABLE "Learner" ADD CONSTRAINT "Learner_currentLessonId_fkey" FOREIGN KEY ("currentLessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerPreferences" ADD CONSTRAINT "LearnerPreferences_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ayah" ADD CONSTRAINT "Ayah_surahId_fkey" FOREIGN KEY ("surahId") REFERENCES "Surah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuranWord" ADD CONSTRAINT "QuranWord_ayahId_fkey" FOREIGN KEY ("ayahId") REFERENCES "Ayah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuallimPage" ADD CONSTRAINT "MuallimPage_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "MuallimBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "MuallimBook"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vocabulary" ADD CONSTRAINT "Vocabulary_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuranLink" ADD CONSTRAINT "QuranLink_vocabularyId_fkey" FOREIGN KEY ("vocabularyId") REFERENCES "Vocabulary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuranLink" ADD CONSTRAINT "QuranLink_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuranLink" ADD CONSTRAINT "QuranLink_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuranLink" ADD CONSTRAINT "QuranLink_ayahId_fkey" FOREIGN KEY ("ayahId") REFERENCES "Ayah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyProgress" ADD CONSTRAINT "VocabularyProgress_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyProgress" ADD CONSTRAINT "VocabularyProgress_vocabularyId_fkey" FOREIGN KEY ("vocabularyId") REFERENCES "Vocabulary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleProgress" ADD CONSTRAINT "RuleProgress_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleProgress" ADD CONSTRAINT "RuleProgress_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingSession" ADD CONSTRAINT "ReadingSession_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewQueueItem" ADD CONSTRAINT "ReviewQueueItem_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reflection" ADD CONSTRAINT "Reflection_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VocabularyRules" ADD CONSTRAINT "_VocabularyRules_A_fkey" FOREIGN KEY ("A") REFERENCES "Rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VocabularyRules" ADD CONSTRAINT "_VocabularyRules_B_fkey" FOREIGN KEY ("B") REFERENCES "Vocabulary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

