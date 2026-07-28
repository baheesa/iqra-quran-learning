/**
 * Text source parser for manually transcribed Muallim-ul-Quran TXT files.
 * Does not invent page numbers. Does not alter wording.
 */

export type TextSection = {
  /** Pipeline page/section index (1-based, file order). */
  sectionNumber: number;
  /** Label from the file when a marker existed (e.g. "53", "PAGE 2"); null if none. */
  sourcePageLabel: string | null;
  /** Exact section body from the file (markers stripped from body). */
  text: string;
};

export type ParsedTxtBook = {
  sections: TextSection[];
  characterCount: number;
  hasPageMarkers: boolean;
};

const MARKER_LINE =
  /^(?:={3,}\s*)?(?:PAGE\s+(\d+)|صفحہ\s+(\d+)(?:\s*(?:\([^)]*\))?(?:\s*[|｜].*)?)?)\s*(?:={3,})?\s*$/iu;

/**
 * True when a line is only a decorative rule (====) around a page marker.
 */
function isRuleLine(line: string): boolean {
  return /^=+$/.test(line.trim());
}

/**
 * Split transcribed TXT into sections.
 * - If page markers exist (`PAGE N`, `Page N`, `صفحہ N`, `===== PAGE N =====`), one section per marker.
 * - If no markers, the entire file is a single section (section 1) — no invented pages.
 */
export function parseTxtIntoSections(raw: string): ParsedTxtBook {
  const normalized = raw.replace(/^\uFEFF/, "");
  const characterCount = [...normalized].length;
  const lines = normalized.split(/\r?\n/);

  type MarkerHit = {
    lineIndex: number;
    label: string;
  };

  const markers: MarkerHit[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i]!.trim();
    // `===== PAGE 1 =====` style
    const equalsPage = trimmed.match(/^={3,}\s*PAGE\s+(\d+)\s*={3,}$/i);
    if (equalsPage?.[1]) {
      markers.push({ lineIndex: i, label: equalsPage[1] });
      continue;
    }
    // Standalone `Page 27` between rule lines (Unit 6+)
    const barePage = trimmed.match(/^Page\s+(\d+)$/i);
    if (barePage?.[1]) {
      markers.push({ lineIndex: i, label: barePage[1] });
      continue;
    }
    const match = trimmed.match(MARKER_LINE);
    if (match) {
      const label = match[1] ?? match[2];
      if (label) {
        markers.push({ lineIndex: i, label });
      }
    }
  }

  // Ignore TOC-only "صفحہ | سبق | موضوع" style (no digit) — already excluded by regex.

  if (markers.length === 0) {
    return {
      sections: [
        {
          sectionNumber: 1,
          sourcePageLabel: null,
          text: normalized.trimEnd(),
        },
      ],
      characterCount,
      hasPageMarkers: false,
    };
  }

  const sections: TextSection[] = [];

  for (let m = 0; m < markers.length; m += 1) {
    const current = markers[m]!;
    const next = markers[m + 1];
    let start = current.lineIndex + 1;
    // Skip trailing rule lines after marker
    while (start < lines.length && isRuleLine(lines[start]!)) {
      start += 1;
    }
    let end = next ? next.lineIndex : lines.length;
    // Drop rule lines immediately before the next marker
    while (end > start && isRuleLine(lines[end - 1]!)) {
      end -= 1;
    }
    // Also drop a rule line immediately before current marker from previous body — already handled

    const body = lines.slice(start, end).join("\n").replace(/^\n+/, "").replace(/\n+$/, "");
    sections.push({
      sectionNumber: m + 1,
      sourcePageLabel: current.label,
      text: body,
    });
  }

  // Prefatory text before the first marker becomes section content only if non-empty —
  // do not invent a page; prepend to first section if present.
  const firstMarker = markers[0]!;
  let prefaceEnd = firstMarker.lineIndex;
  while (prefaceEnd > 0 && isRuleLine(lines[prefaceEnd - 1]!)) {
    prefaceEnd -= 1;
  }
  const preface = lines.slice(0, prefaceEnd).join("\n").trim();
  if (preface && sections[0]) {
    sections[0] = {
      ...sections[0],
      text: `${preface}\n\n${sections[0].text}`.trim(),
    };
  }

  return {
    sections,
    characterCount,
    hasPageMarkers: true,
  };
}
