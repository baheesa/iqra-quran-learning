import { describe, expect, it } from "vitest";

import { extractFromTxtSection } from "@/features/knowledge/services/txt-structure-extract";
import { parseTxtIntoSections } from "@/features/knowledge/services/txt-parser";
import { normalizeArabic } from "@/features/teacher/domain/arabic";

describe("txt-structure extract", () => {
  it("extracts يَرْجُونَ meaning from Muallim Unit 6 style lines", () => {
    const text = `
یونٹ 6 سبق 1
يَرْجُو : يَرْجُونَ (وہ امید رکھتے ہیں)
يَخْشَى : يَخْشَوْنَ (وہ ڈرتے ہیں)

يَرْجُونَ (وہ امید رکھتے ہیں) | يَخَافُونَ (وہ ڈرتے ہیں)
1. يَرْجُونَ رَحْمَةَ اللَّهِ)
2. وَيَرْجُونَ رَحْمَتَهُ)
`;

    const output = extractFromTxtSection(text, {
      unitNumber: 6,
      pageLabel: "28",
      pageNumber: 28,
    });

    const hit = output.vocabulary.find(
      (item) => normalizeArabic(item.arabic) === normalizeArabic("يرجون"),
    );
    expect(hit?.urdu).toContain("امید");
    expect(hit?.root).toBeTruthy();
    expect(hit?.references?.length ?? 0).toBeGreaterThan(0);
    expect(output.lessons.length).toBeGreaterThan(0);
  });

  it("extracts Unit 1 bullet vocabulary without inventing meanings", () => {
    const text = `
* الإسلام  : اسلام
* الجَنَّة  : جنت
* unknownword
`;
    const output = extractFromTxtSection(text, {
      unitNumber: 1,
      pageLabel: "15",
      pageNumber: 1,
    });
    expect(output.vocabulary.some((item) => item.arabic.includes("الإسلام"))).toBe(
      true,
    );
    expect(output.vocabulary.every((item) => Boolean(item.urdu))).toBe(true);
  });

  it("parses Page N markers used in Unit 6", () => {
    const raw = `Intro\n=========================================\nPage 27\n=========================================\nBody A\n=========================================\nPage 28\n=========================================\nBody B`;
    const parsed = parseTxtIntoSections(raw);
    expect(parsed.hasPageMarkers).toBe(true);
    expect(parsed.sections).toHaveLength(2);
    expect(parsed.sections[0]?.sourcePageLabel).toBe("27");
    expect(parsed.sections[1]?.text).toContain("Body B");
  });
});
