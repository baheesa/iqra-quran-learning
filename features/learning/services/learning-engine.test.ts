import { describe, expect, it } from "vitest";

import { createLearningEngine } from "@/features/learning/create-engine";
import { createMemoryLearningRepository } from "@/features/learning/repository/memory-repository";
import {
  clampConfidence,
  effectiveConfidence,
} from "@/features/learning/domain/confidence";
import { advanceStage } from "@/features/learning/domain/stages";
import {
  intervalDaysForConfidence,
  reviewPriorityScore,
} from "@/features/learning/domain/spaced-repetition";

function engine() {
  return createLearningEngine({
    repo: createMemoryLearningRepository(),
    useMemory: true,
  });
}

describe("vocabulary progression", () => {
  it("never skips stages on recognition", () => {
    const { learning, vocabulary } = engine();
    const id = "vocab-bism";

    expect(learning.seeWord(id).stage).toBe("SEEN");
    expect(learning.recognizeWord(id).stage).toBe("RECOGNIZING");
    expect(learning.recognizeWord(id).stage).toBe("UNDERSTOOD");
    expect(learning.recognizeWord(id).stage).toBe("MASTERED");
    expect(learning.recognizeWord(id).stage).toBe("MASTERED");

    const progress = vocabulary.get(id);
    expect(progress?.confidence).toBeGreaterThan(0);
  });

  it("moves to NEEDS_REVIEW on forgot without skipping back later", () => {
    const { learning, vocabulary } = engine();
    const id = "vocab-allah";
    learning.seeWord(id);
    learning.recognizeWord(id);
    learning.forgotWord(id);
    expect(vocabulary.get(id)?.stage).toBe("NEEDS_REVIEW");
    expect(learning.completeReview(id, true).stage).toBe("RECOGNIZING");
  });
});

describe("confidence calculation", () => {
  it("clamps and applies gap decay", () => {
    expect(clampConfidence(150)).toBe(100);
    expect(clampConfidence(-5)).toBe(0);
    expect(effectiveConfidence(50, 10)).toBeLessThan(50);
  });

  it("increases on success and decreases on fail", () => {
    const { learning, vocabulary } = engine();
    const id = "vocab-rahman";
    learning.seeWord(id);
    const afterOk = learning.completeReview(id, true);
    const mid = afterOk.confidence;
    const afterFail = learning.completeReview(id, false);
    expect(afterFail.confidence).toBeLessThan(mid);
    expect(vocabulary.get(id)?.timesForgotten).toBeGreaterThan(0);
  });
});

describe("lesson completion", () => {
  it("computes vocabulary and rule mastery", () => {
    const { learning, lessons, rules } = engine();
    const lessonId = "lesson-v1-u1-l1";
    lessons.setCurrentLesson(lessonId);

    learning.seeWord("vocab-bism");
    learning.recognizeWord("vocab-bism");
    learning.recognizeWord("vocab-bism");
    learning.recognizeWord("vocab-allah");
    learning.recognizeWord("vocab-allah");
    learning.recognizeWord("vocab-allah");
    rules.recordUnderstanding("rule-v1-u1-l1-1", { success: true });
    rules.recordUnderstanding("rule-v1-u1-l1-1", { success: true });
    rules.recordUnderstanding("rule-v1-u1-l1-1", { success: true });
    lessons.markReadingComplete(lessonId);

    const progress = lessons.recompute(lessonId);
    expect(progress.vocabularyMastery).toBeGreaterThan(0);
    expect(progress.ruleMastery).toBeGreaterThan(0);
    expect(progress.readingComplete).toBe(true);
    expect(progress.completionPercent).toBeGreaterThan(0);
  });
});

describe("review scheduling", () => {
  it("prioritizes low confidence and forgotten words", () => {
    const low = reviewPriorityScore({
      confidence: 10,
      lastReviewedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      timesForgotten: 3,
      frequency: 50,
      lessonImportance: 8,
      stage: "NEEDS_REVIEW",
    });
    const high = reviewPriorityScore({
      confidence: 90,
      lastReviewedAt: new Date().toISOString(),
      timesForgotten: 0,
      frequency: 5,
      lessonImportance: 0,
      stage: "MASTERED",
    });
    expect(low).toBeGreaterThan(high);
    expect(intervalDaysForConfidence(85)).toBeGreaterThan(
      intervalDaysForConfidence(15),
    );
  });

  it("builds a non-random due queue", () => {
    const { learning, review } = engine();
    learning.seeWord("vocab-bism");
    learning.forgotWord("vocab-allah");
    learning.seeWord("vocab-allah");

    const queue = review.buildQueue();
    expect(queue.length).toBeGreaterThan(0);
    expect(queue[0]?.priority).toBeGreaterThanOrEqual(
      queue[queue.length - 1]?.priority ?? 0,
    );
  });
});

describe("dashboard calculations", () => {
  it("summarizes known words and review due", () => {
    const { learning, analytics, lessons } = engine();
    lessons.setCurrentLesson("lesson-v1-u1-l1");
    learning.seeWord("vocab-bism");
    learning.recognizeWord("vocab-bism");
    learning.recognizeWord("vocab-bism");
    learning.recognizeWord("vocab-bism");

    const dashboard = analytics.getDashboard();
    expect(dashboard.knownWords).toBeGreaterThanOrEqual(1);
    expect(dashboard.currentLesson?.id).toBe("lesson-v1-u1-l1");
    expect(dashboard.recentlyLearned.length).toBeGreaterThan(0);
  });
});

describe("daily sessions", () => {
  it("follows review → … → finish flow with remaining time", () => {
    const { sessions, learning } = engine();
    learning.seeWord("vocab-bism");

    const started = sessions.start({ targetMinutes: 20 });
    expect(started.phase).toBe("REVIEW");
    expect(started.estimatedRemainingMinutes).not.toBeNull();

    expect(sessions.advancePhase().phase).toBe("READING");
    expect(sessions.advancePhase().phase).toBe("RECOGNIZE");
    expect(sessions.advancePhase().phase).toBe("NEW_WORDS");
    expect(sessions.advancePhase().phase).toBe("REFLECTION");
    const finished = sessions.advancePhase();
    expect(finished.phase).toBe("FINISHED");
    expect(finished.status).toBe("COMPLETED");
    expect(sessions.getActive()).toBeNull();
  });
});

describe("reflection storage", () => {
  it("stores structured reflection answers", () => {
    const { reflections, sessions } = engine();
    const session = sessions.start();
    const saved = reflections.create({
      sessionId: session.id,
      understoodToday: "الحمد",
      difficultWords: ["العٰلمین"],
      reviewTomorrow: "رب",
    });

    expect(saved.understoodToday).toBe("الحمد");
    expect(saved.difficultWords).toContain("العٰلمین");
    expect(saved.reviewTomorrow).toBe("رب");
    expect(reflections.list()[0]?.id).toBe(saved.id);

    sessions.attachReflection(saved.id, session.id);
    expect(sessions.list()[0]?.reflectionId).toBe(saved.id);
  });
});

describe("stage helpers", () => {
  it("advances one step only", () => {
    expect(advanceStage("UNKNOWN")).toBe("SEEN");
    expect(advanceStage("SEEN")).toBe("RECOGNIZING");
    expect(advanceStage("NEEDS_REVIEW")).toBe("RECOGNIZING");
    expect(advanceStage("MASTERED")).toBe("MASTERED");
  });
});
