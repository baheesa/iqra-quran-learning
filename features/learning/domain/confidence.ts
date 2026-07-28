import { CONFIDENCE } from "@/features/learning/constants";

export function clampConfidence(value: number): number {
  return Math.max(CONFIDENCE.min, Math.min(CONFIDENCE.max, Math.round(value)));
}

export function applyConfidenceDelta(current: number, delta: number): number {
  return clampConfidence(current + delta);
}

/**
 * Soft decay for long gaps without review.
 * Applied when scheduling / scoring — does not mutate stored confidence
 * until an interaction occurs.
 */
export function gapDecayAmount(daysSinceLastReview: number): number {
  if (daysSinceLastReview <= 1) {
    return 0;
  }
  const decay = (daysSinceLastReview - 1) * CONFIDENCE.gapDecayPerDay;
  return Math.min(CONFIDENCE.maxGapDecay, decay);
}

export function effectiveConfidence(
  stored: number,
  daysSinceLastReview: number,
): number {
  return clampConfidence(stored - gapDecayAmount(daysSinceLastReview));
}
