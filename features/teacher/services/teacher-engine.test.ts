import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";

import { describe, expect, it } from "vitest";

import { createLearningEngine } from "@/features/learning/create-engine";
import { createMemoryLearningRepository } from "@/features/learning/repository/memory-repository";
import { createTeacherEngine } from "@/features/teacher/create-engine";
import { normalizeArabic } from "@/features/teacher/domain/arabic";
import { createStubTeacherLlmProvider } from "@/features/teacher/providers/llm-provider";
import { createMemoryConversationRepository } from "@/features/teacher/services/conversation-service";
import { createKnowledgeRetriever } from "@/features/teacher/services/knowledge-retriever";
import { createPromptService } from "@/features/teacher/services/prompt-service";

function testEngine(exportsDir?: string) {
  const learning = createLearningEngine({
    repo: createMemoryLearningRepository(),
    useMemory: true,
  });
  return createTeacherEngine({
    learning,
    conversationRepo: createMemoryConversationRepository(),
    useMemory: true,
    useStubLlm: true,
    exportsDir,
    llm: createStubTeacherLlmProvider(() => ""),
  });
}

describe("arabic normalize", () => {
  it("matches words ignoring diacritics", () => {
    expect(normalizeArabic("بِسْمِ")).toContain(normalizeArabic("بسم"));
  });
});

describe("knowledge retrieval", () => {
  it("uses curriculum seed when no approved exports", async () => {
    const emptyDir = mkdtempSync(path.join(tmpdir(), "teacher-exports-"));
    const retriever = createKnowledgeRetriever({ exportsDir: emptyDir });
    const result = await retriever.retrieve({ arabic: "بسم" });
    expect(result.hasApprovedMuallim).toBe(false);
    expect(result.vocabulary.length).toBeGreaterThan(0);
    expect(result.vocabulary[0]?.source).toBe("curriculum_seed");
  });

  it("prefers approved export vocabulary", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "teacher-exports-"));
    writeFileSync(
      path.join(dir, "unit-1.json"),
      JSON.stringify({
        bookSlug: "unit-1",
        exportedAt: new Date().toISOString(),
        lessons: [],
        vocabulary: [
          {
            id: "approved-1",
            bookId: "b1",
            bookSlug: "unit-1",
            pageNumber: 1,
            lesson: 1,
            sourceImage: null,
            confidence: 1,
            verificationStatus: "APPROVED",
            createdAt: new Date().toISOString(),
            version: "1",
            arabic: "بِسْمِ",
            urdu: "نام سے (معلم)",
            unit: 1,
            page: 1,
            verified: true,
          },
        ],
        rules: [],
        exercises: [],
      }),
      "utf8",
    );

    const retriever = createKnowledgeRetriever({ exportsDir: dir });
    const result = await retriever.retrieve({ arabic: "بسم" });
    expect(result.hasApprovedMuallim).toBe(true);
    expect(result.vocabulary[0]?.source).toBe("muallim_approved");
    expect(result.vocabulary[0]?.urduMeaning).toContain("معلم");
  });
});

describe("context building", () => {
  it("includes reading and learner slices", async () => {
    const engine = testEngine();
    engine.learning.learning.seeWord("vocab-bism");
    engine.learning.learning.recognizeWord("vocab-bism");

    const preview = await engine.teacher.previewContext({
      question: "بسم؟",
      reading: {
        page: 1,
        juz: 1,
        surahId: 1,
        ayahNumber: 1,
        selectedWord: {
          id: "1:1:1",
          arabic: "بِسْمِ",
          position: 1,
        },
        selectedPhrase: null,
      },
    });

    expect(preview.context.reading.page).toBe(1);
    expect(
      preview.context.learner.knownVocabulary.length,
    ).toBeGreaterThanOrEqual(0);
    expect(preview.context.builtAt).toBeTruthy();
  });
});

describe("prompt generation", () => {
  it("loads versioned prompts from PROMPTS.md", async () => {
    const prompts = createPromptService();
    const engine = testEngine();
    const preview = await engine.teacher.previewContext({
      question: "الحمد؟",
      intent: "WORD",
      reading: {
        page: 1,
        juz: 1,
        surahId: 1,
        ayahNumber: 2,
        selectedWord: { id: "1:2:1", arabic: "الْحَمْدُ", position: 1 },
        selectedPhrase: null,
      },
    });

    const built = await prompts.buildTeacherPrompt({
      intent: "WORD",
      question: "الحمد؟",
      context: preview.context,
      knowledge: preview.knowledge,
    });

    expect(built.promptVersion).toContain("prompt-2");
    expect(built.system.length).toBeGreaterThan(50);
    expect(built.user).toContain("الحمد");
  });
});

describe("teacher responses", () => {
  it("answers with recognition-first stub explanation", async () => {
    const engine = testEngine();
    const response = await engine.teacher.explainWord({
      question: "",
      reading: {
        page: 1,
        juz: 1,
        surahId: 1,
        ayahNumber: 1,
        selectedWord: { id: "1:1:1", arabic: "بِسْمِ", position: 1 },
        selectedPhrase: null,
      },
    });

    expect(response.answer).toContain("دیکھا");
    expect(response.encourageReading).toBe(true);
    expect(response.provider).toBe("stub-teacher");
    expect(response.vocabularyStatus?.arabic).toBeTruthy();
  });
});

describe("conversation storage", () => {
  it("stores learner and teacher messages with context", async () => {
    const engine = testEngine();
    const first = await engine.teacher.ask({
      question: "رب کا مطلب؟",
      reading: {
        page: 1,
        juz: 1,
        surahId: 1,
        ayahNumber: 2,
        selectedWord: { id: "1:2:3", arabic: "رَبِّ", position: 3 },
        selectedPhrase: null,
      },
    });

    const second = await engine.teacher.ask({
      question: "مزید اشارہ؟",
      conversationId: first.conversationId,
    });

    const conversation = engine.conversations.get(first.conversationId);
    expect(conversation?.messages.length).toBeGreaterThanOrEqual(4);
    expect(second.conversationId).toBe(first.conversationId);
    expect(conversation?.messages[0]?.role).toBe("LEARNER");
    expect(conversation?.messages[1]?.contextSnapshot).toBeTruthy();
  });
});
