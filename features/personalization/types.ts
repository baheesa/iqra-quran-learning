export type ExplanationStyle = "brief" | "guided" | "detailed";

export type ConfidenceTrend = "rising" | "stable" | "falling";

export type RecommendationKind =
  | "continue_reading"
  | "review_weak_words"
  | "revise_rule"
  | "practice_review_queue"
  | "read_more_pages"
  | "repeat_lesson";

export type VocabInsightItem = {
  id: string;
  arabic: string;
  urduMeaning: string;
  confidence: number;
  stage: string;
  timesForgotten: number;
};

export type RuleInsightItem = {
  id: string;
  title: string;
  lessonId: string;
  confidence: number;
  stage: string;
  mistakes: number;
};

export type LearnerProfileView = {
  learnerId: string;
  currentUnit: number;
  currentLessonId: string | null;
  currentLessonTitle: string | null;
  currentJuz: number;
  currentPage: number;
  readingSpeedPagesPerSession: number;
  dailyStudyStreak: number;
  averageSessionMinutes: number;
  knownVocabulary: VocabInsightItem[];
  weakVocabulary: VocabInsightItem[];
  strongVocabulary: VocabInsightItem[];
  rulesMastered: RuleInsightItem[];
  rulesNeedingReview: RuleInsightItem[];
  averageConfidence: number;
  confidenceTrend: ConfidenceTrend;
  preferredExplanationStyle: ExplanationStyle;
  reviewDueCount: number;
  updatedAt: string;
};

export type Recommendation = {
  id: string;
  kind: RecommendationKind;
  titleUrdu: string;
  reasonUrdu: string;
  priority: number;
  href: string;
  payload?: Record<string, string | number | null>;
};

export type LearnerInsights = {
  mostImprovedVocabulary: VocabInsightItem[];
  mostDifficultVocabulary: VocabInsightItem[];
  averageConfidence: number;
  reviewCompletionRate: number;
  weeklySummary: {
    sessionsCompleted: number;
    minutesStudied: number;
    wordsTouched: number;
    reviewsDue: number;
  };
  monthlyProgress: {
    knownWordsDelta: number;
    masteredRules: number;
    streakPeak: number;
  };
  readingConsistency: {
    streak: number;
    daysActiveLast7: number;
    pagesPerSession: number;
  };
  confidenceTrend: ConfidenceTrend;
};

export type StudyPlanItem = {
  order: number;
  kind: RecommendationKind | "reflection";
  titleUrdu: string;
  estimatedMinutes: number;
  href: string;
};

export type StudyPlan = {
  targetMinutes: number;
  items: StudyPlanItem[];
  generatedAt: string;
};

export type AdaptationHints = {
  explanationStyle: ExplanationStyle;
  explanationDepth: "brief" | "guided" | "detailed";
  emphasizeRecognition: boolean;
  reinforceWords: string[];
  mentionWeakWords: string[];
  currentLessonTitle: string | null;
  confidenceTrend: ConfidenceTrend;
  avoidOverwhelm: boolean;
  guidanceUrdu: string;
};

export type PersonalizationPreferences = {
  preferredExplanationStyle: ExplanationStyle;
  updatedAt: string;
};
