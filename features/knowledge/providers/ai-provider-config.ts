/**
 * Resolves which live AI backend to use for OCR / extraction / teacher.
 *
 * AI_PROVIDER=claude | openai | auto (default)
 * - claude: requires ANTHROPIC_API_KEY
 * - openai: requires OPENAI_API_KEY
 * - auto: Anthropic if key present, else OpenAI, else none (stub)
 */

export type LiveAiBackend = "claude" | "openai" | "none";

export function resolveLiveAiBackend(): LiveAiBackend {
  const preference = (process.env.AI_PROVIDER ?? "auto").toLowerCase().trim();
  const hasClaude = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  const hasOpenAi = Boolean(process.env.OPENAI_API_KEY?.trim());

  if (preference === "claude") {
    return hasClaude ? "claude" : "none";
  }
  if (preference === "openai") {
    return hasOpenAi ? "openai" : "none";
  }

  if (hasClaude) return "claude";
  if (hasOpenAi) return "openai";
  return "none";
}

export function liveAiKeyHintUrdu(): string {
  const preference = (process.env.AI_PROVIDER ?? "auto").toLowerCase().trim();
  if (preference === "claude") {
    return "ANTHROPIC_API_KEY .env.local میں ڈالیں (AI_PROVIDER=claude)، سرور دوبارہ چلائیں، پھر Run OCR دبائیں۔";
  }
  if (preference === "openai") {
    return "OPENAI_API_KEY .env.local میں ڈالیں، سرور دوبارہ چلائیں، پھر Run OCR دبائیں۔";
  }
  return "ANTHROPIC_API_KEY یا OPENAI_API_KEY .env.local میں ڈالیں، سرور دوبارہ چلائیں، پھر Run OCR دبائیں۔ تصاویر تیار ہیں؛ بغیر key کے stub خالی رہتا ہے۔";
}

export function liveAiEnvMissingMessage(): string {
  const preference = (process.env.AI_PROVIDER ?? "auto").toLowerCase().trim();
  if (preference === "claude") {
    return `ANTHROPIC_API_KEY missing.

Add to .env.local:
  AI_PROVIDER=claude
  ANTHROPIC_API_KEY=sk-ant-...
  ANTHROPIC_MODEL=claude-sonnet-4-5

Then:
  pnpm knowledge:ocr-live -- --slug=unit-1 --max=3
`;
  }
  if (preference === "openai") {
    return `OPENAI_API_KEY missing.

Add to .env.local:
  AI_PROVIDER=openai
  OPENAI_API_KEY=sk-...
  OPENAI_MODEL=gpt-4o

Then:
  pnpm knowledge:ocr-live -- --slug=unit-1 --max=3
`;
  }
  return `No live AI key found.

For Claude (recommended if you have Anthropic):
  AI_PROVIDER=claude
  ANTHROPIC_API_KEY=sk-ant-...
  ANTHROPIC_MODEL=claude-sonnet-4-5

Or OpenAI:
  AI_PROVIDER=openai
  OPENAI_API_KEY=sk-...
  OPENAI_MODEL=gpt-4o

Then:
  pnpm knowledge:ocr-live -- --slug=unit-1 --max=3
`;
}
