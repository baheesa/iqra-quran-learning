import { readFile } from "fs/promises";

import {
  createPromptBuilder,
  type PromptBuilder,
} from "@/features/knowledge/prompts/prompt-builder";
import {
  createClaudeChatClient,
  mediaTypeFromPath,
  type ClaudeChatClient,
  type ClaudeVisionPart,
} from "@/features/knowledge/providers/claude-client";
import { parseJsonObject } from "@/features/knowledge/providers/openai-client";
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

/**
 * Claude extraction provider — extract only, never invent curriculum.
 */
export function createClaudeExtractionProvider(options?: {
  client?: ClaudeChatClient;
  promptBuilder?: PromptBuilder;
}): ExtractionProvider {
  const promptBuilder = options?.promptBuilder ?? createPromptBuilder();

  return {
    name: "claude-extraction",

    async extract(input: ExtractionInput): Promise<ExtractionOutput> {
      const client = options?.client ?? createClaudeChatClient();
      const prompt = await promptBuilder.buildExtractionPrompt({
        bookSlug: input.bookSlug,
        pageNumber: input.pageNumber,
        unitNumber: input.unitNumber,
        ocrText: input.ocrText,
      });

      const user: ClaudeVisionPart[] = [{ type: "text", text: prompt.user }];

      if (input.imageAbsolutePath) {
        const bytes = await readFile(input.imageAbsolutePath);
        user.push({
          type: "image",
          source: {
            type: "base64",
            media_type: mediaTypeFromPath(input.imageAbsolutePath),
            data: bytes.toString("base64"),
          },
        });
      }

      const raw = await client.completeJson({
        system: prompt.system,
        user,
      });

      const parsed = parseJsonObject<ExtractionJson>(raw);

      return {
        provider: "claude-extraction",
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
