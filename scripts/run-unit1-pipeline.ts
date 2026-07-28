/**
 * Unit 1 TXT primary pipeline (no PDF / Vision OCR).
 *
 *   pnpm knowledge:unit1
 */
import { createKnowledgeEngine } from "../features/knowledge/create-engine";

async function main() {
  const maxPages = Number(process.env.MAX_PAGES ?? "0") || undefined;
  const engine = createKnowledgeEngine({
    useStubAi: true,
    useStubPdf: true,
  });

  console.log("providers", engine.providers);
  const manifest = await engine.import.importOne("Unit 1.txt");
  console.log(
    "imported",
    manifest.slug,
    "sections",
    manifest.sectionCount,
    "chars",
    manifest.characterCount,
  );

  const extracted = await engine.extraction.extractBook(manifest.slug, {
    maxPages,
  });
  console.log("extracted", extracted.length);

  const status = await engine.knowledgeBase.getBookStatus(manifest.slug);
  console.log(
    JSON.stringify(
      {
        slug: status?.manifest.slug,
        sourceKind: status?.manifest.sourceKind,
        pipeline: status?.manifest.status,
        counts: status?.counts,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
