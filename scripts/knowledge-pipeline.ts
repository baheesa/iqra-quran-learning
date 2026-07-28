import { createKnowledgeEngine } from "../features/knowledge/create-engine";
import { isOcrEnabled } from "../features/knowledge/providers/ocr-enabled";

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const match = process.argv.find((item) => item.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

async function main() {
  const command = process.argv[2] ?? "discover";
  const engine = createKnowledgeEngine();

  if (command === "discover") {
    console.log(JSON.stringify(await engine.books.discover(), null, 2));
    return;
  }

  if (command === "import") {
    const force = process.argv.includes("--force");
    const result = await engine.import.importAll({ forceReimport: force });
    console.log(
      JSON.stringify(
        {
          ...result,
          knowledgeAutoApprove: engine.providers.knowledgeAutoApprove,
        },
        null,
        2,
      ),
    );
    return;
  }

  const slug = arg("slug");
  const max = arg("max") ? Number(arg("max")) : undefined;

  if (command === "ingest" || command === "txt") {
    if (!slug) {
      throw new Error(`Command ${command} requires --slug=...`);
    }
    const force = process.argv.includes("--force");
    console.log(
      JSON.stringify(await engine.txtIngest.ingestBook(slug, { force }), null, 2),
    );
    return;
  }

  if (command === "rebuild-index") {
    const { rebuildAllKnowledgeIndexes } = await import(
      "../features/knowledge/services/knowledge-indexes"
    );
    const summary = await rebuildAllKnowledgeIndexes();
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  if (!slug) {
    throw new Error(`Command ${command} requires --slug=...`);
  }

  if (command === "pages") {
    if (!isOcrEnabled()) {
      throw new Error(
        "PDF page raster is disabled (Future OCR Import). Use TXT import instead, or set OCR_ENABLED=1.",
      );
    }
    const pages = await engine.images.extractPages(slug, { maxPages: max });
    console.log(JSON.stringify({ count: pages.length }, null, 2));
    return;
  }

  if (command === "ocr") {
    if (!isOcrEnabled()) {
      throw new Error(
        "Vision OCR is disabled. TXT is primary. Set OCR_ENABLED=1 for Future OCR Import.",
      );
    }
    const results = await engine.ocr.runBook(slug, { maxPages: max });
    console.log(JSON.stringify({ count: results.length }, null, 2));
    return;
  }

  if (command === "extract") {
    const results = await engine.extraction.extractBook(slug, {
      maxPages: max,
    });
    console.log(
      JSON.stringify(
        {
          count: results.length,
          knowledgeAutoApprove: engine.providers.knowledgeAutoApprove,
          verificationStatus: results[0]?.verificationStatus ?? null,
        },
        null,
        2,
      ),
    );
    return;
  }

  if (command === "status") {
    console.log(
      JSON.stringify(await engine.knowledgeBase.getBookStatus(slug), null, 2),
    );
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
