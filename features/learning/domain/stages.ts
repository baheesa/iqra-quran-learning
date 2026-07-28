import { STAGE_LADDER } from "@/features/learning/constants";
import type { LearningStage } from "@/features/learning/types";

export function isLadderStage(
  stage: LearningStage,
): stage is (typeof STAGE_LADDER)[number] {
  return (STAGE_LADDER as readonly string[]).includes(stage);
}

/**
 * Advance exactly one stage on the ladder.
 * NEEDS_REVIEW re-enters at RECOGNIZING after a successful review.
 * Never skips stages.
 */
export function advanceStage(stage: LearningStage): LearningStage {
  if (stage === "NEEDS_REVIEW") {
    return "RECOGNIZING";
  }
  if (stage === "MASTERED") {
    return "MASTERED";
  }
  const index = STAGE_LADDER.indexOf(stage as (typeof STAGE_LADDER)[number]);
  if (index < 0 || index >= STAGE_LADDER.length - 1) {
    return stage;
  }
  return STAGE_LADDER[index + 1]!;
}

export function markNeedsReview(stage: LearningStage): LearningStage {
  if (stage === "UNKNOWN") {
    return "UNKNOWN";
  }
  return "NEEDS_REVIEW";
}

export function stageLabelUrdu(stage: LearningStage): string {
  switch (stage) {
    case "UNKNOWN":
      return "نامعلوم";
    case "SEEN":
      return "دیکھا گیا";
    case "RECOGNIZING":
      return "پہچان میں";
    case "UNDERSTOOD":
      return "سمجھا گیا";
    case "MASTERED":
      return "مہارت";
    case "NEEDS_REVIEW":
      return "نظرثانی درکار";
    default:
      return stage;
  }
}

export function stageLabelEn(stage: LearningStage): string {
  switch (stage) {
    case "UNKNOWN":
      return "Unknown";
    case "SEEN":
      return "Seen";
    case "RECOGNIZING":
      return "Recognizing";
    case "UNDERSTOOD":
      return "Understood";
    case "MASTERED":
      return "Mastered";
    case "NEEDS_REVIEW":
      return "Needs review";
    default:
      return stage;
  }
}
