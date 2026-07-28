import { parseJsonObject } from "@/features/knowledge/providers/openai-client";

export type ClaudeVisionPart =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: {
        type: "base64";
        media_type: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
        data: string;
      };
    };

export type ClaudeChatClient = {
  completeJson(input: {
    system: string;
    user: ClaudeVisionPart[];
    model?: string;
  }): Promise<string>;
};

/**
 * Anthropic Claude client for vision OCR / extraction.
 * Returns JSON text; callers parse with parseJsonObject.
 */
export function createClaudeChatClient(options?: {
  apiKey?: string;
  model?: string;
}): ClaudeChatClient {
  const apiKey = options?.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required for Claude vision/extraction");
  }

  const defaultModel =
    options?.model ??
    process.env.ANTHROPIC_MODEL ??
    "claude-sonnet-4-5";

  return {
    async completeJson({ system, user, model }) {
      // Dynamic import keeps package optional for builds without Claude use.
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey });

      const response = await client.messages.create({
        model: model ?? defaultModel,
        max_tokens: 8192,
        temperature: 0,
        system: `${system}\n\nRespond with a single JSON object only. No markdown fences.`,
        messages: [
          {
            role: "user",
            content: user,
          },
        ],
      });

      const text = response.content
        .filter((block) => block.type === "text")
        .map((block) => (block.type === "text" ? block.text : ""))
        .join("\n")
        .trim();

      if (!text) {
        throw new Error("Claude returned empty content");
      }

      // Normalize/validate; return canonical JSON so callers always parse cleanly
      const parsed = parseJsonObject<unknown>(text);
      return JSON.stringify(parsed);
    },
  };
}

export function mediaTypeFromPath(
  filePath: string,
): "image/png" | "image/jpeg" | "image/webp" | "image/gif" {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/png";
}
