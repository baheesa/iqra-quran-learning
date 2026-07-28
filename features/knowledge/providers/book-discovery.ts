import { createHash } from "crypto";
import { createReadStream } from "fs";
import { access, readdir, stat } from "fs/promises";
import path from "path";

import { knowledgePaths } from "@/features/knowledge/paths";
import type { DiscoveredBook } from "@/features/knowledge/types";

export function slugifyBookFileName(fileName: string): string {
  return fileName
    .replace(/\.(pdf|txt)$/i, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseUnitNumber(fileName: string): number | null {
  const match = fileName.match(/unit\s*(\d+)/i);
  if (!match?.[1]) {
    return null;
  }
  return Number(match[1]);
}

export async function checksumFile(absolutePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(absolutePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

function titleFromFileName(fileName: string): string {
  return fileName.replace(/\.(pdf|txt)$/i, "");
}

/**
 * Discover original books. TXT is the primary source.
 * If both Unit N.txt and Unit N.pdf exist, TXT wins for that slug.
 * PDFs remain discoverable only when no TXT exists for the same slug
 * (legacy / Future OCR Import).
 */
export async function discoverOriginalBooks(
  originalDir = knowledgePaths.original,
): Promise<DiscoveredBook[]> {
  await access(originalDir);
  const entries = await readdir(originalDir);

  const bySlug = new Map<string, DiscoveredBook>();

  for (const fileName of entries) {
    const lower = fileName.toLowerCase();
    const isTxt = lower.endsWith(".txt");
    const isPdf = lower.endsWith(".pdf");
    if (!isTxt && !isPdf) {
      continue;
    }

    const absolutePath = path.join(originalDir, fileName);
    const info = await stat(absolutePath);
    if (!info.isFile()) {
      continue;
    }

    const slug = slugifyBookFileName(fileName);
    const candidate: DiscoveredBook = {
      fileName,
      absolutePath,
      title: titleFromFileName(fileName),
      unitNumber: parseUnitNumber(fileName),
      checksum: await checksumFile(absolutePath),
      sizeBytes: info.size,
      sourceKind: isTxt ? "txt" : "pdf",
    };

    const existing = bySlug.get(slug);
    if (!existing) {
      bySlug.set(slug, candidate);
      continue;
    }
    // Prefer TXT over PDF for the same slug
    if (existing.sourceKind === "pdf" && candidate.sourceKind === "txt") {
      bySlug.set(slug, candidate);
    }
  }

  return [...bySlug.values()].sort((a, b) => {
    const unitA = a.unitNumber ?? Number.MAX_SAFE_INTEGER;
    const unitB = b.unitNumber ?? Number.MAX_SAFE_INTEGER;
    if (unitA !== unitB) {
      return unitA - unitB;
    }
    return a.fileName.localeCompare(b.fileName);
  });
}
