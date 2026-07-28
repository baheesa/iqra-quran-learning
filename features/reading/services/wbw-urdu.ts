import { readFile, stat } from "fs/promises";
import path from "path";

export type WbwUrduFile = {
  version: number;
  source: string;
  language: "urdu";
  builtAt: string;
  wordCount: number;
  meanings: Record<string, string>;
};

let cache: WbwUrduFile | null = null;
let cacheMtimeMs = 0;

export function wbwUrduPath(): string {
  return path.join(process.cwd(), "data", "quran", "wbw-urdu.json");
}

export async function loadWbwUrdu(): Promise<WbwUrduFile | null> {
  try {
    const filePath = wbwUrduPath();
    const info = await stat(filePath);
    if (cache && info.mtimeMs === cacheMtimeMs) return cache;
    const raw = await readFile(filePath, "utf8");
    cache = JSON.parse(raw) as WbwUrduFile;
    cacheMtimeMs = info.mtimeMs;
    return cache;
  } catch {
    return null;
  }
}

export function clearWbwUrduCache(): void {
  cache = null;
  cacheMtimeMs = 0;
}

export async function lookupWbwUrduByWordId(
  wordId: string,
): Promise<string | null> {
  const file = await loadWbwUrdu();
  if (!file) return null;
  const meaning = file.meanings[wordId]?.trim();
  return meaning || null;
}
