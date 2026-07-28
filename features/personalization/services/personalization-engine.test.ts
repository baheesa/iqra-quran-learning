import { describe, expect, it } from "vitest";

import { createLearningEngine } from "@/features/learning/create-engine";
import { createMemoryLearningRepository } from "@/features/learning/repository/memory-repository";
import { createPersonalizationEngine } from "@/features/personalization/create-engine";
import { createMemoryPrefsStore } from "@/features/personalization/repository/prefs-store";
import { createTeacherEngine } from "@/features/teacher/create-engine";
import { createStubTeacherLlmProvider } from "@/features/teacher/providers/llm-provider";
import { createMemoryConversationRepository } from "@/features/teacher/services/conversation-service";

function setup() {
  const learning = createLearningEngine({
    repo: createMemoryLearningRepository(),
    useMemory: true,
  });
  const personalization = createPersonalizationEngine({
    learning,
    prefs: createMemoryPrefsStore(),
    useMemory: true,
  });
  return { learning, personalization };
}

describe("recommendation generation", () => {
  it("returns grounded non-random recommendations", () => {
    const { learning, personalization } = setup();
    learning.learning.seeWord("vocab-bism");
    learning.learning.forgotWord("vocab-allah");

    const recs = personalization.recommendations.getRecommendations();
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0]?.kind).toBe("continue_reading");
    expect(recs.some((item) => item.kind === "continue_reading")).toBe(true);
    expect(recs.every((item) => item.href.length > 0)).toBe(true);
  });
});

describe("weakness analysis", () => {
  it("surfaces forgotten and low-confidence words", () => {
    const { learning, personalization } = setup();
    learning.learning.seeWord("vocab-rahman");
    learning.learning.forgotWord("vocab-rahman");

    const weak = personalization.weakness.analyzeVocabulary();
    expect(weak.some((item) => item.id === "vocab-rahman")).toBe(true);
  });
});

describe("insight calculations", () => {
  it("computes weekly and confidence insights", () => {
    const { learning, personalization } = setup();
    learning.learning.seeWord("vocab-bism");
    learning.learning.recognizeWord("vocab-bism");
    learning.learning.recognizeWord("vocab-bism");
    learning.sessions.start();
    learning.sessions.advancePhase();
    learning.sessions.advancePhase();
    learning.sessions.advancePhase();
    learning.sessions.advancePhase();
    learning.sessions.advancePhase();

    const insights = personalization.insights.getInsights();
    expect(insights.averageConfidence).toBeGreaterThanOrEqual(0);
    expect(insights.weeklySummary.sessionsCompleted).toBeGreaterThanOrEqual(1);
    expect(insights.readingConsistency.streak).toBeGreaterThanOrEqual(1);
  });
});

describe("study planning", () => {
  it("fits items within daily target minutes", () => {
    const { personalization } = setup();
    const plan = personalization.studyPlan.buildPlan({ targetMinutes: 15 });
    const total = plan.items.reduce(
      (sum, item) => sum + item.estimatedMinutes,
      0,
    );
    expect(plan.targetMinutes).toBe(15);
    expect(total).toBeLessThanOrEqual(17);
    expect(plan.items.length).toBeGreaterThan(0);
  });
});

describe("adaptive responses", () => {
  it("adapts teacher stub answers using personalization hints", async () => {
    const { learning, personalization } = setup();
    personalization.profile.setExplanationStyle("brief");
    learning.learning.seeWord("vocab-alhamd");
    learning.learning.recognizeWord("vocab-alhamd");
    learning.learning.recognizeWord("vocab-alhamd");
    learning.learning.forgotWord("vocab-rabb");

    const teacherEngine = createTeacherEngine({
      learning,
      conversationRepo: createMemoryConversationRepository(),
      useMemory: true,
      useStubLlm: true,
      adaptation: personalization.adaptation,
      llm: createStubTeacherLlmProvider(() => ""),
    });

    const response = await teacherEngine.teacher.explainWord({
      question: "",
      reading: {
        page: 1,
        juz: 1,
        surahId: 1,
        ayahNumber: 2,
        selectedWord: { id: "1:2:1", arabic: "الْحَمْدُ", position: 1 },
        selectedPhrase: null,
      },
    });

    expect(response.context.adaptation).not.toBeNull();
    expect(response.context.adaptation?.explanationStyle).toBe("brief");
    expect(response.answer).toContain("دیکھا");
  });
});
