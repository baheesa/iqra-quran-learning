import { mkdtemp, mkdir, writeFile, rm, readFile } from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createKnowledgeEngine } from "@/features/knowledge/create-engine";
import {
  parseUnitNumber,
  slugifyBookFileName,
} from "@/features/knowledge/providers/book-discovery";
import { createStubExtractionProvider } from "@/features/knowledge/providers/stub-extraction-provider";
import { createFileKnowledgeRepository } from "@/features/knowledge/repository/file-repository";
import { parseTxtIntoSections } from "@/features/knowledge/services/txt-parser";
import { TXT_SOURCE_PROVIDER } from "@/features/knowledge/services/txt-ingest-service";

describe("book discovery helpers", () => {
  it("parses unit numbers and slugs for TXT", () => {
    expect(parseUnitNumber("Unit 3.txt")).toBe(3);
    expect(slugifyBookFileName("Unit 1.txt")).toBe("unit-1");
    expect(slugifyBookFileName("Unit 1.pdf")).toBe("unit-1");
  });
});

describe("txt parser", () => {
  it("keeps a single section when no page markers exist", () => {
    const parsed = parseTxtIntoSections("بسم الله\n\nسبق ۱");
    expect(parsed.hasPageMarkers).toBe(false);
    expect(parsed.sections).toHaveLength(1);
    expect(parsed.sections[0]?.text).toContain("بسم الله");
  });

  it("splits on PAGE markers without inventing numbers", () => {
    const raw = `===== PAGE 1 =====\nAlpha\n===== PAGE 2 =====\nBeta`;
    const parsed = parseTxtIntoSections(raw);
    expect(parsed.hasPageMarkers).toBe(true);
    expect(parsed.sections).toHaveLength(2);
    expect(parsed.sections[0]?.sourcePageLabel).toBe("1");
    expect(parsed.sections[0]?.text).toBe("Alpha");
    expect(parsed.sections[1]?.text).toBe("Beta");
  });

  it("splits on صفحہ markers", () => {
    const raw = `==================================================\nصفحہ 53 | یونٹ 2 سبق 1\n==================================================\nمتن اول\n==================================================\nصفحہ 54 | یونٹ 2\n==================================================\nمتن دوم`;
    const parsed = parseTxtIntoSections(raw);
    expect(parsed.sections).toHaveLength(2);
    expect(parsed.sections[0]?.sourcePageLabel).toBe("53");
    expect(parsed.sections[0]?.text).toContain("متن اول");
  });
});

describe("knowledge pipeline services (TXT primary)", () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "knowledge-"));
    await mkdir(path.join(tempRoot, "original"), { recursive: true });

    await writeFile(
      path.join(tempRoot, "original", "Unit 1.txt"),
      "===== PAGE 1 =====\nرَبِّ العالمين\n===== PAGE 2 =====\nالحمد لله\n",
      "utf8",
    );
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  it("runs import TXT → extract → verify → export without OCR", async () => {
    const repo = createFileKnowledgeRepository(tempRoot);
    const engine = createKnowledgeEngine({
      repo,
      useStubPdf: true,
      useStubAi: true,
      extraction: createStubExtractionProvider(),
    });

    const imported = await engine.import.importOne("Unit 1.txt");
    expect(imported.slug).toBe("unit-1");
    expect(imported.sourceKind).toBe("txt");
    expect(imported.sectionCount).toBe(2);

    const source = await repo.getOcrResult("unit-1", 1);
    expect(source?.provider).toBe(TXT_SOURCE_PROVIDER);
    expect(source?.rawText).toContain("رَبِّ");

    const extracted = await engine.extraction.extractBook("unit-1");
    expect(extracted[0]?.id).toContain("extraction");
    expect(extracted[0]?.verificationStatus).toBe("PENDING");

    await repo.saveExtraction({
      ...extracted[0]!,
      vocabulary: [
        {
          id: "v1",
          bookId: imported.id,
          bookSlug: "unit-1",
          pageNumber: 1,
          lesson: 1,
          sourceImage: null,
          confidence: 0.9,
          verificationStatus: "PENDING",
          createdAt: new Date().toISOString(),
          version: "1",
          arabic: "رَبِّ",
          urdu: "رب",
          unit: 1,
          page: 1,
          verified: false,
        },
      ],
    });

    await engine.verification.approvePage("unit-1", 1);
    const bundle = await engine.exporter.exportApproved("unit-1");
    expect(bundle.vocabulary[0]?.arabic).toBe("رَبِّ");

    const indexRaw = await readFile(
      path.join(tempRoot, "exports", "vocabulary-index.json"),
      "utf8",
    );
    const index = JSON.parse(indexRaw) as {
      entries: Record<string, { meaning: string }>;
    };
    const { normalizeArabic } = await import(
      "@/features/teacher/domain/arabic"
    );
    const key = normalizeArabic("رَبِّ");
    expect(index.entries[key]?.meaning).toBe("رب");
  });

  it("supports reject and blocks invalid transitions", async () => {
    const repo = createFileKnowledgeRepository(tempRoot);
    const engine = createKnowledgeEngine({
      repo,
      useStubPdf: true,
      useStubAi: true,
    });

    await engine.import.importOne("Unit 1.txt");
    await engine.extraction.extractPage("unit-1", 1);

    await engine.verification.rejectPage("unit-1", 1, "bad extraction");
    const extraction = await repo.getExtraction("unit-1", 1);
    expect(extraction?.verificationStatus).toBe("REJECTED");

    await expect(engine.verification.rejectPage("unit-1", 1)).rejects.toThrow(
      /Cannot transition/,
    );
  });

  it("does not call Vision OCR during reprocess when OCR is disabled", async () => {
    const repo = createFileKnowledgeRepository(tempRoot);
    const engine = createKnowledgeEngine({
      repo,
      useStubPdf: true,
      useStubAi: true,
    });
    expect(engine.providers.ocrEnabled).toBe(false);

    await engine.import.importOne("Unit 1.txt");
    const result = await engine.importer.reprocessPage("unit-1", 1);
    expect(result.ocr?.provider).toBe(TXT_SOURCE_PROVIDER);
    expect(result.extraction.bookSlug).toBe("unit-1");
  });
});
