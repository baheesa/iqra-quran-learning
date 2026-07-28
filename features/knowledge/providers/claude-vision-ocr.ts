import { readFile } from "fs/promises";

import {
  createPromptBuilder,
  type PromptBuilder,
} from "@/features/knowledge/prompts/prompt-builder";
import {
  createClaudeChatClient,
  mediaTypeFromPath,
  type ClaudeChatClient,
} from "@/features/knowledge/providers/claude-client";
import { parseJsonObject } from "@/features/knowledge/providers/openai-client";
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

/**
 * Claude Vision OCR provider.
 * Never invents text — model instructed to return empty/null when uncertain.
 */
export function createClaudeVisionOcrProvider(options?: {
  client?: ClaudeChatClient;
  promptBuilder?: PromptBuilder;
}): OcrProvider {
  const promptBuilder = options?.promptBuilder ?? createPromptBuilder();

  return {
    name: "claude-vision",

    async recognize(input: OcrInput): Promise<OcrOutput> {
      if (!input.imageAbsolutePath) {
        throw new Error(
          `Claude Vision OCR requires a page image for ${input.bookSlug} page ${input.pageNumber}`,
        );
      }

      const client = options?.client ?? createClaudeChatClient();
      const prompt = await promptBuilder.buildOcrPrompt({
        bookSlug: input.bookSlug,
        pageNumber: input.pageNumber,
      });
      const bytes = await readFile(input.imageAbsolutePath);
      const mediaType = mediaTypeFromPath(input.imageAbsolutePath);

      const raw = await client.completeJson({
        system: prompt.system,
        user: [
          { type: "text", text: prompt.user },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: bytes.toString("base64"),
            },
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
        provider: "claude-vision",
      };
    },
  };
}
