import { readFile } from "fs/promises";
import path from "path";

const DEFAULT_PROMPTS_PATH = path.join(process.cwd(), "cursor", "PROMPTS.md");

/**
 * Load a named prompt section from cursor/PROMPTS.md.
 * Sections are delimited by headings like `# Prompt 8 — OCR Extraction`.
 */
export async function loadPromptSection(
  headingIncludes: string,
  promptsPath: string = DEFAULT_PROMPTS_PATH,
): Promise<string> {
  const raw = await readFile(promptsPath, "utf8");
  const lines = raw.split(/\r?\n/);
  const startIndex = lines.findIndex(
    (line) => line.startsWith("# ") && line.includes(headingIncludes),
  );

  if (startIndex === -1) {
    throw new Error(`Prompt section not found: ${headingIncludes}`);
  }

  let endIndex = lines.length;
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (
      lines[index]?.startsWith("# Prompt ") ||
      lines[index] === "# Prompt Variables"
    ) {
      endIndex = index;
      break;
    }
    // Also stop at major non-prompt top-level sections after Prompt 20
    if (
      index > startIndex + 1 &&
      lines[index]?.startsWith("# ") &&
      !lines[index]?.startsWith("# Prompt")
    ) {
      // Allow continuing within multi-part docs; only break on next Prompt N
      if (/^# Prompt \d+/.test(lines[index] ?? "")) {
        endIndex = index;
        break;
      }
    }
  }

  // Prefer stopping at next `# Prompt <number>`
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (/^# Prompt \d+/.test(lines[index] ?? "")) {
      endIndex = index;
      break;
    }
  }

  return lines.slice(startIndex, endIndex).join("\n").trim();
}

export async function loadGlobalSystemPrompt(
  promptsPath: string = DEFAULT_PROMPTS_PATH,
): Promise<string> {
  const raw = await readFile(promptsPath, "utf8");
  const match = raw.match(
    /# Global System Prompt\n([\s\S]*?)(?=\n# Teaching Principles|\n# Prompt 1)/,
  );
  return (match?.[1] ?? "").trim();
}
