import { describe, expect, it } from "vitest";

import {
  arabicLookupCandidates,
  normalizeArabic,
} from "@/features/teacher/domain/arabic";

describe("arabicLookupCandidates", () => {
  it("strips article and proclitics without inventing content", () => {
    expect(arabicLookupCandidates("ٱلرَّحْمَٰنِ")).toEqual(
      expect.arrayContaining([
        normalizeArabic("الرحمن"),
        normalizeArabic("رحمن"),
      ]),
    );
    expect(arabicLookupCandidates("وبالكتاب")).toEqual(
      expect.arrayContaining([normalizeArabic("كتاب")]),
    );
  });
});
