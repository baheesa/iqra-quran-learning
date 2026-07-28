export type LearningStage =
  | "UNKNOWN"
  | "SEEN"
  | "RECOGNIZING"
  | "UNDERSTOOD"
  | "MASTERED"
  | "NEEDS_REVIEW";

export type LearningSessionPhase =
  "REVIEW" | "READING" | "RECOGNIZE" | "NEW_WORDS" | "REFLECTION" | "FINISHED";

export type LearningSessionStatus =
  "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

export type ReviewItemStatus = "PENDING" | "DUE" | "COMPLETED" | "SKIPPED";

export type CurriculumLesson = {
  id: string;
  volume: number;
  unit: number;
  lessonNumber: number;
  title: string;
  objectives: string[];
  pageStart?: number | null;
  pageEnd?: number | null;
};

export type CurriculumVocabulary = {
  id: string;
  lessonId: string;
  arabic: string;
  urduMeaning: string;
  root?: string | null;
  frequency: number;
  occurrenceCount: number;
  sourcePage?: number | null;
};

export type CurriculumRule = {
  id: string;
  lessonId: string;
  title: string;
  explanation: string;
  examples: string[];
  sourcePage?: number | null;
};

export type CurriculumSeed = {
  version: string;
  lessons: CurriculumLesson[];
  vocabulary: CurriculumVocabulary[];
  rules: CurriculumRule[];
};

export type VocabularyProgressRecord = {
  id: string;
  learnerId: string;
  vocabularyId: string;
  stage: LearningStage;
  confidence: number;
  timesSeen: number;
  timesRecognized: number;
  timesForgotten: number;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RuleRevisionEntry = {
  at: string;
  confidence: number;
  note?: string;
};

export type RuleProgressRecord = {
  id: string;
  learnerId: string;
  ruleId: string;
  stage: LearningStage;
  confidence: number;
  attempts: number;
  mistakes: number;
  revisionCount: number;
  revisionHistory: RuleRevisionEntry[];
  understandingNote: string | null;
  lastReviewed: string | null;
  nextReviewAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LessonProgressRecord = {
  id: string;
  learnerId: string;
  lessonId: string;
  startedAt: string | null;
  completedAt: string | null;
  completionPercent: number;
  vocabularyMastery: number;
  ruleMastery: number;
  readingComplete: boolean;
  reviewStatus: ReviewItemStatus;
  confidence: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReviewQueueRecord = {
  id: string;
  learnerId: string;
  objectType: "VOCABULARY" | "RULE";
  objectId: string;
  priority: number;
  dueAt: string;
  status: ReviewItemStatus;
  createdAt: string;
  updatedAt: string;
};

export type ReflectionRecord = {
  id: string;
  learnerId: string;
  lessonId: string | null;
  sessionId: string | null;
  content: string;
  understoodToday: string | null;
  difficultWords: string[];
  reviewTomorrow: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LearningSessionRecord = {
  id: string;
  learnerId: string;
  status: LearningSessionStatus;
  phase: LearningSessionPhase;
  targetMinutes: number;
  elapsedSeconds: number;
  estimatedRemainingMinutes: number | null;
  startedAt: string | null;
  endedAt: string | null;
  reviewWordIds: string[];
  newWordIds: string[];
  reflectionId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LearnerProfile = {
  id: string;
  displayName: string;
  currentLessonId: string | null;
  currentJuz: number;
  currentPage: number;
  dailyGoalMinutes: number;
  readingStreak: number;
  lastStudyDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LearnerState = {
  profile: LearnerProfile;
  vocabularyProgress: VocabularyProgressRecord[];
  ruleProgress: RuleProgressRecord[];
  lessonProgress: LessonProgressRecord[];
  reviewQueue: ReviewQueueRecord[];
  reflections: ReflectionRecord[];
  sessions: LearningSessionRecord[];
  activeSessionId: string | null;
};

export type DashboardSummary = {
  knownWords: number;
  wordsInProgress: number;
  rulesMastered: number;
  currentLesson: CurriculumLesson | null;
  readingStreak: number;
  currentJuz: number;
  currentPage: number;
  todayLearningMinutes: number;
  reviewDue: number;
  recentlyLearned: Array<{
    id: string;
    arabic: string;
    urduMeaning: string;
    stage: LearningStage;
  }>;
  weakestVocabulary: Array<{
    id: string;
    arabic: string;
    urduMeaning: string;
    confidence: number;
    stage: LearningStage;
  }>;
  session: LearningSessionRecord | null;
};

export type VocabularyEvent =
  "seen" | "recognized" | "forgot" | "review_success" | "review_fail";
