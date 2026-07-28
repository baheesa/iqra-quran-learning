import {
  DAILY_STUDY_MINUTES_DEFAULT,
  DAILY_STUDY_MINUTES_MAX,
  DAILY_STUDY_MINUTES_MIN,
} from "@/lib/constants";

export const DEFAULT_LEARNER_ID = "local-learner";

export const LEARNING_STORAGE_DIR = "data/learner";

export const SESSION_PHASES = [
  "REVIEW",
  "READING",
  "RECOGNIZE",
  "NEW_WORDS",
  "REFLECTION",
  "FINISHED",
] as const;

/** Forward stage ladder — NEEDS_REVIEW is a side state. */
export const STAGE_LADDER = [
  "UNKNOWN",
  "SEEN",
  "RECOGNIZING",
  "UNDERSTOOD",
  "MASTERED",
] as const;

export const CONFIDENCE = {
  min: 0,
  max: 100,
  seen: 5,
  recognized: 10,
  reviewSuccess: 15,
  reviewFail: -15,
  forgot: -25,
  gapDecayPerDay: 2,
  maxGapDecay: 30,
} as const;

export const REVIEW = {
  maxQueue: 10,
  maxNewWordsPerSession: 5,
  lessonImportanceBoost: 8,
} as const;

export const SESSION = {
  minMinutes: DAILY_STUDY_MINUTES_MIN,
  maxMinutes: DAILY_STUDY_MINUTES_MAX,
  defaultMinutes: DAILY_STUDY_MINUTES_DEFAULT,
  phaseMinutes: {
    REVIEW: 5,
    READING: 6,
    RECOGNIZE: 3,
    NEW_WORDS: 4,
    REFLECTION: 2,
  },
} as const;
