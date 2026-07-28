/**
 * Free OCR POC — Unit 2.pdf only.
 *
 * Standalone experiment. Does not touch Knowledge Engine / Claude / OpenAI.
 *
 *   bash scripts/install-free-ocr.sh
 *   pnpm free-ocr:unit2
 *   FREE_OCR_MAX_PAGES=2 pnpm free-ocr:unit2
 */

import path from "node:path";

import { runPaddleOcrExperiment } from "../features/knowledge/experimental/PaddleOcrExperiment";

async function main() {
  const projectRoot = process.cwd();
  const pdfAbsolutePath = path.join(
    projectRoot,
    "knowledge",
    "books",
    "original",
    "Unit 2.pdf",
  );
  const experimentRoot = path.join(
    projectRoot,
    "knowledge",
    "experiments",
    "free-ocr",
    "unit-2",
  );

  const maxPagesEnv = process.env.FREE_OCR_MAX_PAGES;
  const maxPages = maxPagesEnv ? Number(maxPagesEnv) : undefined;
  if (maxPagesEnv && (!Number.isFinite(maxPages) || (maxPages ?? 0) < 1)) {
    throw new Error("FREE_OCR_MAX_PAGES must be a positive number");
  }

  console.log(
    JSON.stringify(
      {
        experiment: "free-ocr",
        book: "Unit 2.pdf",
        pdfAbsolutePath,
        experimentRoot,
        maxPages: maxPages ?? "all",
        note: "Does not call OpenAI/Claude or modify production OCR",
      },
      null,
      2,
    ),
  );

  const result = await runPaddleOcrExperiment({
    pdfAbsolutePath,
    experimentRoot,
    pythonPath: path.join(projectRoot, ".venv-free-ocr", "bin", "python"),
    maxPages,
  });

  const failed = result.results.filter((r) => r.error).length;
  console.log(
    JSON.stringify(
      {
        pages: result.results.length,
        failed,
        pagesDir: result.pagesDir,
        ocrDir: result.ocrDir,
        reportPath: result.reportPath,
      },
      null,
      2,
    ),
  );

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
