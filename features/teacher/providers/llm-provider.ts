import OpenAI from "openai";

export type TeacherLlmProvider = {
  name: string;
  complete(input: { system: string; user: string }): Promise<string>;
};

export function createStubTeacherLlmProvider(
  generate: (input: { system: string; user: string }) => string,
): TeacherLlmProvider {
  return {
    name: "stub-teacher",
    async complete(input) {
      return generate(input);
    },
  };
}

export function createOpenAiTeacherLlmProvider(options?: {
  apiKey?: string;
  model?: string;
}): TeacherLlmProvider {
  const apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for OpenAI teacher");
  }

  const client = new OpenAI({ apiKey });
  const model = options?.model ?? process.env.OPENAI_MODEL ?? "gpt-4o";

  return {
    name: "openai-teacher",
    async complete({ system, user }) {
      const response = await client.chat.completions.create({
        model,
        temperature: 0.3,
        max_tokens: 600,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("OpenAI teacher returned empty content");
      }
      return content;
    },
  };
}

export function createClaudeTeacherLlmProvider(options?: {
  apiKey?: string;
  model?: string;
}): TeacherLlmProvider {
  const apiKey = options?.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required for Claude teacher");
  }

  const model =
    options?.model ?? process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

  return {
    name: "claude-teacher",
    async complete({ system, user }) {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey });
      const response = await client.messages.create({
        model,
        max_tokens: 600,
        temperature: 0.3,
        system,
        messages: [{ role: "user", content: user }],
      });

      const content = response.content
        .filter((block) => block.type === "text")
        .map((block) => (block.type === "text" ? block.text : ""))
        .join("\n")
        .trim();

      if (!content) {
        throw new Error("Claude teacher returned empty content");
      }
      return content;
    },
  };
}
