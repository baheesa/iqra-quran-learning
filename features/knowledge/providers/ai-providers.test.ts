import { describe, expect, it } from "vitest";

import { createPromptBuilder } from "@/features/knowledge/prompts/prompt-builder";
import type { ClaudeChatClient } from "@/features/knowledge/providers/claude-client";
import { createClaudeExtractionProvider } from "@/features/knowledge/providers/claude-extraction";
import { createClaudeVisionOcrProvider } from "@/features/knowledge/providers/claude-vision-ocr";
import { createOpenAiExtractionProvider } from "@/features/knowledge/providers/openai-extraction";
import { createOpenAiVisionOcrProvider } from "@/features/knowledge/providers/openai-vision-ocr";
import {
  parseJsonObject,
  type OpenAiChatClient,
} from "@/features/knowledge/providers/openai-client";
import { loadPromptSection } from "@/lib/prompts/load-prompts";
import { mkdtemp, writeFile, rm } from "fs/promises";
import os from "os";
import path from "path";

describe("parseJsonObject", () => {
  it("parses incomplete markdown fences", () => {
    const raw = '```json\n{"rawText":"بسم","confidence":0.9}\n';
    expect(parseJsonObject<{ rawText: string }>(raw).rawText).toBe("بسم");
  });
});

describe("prompt loading", () => {
  it("loads OCR and extraction prompts from PROMPTS.md", async () => {
    const ocr = await loadPromptSection("OCR Extraction");
    const extraction = await loadPromptSection("Knowledge Extraction");
    expect(ocr).toContain("JSON only");
    expect(extraction).toContain("Vocabulary");
  });

  it("builds OCR and extraction prompts without hardcoding bodies", async () => {
    const builder = createPromptBuilder();
    const ocr = await builder.buildOcrPrompt({
      bookSlug: "unit-1",
      pageNumber: 1,
    });
    const extraction = await builder.buildExtractionPrompt({
      bookSlug: "unit-1",
      pageNumber: 1,
      unitNumber: 1,
      ocrText: "sample",
    });

    expect(ocr.user).toContain("OCR Extraction");
    expect(extraction.user).toContain("Knowledge Extraction");
    expect(extraction.system).toContain("Hallucination Prevention");
  });
});

describe("OpenAI providers with mocked client", () => {
  it("parses OCR JSON from vision provider", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "ocr-img-"));
    const imagePath = path.join(temp, "page.png");
    await writeFile(imagePath, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

    const client: OpenAiChatClient = {
      async completeJson() {
        return JSON.stringify({
          rawText: "بسم الله",
          confidence: 0.91,
          language: "ar",
          boundingBoxes: [],
        });
      },
    };

    const provider = createOpenAiVisionOcrProvider({ client });
    const result = await provider.recognize({
      bookSlug: "unit-1",
      pageNumber: 1,
      imageAbsolutePath: imagePath,
    });

    expect(result.provider).toBe("openai-vision");
    expect(result.rawText).toBe("بسم الله");
    expect(result.confidence).toBe(0.91);

    await rm(temp, { recursive: true, force: true });
  });

  it("parses extraction JSON and never invents when arrays missing", async () => {
    const client: OpenAiChatClient = {
      async completeJson() {
        return JSON.stringify({
          vocabulary: [
            {
              arabic: "رَبِّ",
              urdu: "رب",
              lesson: 1,
              unit: 1,
              confidence: 0.8,
            },
          ],
        });
      },
    };

    const provider = createOpenAiExtractionProvider({ client });
    const result = await provider.extract({
      bookSlug: "unit-1",
      pageNumber: 1,
      ocrText: "رَبِّ",
      unitNumber: 1,
      imageAbsolutePath: null,
    });

    expect(result.provider).toBe("openai-extraction");
    expect(result.vocabulary).toHaveLength(1);
    expect(result.lessons).toEqual([]);
    expect(result.rules).toEqual([]);
  });
});

describe("Claude providers with mocked client", () => {
  it("parses OCR JSON from Claude vision provider", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "claude-ocr-"));
    const imagePath = path.join(temp, "page.png");
    await writeFile(imagePath, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

    const client: ClaudeChatClient = {
      async completeJson() {
        return JSON.stringify({
          rawText: "الحمد لله",
          confidence: 0.88,
          language: "ar",
          boundingBoxes: [],
        });
      },
    };

    const provider = createClaudeVisionOcrProvider({ client });
    const result = await provider.recognize({
      bookSlug: "unit-1",
      pageNumber: 1,
      imageAbsolutePath: imagePath,
    });

    expect(result.provider).toBe("claude-vision");
    expect(result.rawText).toBe("الحمد لله");
    expect(result.confidence).toBe(0.88);

    await rm(temp, { recursive: true, force: true });
  });

  it("parses Claude extraction JSON without inventing missing arrays", async () => {
    const client: ClaudeChatClient = {
      async completeJson() {
        return JSON.stringify({
          vocabulary: [
            {
              arabic: "رَحْمٰن",
              urdu: "رحمان",
              lesson: 1,
              unit: 1,
              confidence: 0.75,
            },
          ],
        });
      },
    };

    const provider = createClaudeExtractionProvider({ client });
    const result = await provider.extract({
      bookSlug: "unit-1",
      pageNumber: 1,
      ocrText: "رَحْمٰن",
      unitNumber: 1,
      imageAbsolutePath: null,
    });

    expect(result.provider).toBe("claude-extraction");
    expect(result.vocabulary).toHaveLength(1);
    expect(result.lessons).toEqual([]);
    expect(result.rules).toEqual([]);
  });
});
