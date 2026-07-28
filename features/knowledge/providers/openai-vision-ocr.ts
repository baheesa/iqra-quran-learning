import { readFile } from "fs/promises";
import path from "path";

import {
  createPromptBuilder,
  type PromptBuilder,
} from "@/features/knowledge/prompts/prompt-builder";
import {
  createOpenAiChatClient,
  parseJsonObject,
  type OpenAiChatClient,
} from "@/features/knowledge/providers/openai-client";
import type {
  OcrInput,
  OcrOutput,
  OcrProvider,
} from "@/features/knowledge/providers/types";

type OcrJson = {
  rawText?: string | null;
  confidence?: number | null;
  language?: string | null;
  boundingBoxes?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }> | null;
};

async function toDataUrl(imageAbsolutePath: string): Promise<string> {
  const bytes = await readFile(imageAbsolutePath);
  const ext = path.extname(imageAbsolutePath).toLowerCase();
  const mime =
    ext === ".jpg" || ext === ".jpeg"
      ? "image/jpeg"
      : ext === ".webp"
        ? "image/webp"
        : "image/png";
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

/**
 * OpenAI Vision OCR provider.
 * Never invents text — model instructed to return empty/null when uncertain.
 */
export function createOpenAiVisionOcrProvider(options?: {
  client?: OpenAiChatClient;
  promptBuilder?: PromptBuilder;
}): OcrProvider {
  const promptBuilder = options?.promptBuilder ?? createPromptBuilder();

  return {
    name: "openai-vision",

    async recognize(input: OcrInput): Promise<OcrOutput> {
      if (!input.imageAbsolutePath) {
        throw new Error(
          `OpenAI Vision OCR requires a page image for ${input.bookSlug} page ${input.pageNumber}`,
        );
      }

      const client = options?.client ?? createOpenAiChatClient();
      const prompt = await promptBuilder.buildOcrPrompt({
        bookSlug: input.bookSlug,
        pageNumber: input.pageNumber,
      });
      const imageUrl = await toDataUrl(input.imageAbsolutePath);

      const raw = await client.completeJson({
        messages: [
          { role: "system", content: prompt.system },
          {
            role: "user",
            content: [
              { type: "text", text: prompt.user },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
      });

      const parsed = parseJsonObject<OcrJson>(raw);

      return {
        rawText: parsed.rawText ?? "",
        confidence:
          typeof parsed.confidence === "number" ? parsed.confidence : null,
        language: parsed.language ?? null,
        boundingBoxes: Array.isArray(parsed.boundingBoxes)
          ? parsed.boundingBoxes
          : [],
        provider: "openai-vision",
      };
    },
  };
}
