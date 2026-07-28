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
  ExtractionInput,
  ExtractionOutput,
  ExtractionProvider,
} from "@/features/knowledge/providers/types";

type ExtractionJson = {
  lessons?: ExtractionOutput["lessons"];
  vocabulary?: ExtractionOutput["vocabulary"];
  rules?: ExtractionOutput["rules"];
  exercises?: ExtractionOutput["exercises"];
  examples?: string[];
  reviewQuestions?: string[];
  headings?: string[];
  tables?: string[];
};

async function optionalImageDataUrl(
  imageAbsolutePath: string | null | undefined,
): Promise<string | null> {
  if (!imageAbsolutePath) {
    return null;
  }
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
 * OpenAI extraction provider — extract only, never invent curriculum.
 */
export function createOpenAiExtractionProvider(options?: {
  client?: OpenAiChatClient;
  promptBuilder?: PromptBuilder;
}): ExtractionProvider {
  const promptBuilder = options?.promptBuilder ?? createPromptBuilder();

  return {
    name: "openai-extraction",

    async extract(input: ExtractionInput): Promise<ExtractionOutput> {
      const client = options?.client ?? createOpenAiChatClient();
      const prompt = await promptBuilder.buildExtractionPrompt({
        bookSlug: input.bookSlug,
        pageNumber: input.pageNumber,
        unitNumber: input.unitNumber,
        ocrText: input.ocrText,
      });

      const imageUrl = await optionalImageDataUrl(input.imageAbsolutePath);
      const userContent: Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      > = [{ type: "text", text: prompt.user }];

      if (imageUrl) {
        userContent.push({
          type: "image_url",
          image_url: { url: imageUrl },
        });
      }

      const raw = await client.completeJson({
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: userContent },
        ],
      });

      const parsed = parseJsonObject<ExtractionJson>(raw);

      return {
        provider: "openai-extraction",
        lessons: Array.isArray(parsed.lessons) ? parsed.lessons : [],
        vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [],
        rules: Array.isArray(parsed.rules) ? parsed.rules : [],
        exercises: Array.isArray(parsed.exercises) ? parsed.exercises : [],
        examples: Array.isArray(parsed.examples) ? parsed.examples : [],
        reviewQuestions: Array.isArray(parsed.reviewQuestions)
          ? parsed.reviewQuestions
          : [],
        headings: Array.isArray(parsed.headings) ? parsed.headings : [],
        tables: Array.isArray(parsed.tables) ? parsed.tables : [],
      };
    },
  };
}
