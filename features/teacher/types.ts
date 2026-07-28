import type { AdaptationHints } from "@/features/personalization/types";

export type TeacherIntent =
  "ASK" | "WORD" | "PHRASE" | "LESSON" | "RULE" | "REVIEW_SUGGESTION";

export type TeacherMessageRole = "LEARNER" | "TEACHER" | "SYSTEM";

export type KnowledgeSourceKind =
  "muallim_approved" | "curriculum_seed" | "general";

export type KnowledgeReference = {
  kind: KnowledgeSourceKind;
  objectType: "vocabulary" | "rule" | "lesson" | "exercise" | "example";
  id: string;
  label: string;
  detail?: string;
};

export type TeacherReadingContext = {
  page: number | null;
  juz: number | null;
  surahId: number | null;
  ayahNumber: number | null;
  selectedWord: {
    id: string;
    arabic: string;
    position: number;
  } | null;
  selectedPhrase: string | null;
};

export type TeacherLearnerSlice = {
  currentLessonId: string | null;
  currentLessonTitle: string | null;
  learningStageSummary: string;
  knownVocabulary: Array<{
    id: string;
    arabic: string;
    confidence: number;
    stage: string;
  }>;
  unknownVocabulary: Array<{ id: string; arabic: string }>;
  weakVocabulary: Array<{ id: string; arabic: string; confidence: number }>;
  recentReviews: Array<{
    vocabularyId: string;
    arabic: string;
    status: string;
  }>;
  recentReflections: Array<{
    understoodToday: string | null;
    createdAt: string;
  }>;
};

export type TeacherContext = {
  reading: TeacherReadingContext;
  learner: TeacherLearnerSlice;
  relatedLesson: {
    id: string;
    title: string;
    unit: number;
    lessonNumber: number;
  } | null;
  relatedRule: {
    id: string;
    title: string;
    lessonId: string;
  } | null;
  knowledgeRefs: KnowledgeReference[];
  /** Personalization adaptation hints (Milestone 6). */
  adaptation: AdaptationHints | null;
  builtAt: string;
};

export type TeacherAskInput = {
  question: string;
  intent?: TeacherIntent;
  conversationId?: string | null;
  reading?: Partial<TeacherReadingContext>;
  lessonId?: string | null;
  ruleId?: string | null;
};

export type TeacherResponse = {
  conversationId: string;
  messageId: string;
  answer: string;
  intent: TeacherIntent;
  promptVersion: string;
  provider: string;
  context: TeacherContext;
  knowledgeRefs: KnowledgeReference[];
  relatedLesson: TeacherContext["relatedLesson"];
  relatedRule: TeacherContext["relatedRule"];
  vocabularyStatus: {
    id: string;
    arabic: string;
    stage: string;
    confidence: number;
  } | null;
  suggestions: string[];
  encourageReading: boolean;
  usedMuallimKnowledge: boolean;
};

export type ConversationMessageRecord = {
  id: string;
  conversationId: string;
  role: TeacherMessageRole;
  intent: TeacherIntent;
  content: string;
  contextSnapshot: TeacherContext | null;
  knowledgeRefs: KnowledgeReference[];
  promptVersion: string | null;
  provider: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ConversationRecord = {
  id: string;
  learnerId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages: ConversationMessageRecord[];
};

export type FeedbackRecord = {
  id: string;
  messageId: string;
  helpful: boolean | null;
  note: string | null;
  createdAt: string;
};
