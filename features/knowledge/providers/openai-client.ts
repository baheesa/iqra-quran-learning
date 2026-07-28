import OpenAI from "openai";

export type ChatVisionMessage = {
  role: "system" | "user";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
};

export type OpenAiChatClient = {
  completeJson(input: {
    messages: ChatVisionMessage[];
    model?: string;
  }): Promise<string>;
};

export function createOpenAiChatClient(options?: {
  apiKey?: string;
  model?: string;
}): OpenAiChatClient {
  const apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for OpenAI vision/extraction");
  }

  const client = new OpenAI({ apiKey });
  const defaultModel = options?.model ?? process.env.OPENAI_MODEL ?? "gpt-4o";

  return {
    async completeJson({ messages, model }) {
      const response = await client.chat.completions.create({
        model: model ?? defaultModel,
        temperature: 0,
        response_format: { type: "json_object" },
        messages:
          messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("OpenAI returned empty content");
      }
      return content;
    },
  };
}

export function parseJsonObject<T>(raw: string): T {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  let payload = fenced?.[1]?.trim() ?? trimmed;

  // Incomplete markdown fence (common when vision output is truncated)
  if (!fenced && payload.startsWith("```")) {
    payload = payload
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
  }

  try {
    return JSON.parse(payload) as T;
  } catch {
    const start = payload.indexOf("{");
    const end = payload.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(payload.slice(start, end + 1)) as T;
    }
    throw new Error(`Failed to parse JSON object from model output`);
  }
}
