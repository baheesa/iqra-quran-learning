import { effectiveConfidence } from "@/features/learning/domain/confidence";
import type { LearningStage } from "@/features/learning/types";

/** Interval days from confidence band (spaced repetition). */
export function intervalDaysForConfidence(confidence: number): number {
  if (confidence <= 20) return 1;
  if (confidence <= 40) return 2;
  if (confidence <= 60) return 4;
  if (confidence <= 80) return 7;
  if (confidence <= 90) return 14;
  return 30;
}

export function nextReviewAt(
  confidence: number,
  from: Date = new Date(),
): string {
  const days = intervalDaysForConfidence(confidence);
  const next = new Date(from);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString();
}

export function daysBetween(
  fromIso: string | null,
  to: Date = new Date(),
): number {
  if (!fromIso) {
    return 999;
  }
  const from = new Date(fromIso).getTime();
  const diff = to.getTime() - from;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Higher score = sooner review.
 * Uses confidence, days since review, mistakes, frequency, lesson importance.
 */
export function reviewPriorityScore(input: {
  confidence: number;
  lastReviewedAt: string | null;
  timesForgotten: number;
  frequency: number;
  lessonImportance: number;
  stage: LearningStage;
  now?: Date;
}): number {
  const now = input.now ?? new Date();
  const days = daysBetween(input.lastReviewedAt, now);
  const confidence = effectiveConfidence(input.confidence, days);

  let score =
    (100 - confidence) * 2 +
    days * 3 +
    input.timesForgotten * 5 +
    Math.min(20, input.frequency) +
    input.lessonImportance;

  if (input.stage === "NEEDS_REVIEW") {
    score += 40;
  }
  if (input.stage === "UNKNOWN") {
    score -= 50;
  }

  return Math.round(score);
}
