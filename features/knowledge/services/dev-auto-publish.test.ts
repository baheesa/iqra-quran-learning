import { mkdtemp, mkdir, writeFile, rm, readFile } from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createKnowledgeEngine } from "@/features/knowledge/create-engine";
import {
  DEV_AUTO_APPROVE_REASON,
  DEV_AUTO_APPROVER,
} from "@/features/knowledge/providers/auto-approve-enabled";
import { createStubExtractionProvider } from "@/features/knowledge/providers/stub-extraction-provider";
import { createFileKnowledgeRepository } from "@/features/knowledge/repository/file-repository";
import {
  clearVocabularyIndexCache,
  lookupVerifiedWord,
} from "@/features/knowledge/services/vocabulary-index";
import { normalizeArabic } from "@/features/teacher/domain/arabic";

describe("development auto-approval pipeline", () => {
  let tempRoot: string;
  const previousFlag = process.env.KNOWLEDGE_AUTO_APPROVE;

  beforeEach(async () => {
    clearVocabularyIndexCache();
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "knowledge-auto-"));
    await mkdir(path.join(tempRoot, "original"), { recursive: true });
    await writeFile(
      path.join(tempRoot, "original", "Unit 1.txt"),
      "===== PAGE 1 =====\nيَرْجُونَ امید\n",
      "utf8",
    );
  });

  afterEach(async () => {
    clearVocabularyIndexCache();
    if (previousFlag === undefined) {
      delete process.env.KNOWLEDGE_AUTO_APPROVE;
    } else {
      process.env.KNOWLEDGE_AUTO_APPROVE = previousFlag;
    }
    await rm(tempRoot, { recursive: true, force: true });
  });

  it("auto-approves, publishes, and rebuilds index when enabled", async () => {
    process.env.KNOWLEDGE_AUTO_APPROVE = "1";

    const repo = createFileKnowledgeRepository(tempRoot);
    const engine = createKnowledgeEngine({
      repo,
      useStubPdf: true,
      useStubAi: true,
      extraction: {
        name: "test-extract",
        async extract() {
          return {
            provider: "test-extract",
            lessons: [
              {
                title: "Unit 1",
                lessonNumber: 1,
                unit: 1,
                objectives: [],
                confidence: 0.9,
              },
            ],
            vocabulary: [
              {
                arabic: "يَرْجُونَ",
                urdu: "امید رکھتے ہیں",
                unit: 1,
                lesson: 1,
                confidence: 0.9,
              },
            ],
            rules: [
              {
                title: "جمع مذکر",
                explanation: "جمع مذکر غائب",
                examples: ["يَرْجُونَ"],
                unit: 1,
                lesson: 1,
                confidence: 0.9,
              },
            ],
            exercises: [],
            examples: [],
            reviewQuestions: [],
            headings: [],
            tables: [],
          };
        },
      },
    });

    await engine.import.importOne("Unit 1.txt");

    const extraction = await repo.getExtraction("unit-1", 1);
    expect(extraction?.verificationStatus).toBe("APPROVED");

    const verifications = await engine.verification.list("unit-1");
    const pageRecord = verifications.find((item) => item.objectType === "PAGE");
    expect(pageRecord?.approvedBy).toBe(DEV_AUTO_APPROVER);
    expect(pageRecord?.approvalReason).toBe(DEV_AUTO_APPROVE_REASON);
    expect(pageRecord?.approvedAt).toBeTruthy();
    expect(pageRecord?.note).toBe(DEV_AUTO_APPROVE_REASON);

    const indexRaw = await readFile(
      path.join(tempRoot, "exports", "vocabulary-index.json"),
      "utf8",
    );
    const index = JSON.parse(indexRaw) as {
      entries: Record<string, { meaning: string }>;
    };
    expect(index.entries[normalizeArabic("يرجون")]?.meaning).toBe(
      "امید رکھتے ہیں",
    );

    const lookup = await lookupVerifiedWord("يرجون", repo.dirs.exports);
    expect(lookup.found).toBe(true);
    expect(lookup.meaning).toBe("امید رکھتے ہیں");
  });

  it("does not auto-approve when disabled (production-safe default in test)", async () => {
    delete process.env.KNOWLEDGE_AUTO_APPROVE;

    const repo = createFileKnowledgeRepository(tempRoot);
    const engine = createKnowledgeEngine({
      repo,
      useStubPdf: true,
      useStubAi: true,
      extraction: createStubExtractionProvider(),
    });

    await engine.import.importOne("Unit 1.txt");
    await engine.extraction.extractBook("unit-1");

    const extraction = await repo.getExtraction("unit-1", 1);
    expect(extraction?.verificationStatus).toBe("PENDING");

    const exportBundle = await repo.getExportBundle("unit-1");
    expect(exportBundle).toBeNull();
  });

  it("ignores the flag when NODE_ENV is production", async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    // @ts-expect-error test override
    process.env.NODE_ENV = "production";
    process.env.KNOWLEDGE_AUTO_APPROVE = "1";

    try {
      const repo = createFileKnowledgeRepository(tempRoot);
      const engine = createKnowledgeEngine({
        repo,
        useStubPdf: true,
        useStubAi: true,
        extraction: createStubExtractionProvider(),
      });

      expect(engine.providers.knowledgeAutoApprove).toBe(false);

      await engine.import.importOne("Unit 1.txt");
      // Import must NOT auto-extract/approve in production
      const extraction = await repo.getExtraction("unit-1", 1);
      expect(extraction).toBeNull();

      await engine.extraction.extractBook("unit-1");
      const afterExtract = await repo.getExtraction("unit-1", 1);
      expect(afterExtract?.verificationStatus).toBe("PENDING");
    } finally {
      // @ts-expect-error test override
      process.env.NODE_ENV = previousNodeEnv;
    }
  });
});
