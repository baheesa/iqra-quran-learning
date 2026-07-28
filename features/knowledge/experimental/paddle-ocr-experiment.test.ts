import { describe, expect, it } from "vitest";

import { buildFreeOcrReport } from "@/features/knowledge/experimental/PaddleOcrExperiment";

describe("Free OCR experiment report", () => {
  it("summarizes confidence and failures without touching production OCR", () => {
    const md = buildFreeOcrReport({
      bookLabel: "Unit 2",
      pdfRelativePath: "knowledge/books/original/Unit 2.pdf",
      results: [
        {
          page: 1,
          confidence: 0.9,
          processingTime: 100,
          provider: "PaddleOCR",
          text: "بسم",
        },
        {
          page: 2,
          confidence: 0.4,
          processingTime: 120,
          provider: "PaddleOCR",
          text: "x",
        },
        {
          page: 3,
          confidence: null,
          processingTime: 50,
          provider: "PaddleOCR",
          text: "",
          error: "boom",
        },
      ],
    });

    expect(md).toContain("Total pages | 3");
    expect(md).toContain("Failed | 1");
    expect(md).toContain("PaddleOCR");
    expect(md).toContain("| 2 |");
    expect(md).toContain("Page 3:");
  });
});
