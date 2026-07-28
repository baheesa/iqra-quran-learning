/**
 * Live OCR + extraction for rendered Muallim page images.
 *
 * Requires ANTHROPIC_API_KEY (Claude) or OPENAI_API_KEY in .env.local
 *
 *   pnpm knowledge:ocr-live -- --slug=unit-1 --max=3
 *   node --env-file=.env.local ./node_modules/tsx/dist/cli.mjs scripts/run-live-ocr.ts --slug=unit-1 --max=3
 */
import { liveAiEnvMissingMessage } from "../features/knowledge/providers/ai-provider-config";
import { createKnowledgeEngine } from "../features/knowledge/create-engine";

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const match = process.argv.find((item) => item.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

async function main() {
  const engine = createKnowledgeEngine({ useStubAi: false });
  console.log("providers", engine.providers);

  const liveOcr =
    engine.providers.ocr === "claude-vision" ||
    engine.providers.ocr === "openai-vision";

  if (!liveOcr) {
    console.error(liveAiEnvMissingMessage());
    console.error("Got providers:", engine.providers);
    process.exit(1);
  }

  const slug = arg("slug") ?? "unit-1";
  const maxPages = Number(arg("max") ?? "3");
  const fromPage = Number(arg("from") ?? "1");

  const pages = await engine.repo.listPages(slug);
  const targets = pages
    .filter((page) => page.pageNumber >= fromPage)
    .slice(0, maxPages);

  if (targets.length === 0) {
    throw new Error(
      `No pages found for ${slug}. Render pages first (pnpm knowledge:unit1).`,
    );
  }

  let failures = 0;
  for (const page of targets) {
    if (page.status !== "RENDERED" || !page.imageRelativePath) {
      console.warn(`skip page ${page.pageNumber}: not rendered`);
      continue;
    }

    try {
      console.log(`OCR page ${page.pageNumber}…`);
      const ocr = await engine.ocr.runPage(slug, page.pageNumber);
      console.log(
        `  ocr chars=${ocr.rawText.length} confidence=${ocr.confidence ?? "n/a"}`,
      );

      console.log(`Extract page ${page.pageNumber}…`);
      const extraction = await engine.extraction.extractPage(
        slug,
        page.pageNumber,
      );
      console.log(
        `  lessons=${extraction.lessons.length} vocab=${extraction.vocabulary.length} rules=${extraction.rules.length} status=${extraction.verificationStatus}`,
      );
    } catch (error: unknown) {
      failures += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  FAILED page ${page.pageNumber}: ${message}`);
    }
  }

  const status = await engine.knowledgeBase.getBookStatus(slug);
  console.log(
    JSON.stringify(
      {
        slug,
        pipeline: status?.manifest.status,
        counts: status?.counts,
        failures,
        hint: "Review in /admin/knowledge/unit-1 then Approve → Validate → Publish",
      },
      null,
      2,
    ),
  );

  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
