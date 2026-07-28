/**
 * EXPERIMENTAL — Free OCR POC (PaddleOCR).
 *
 * Not wired into Knowledge Engine, admin UI, or production OCR providers.
 * Invoked only by scripts/free-ocr-unit2.ts.
 */

import { execFile } from "node:child_process";
import { access, mkdir, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type PaddleOcrPageResult = {
  page: number;
  confidence: number | null;
  processingTime: number;
  provider: "PaddleOCR";
  text: string;
  error?: string;
};

export type PaddleOcrExperimentOptions = {
  pdfAbsolutePath: string;
  experimentRoot: string;
  pythonPath?: string;
  paddleScriptPath?: string;
  maxPages?: number;
};

function padPage(n: number): string {
  return String(n).padStart(3, "0");
}

async function which(bin: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("/usr/bin/which", [bin], {
      env: {
        ...process.env,
        PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH ?? ""}`,
      },
    });
    const found = stdout.trim();
    return found || null;
  } catch {
    return null;
  }
}

async function listPngs(dir: string): Promise<string[]> {
  const files = await readdir(dir);
  return files
    .filter((f) => f.toLowerCase().endsWith(".png"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

/**
 * Rasterize PDF → PNG via pdftoppm, else ImageMagick, else Ghostscript CLI.
 * Does not import production PDF providers.
 */
export async function renderPdfPagesToPng(input: {
  pdfAbsolutePath: string;
  pagesDir: string;
  maxPages?: number;
}): Promise<string[]> {
  await mkdir(input.pagesDir, { recursive: true });

  // Clear previous PNGs so renames stay consistent across re-runs
  for (const file of await listPngs(input.pagesDir)) {
    const { unlink } = await import("node:fs/promises");
    await unlink(path.join(input.pagesDir, file));
  }

  const pdftoppm = await which("pdftoppm");
  const magick = (await which("magick")) ?? (await which("convert"));
  const gs = await which("gs");

  if (pdftoppm) {
    const prefix = path.join(input.pagesDir, "raw");
    const args = ["-png", "-r", "120"];
    if (input.maxPages && input.maxPages > 0) {
      args.push("-f", "1", "-l", String(input.maxPages));
    }
    args.push(input.pdfAbsolutePath, prefix);
    await execFileAsync(pdftoppm, args, { maxBuffer: 64 * 1024 * 1024 });
  } else if (magick) {
    const pattern = path.join(input.pagesDir, "raw.png");
    const isMagickBinary = path.basename(magick) === "magick";
    const args = isMagickBinary
      ? ["convert", "-density", "120", input.pdfAbsolutePath, pattern]
      : ["-density", "120", input.pdfAbsolutePath, pattern];
    if (input.maxPages && input.maxPages > 0) {
      // ImageMagick has no simple last-page flag across versions; render all then trim
    }
    await execFileAsync(magick, args, { maxBuffer: 128 * 1024 * 1024 });
  } else if (gs) {
    const outputPattern = path.join(input.pagesDir, "raw-%03d.png");
    const args = [
      "-dSAFER",
      "-dBATCH",
      "-dNOPAUSE",
      "-sDEVICE=png16m",
      "-r120",
      `-sOutputFile=${outputPattern}`,
      input.pdfAbsolutePath,
    ];
    if (input.maxPages && input.maxPages > 0) {
      args.splice(5, 0, `-dLastPage=${input.maxPages}`);
    }
    await execFileAsync(gs, args, { maxBuffer: 64 * 1024 * 1024 });
  } else {
    throw new Error(
      "No PDF rasterizer found. Install one of:\n" +
        "  brew install poppler     # pdftoppm (preferred)\n" +
        "  brew install imagemagick\n" +
        "Or ensure Ghostscript (`gs`) is on PATH.\n" +
        "Then re-run: bash scripts/install-free-ocr.sh",
    );
  }

  const rendered = await listPngs(input.pagesDir);
  const limit =
    input.maxPages && input.maxPages > 0
      ? Math.min(input.maxPages, rendered.length)
      : rendered.length;

  const normalized: string[] = [];
  for (let i = 0; i < limit; i += 1) {
    const source = path.join(input.pagesDir, rendered[i]!);
    const target = path.join(input.pagesDir, `page${padPage(i + 1)}.png`);
    if (source !== target) {
      await rename(source, target);
    }
    normalized.push(target);
  }

  // Remove any leftover raw-* files beyond the limit
  for (const file of await listPngs(input.pagesDir)) {
    if (!/^page\d{3}\.png$/i.test(file)) {
      const { unlink } = await import("node:fs/promises");
      await unlink(path.join(input.pagesDir, file));
    }
  }

  if (normalized.length === 0) {
    throw new Error("PDF render produced no PNG pages");
  }

  return normalized;
}

export async function runPaddleOcrOnPages(input: {
  pagePngPaths: string[];
  ocrDir: string;
  pythonPath: string;
  paddleScriptPath: string;
}): Promise<PaddleOcrPageResult[]> {
  await mkdir(input.ocrDir, { recursive: true });

  try {
    await access(input.pythonPath);
  } catch {
    throw new Error(
      `Python venv not found at ${input.pythonPath}.\n` +
        `Run: bash scripts/install-free-ocr.sh`,
    );
  }

  if (input.pagePngPaths.length === 0) {
    return [];
  }

  // One Python process loads models once, then OCRs every page (much faster on CPU).
  console.log(
    `  Loading PaddleOCR once for ${input.pagePngPaths.length} page(s)…`,
  );
  const startedAll = Date.now();

  let stdout = "";
  try {
    const result = await execFileAsync(
      input.pythonPath,
      [input.paddleScriptPath, ...input.pagePngPaths],
      {
        maxBuffer: 64 * 1024 * 1024,
        env: {
          ...process.env,
          PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK: "True",
          FLAGS_minloglevel: "2",
          GLOG_minloglevel: "2",
          PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH ?? ""}`,
        },
      },
    );
    stdout = result.stdout;
  } catch (error: unknown) {
    const err = error as { stdout?: string };
    if (err.stdout) {
      stdout = err.stdout;
    } else {
      throw error;
    }
  }

  const lines = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("{"));

  const byIndex = new Map<
    number,
    { text: string; confidence: number | null; error?: string }
  >();

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as {
        pageIndex?: number;
        text?: string;
        confidence?: number | null;
        error?: string;
      };
      const idx =
        typeof parsed.pageIndex === "number" ? parsed.pageIndex : byIndex.size;
      byIndex.set(idx, {
        text: parsed.text ?? "",
        confidence:
          typeof parsed.confidence === "number" ? parsed.confidence : null,
        error: parsed.error,
      });
    } catch {
      // ignore non-JSON noise from paddle logs
    }
  }

  const results: PaddleOcrPageResult[] = [];
  const perPageMs = Math.max(
    1,
    Math.round((Date.now() - startedAll) / input.pagePngPaths.length),
  );

  for (let i = 0; i < input.pagePngPaths.length; i += 1) {
    const pageNumber = i + 1;
    const parsed = byIndex.get(i);
    const meta: PaddleOcrPageResult = {
      page: pageNumber,
      confidence: parsed?.confidence ?? null,
      processingTime: perPageMs,
      provider: "PaddleOCR",
      text: parsed?.text ?? "",
      error:
        parsed?.error ??
        (parsed ? undefined : "No OCR result returned for this page"),
    };
    await writePageArtifacts(input.ocrDir, pageNumber, meta);
    results.push(meta);
    if (meta.error && !meta.text) {
      console.error(`  page ${pageNumber}: FAILED — ${meta.error}`);
    } else {
      console.log(
        `  page ${pageNumber}: chars=${meta.text.length} conf=${meta.confidence ?? "n/a"}`,
      );
    }
  }

  return results;
}

async function writePageArtifacts(
  ocrDir: string,
  pageNumber: number,
  meta: PaddleOcrPageResult,
): Promise<void> {
  const stem = `page${padPage(pageNumber)}`;
  await writeFile(path.join(ocrDir, `${stem}.txt`), meta.text, "utf8");
  await writeFile(
    path.join(ocrDir, `${stem}.json`),
    JSON.stringify(
      {
        page: pageNumber,
        confidence: meta.confidence,
        processingTime: meta.processingTime,
        provider: "PaddleOCR" as const,
        ...(meta.error ? { error: meta.error } : {}),
      },
      null,
      2,
    ),
    "utf8",
  );
}

export function buildFreeOcrReport(input: {
  bookLabel: string;
  pdfRelativePath: string;
  results: PaddleOcrPageResult[];
  lowConfidenceThreshold?: number;
}): string {
  const threshold = input.lowConfidenceThreshold ?? 0.7;
  const total = input.results.length;
  const totalTimeMs = input.results.reduce((s, r) => s + r.processingTime, 0);
  const withConf = input.results.filter((r) => typeof r.confidence === "number");
  const avgConf =
    withConf.length > 0
      ? withConf.reduce((s, r) => s + (r.confidence ?? 0), 0) / withConf.length
      : null;
  const low = input.results.filter(
    (r) =>
      Boolean(r.error) ||
      (typeof r.confidence === "number" && r.confidence < threshold) ||
      (!r.error && !r.text.trim()),
  );
  const failed = input.results.filter((r) => Boolean(r.error));

  const lines = [
    `# Free OCR Experiment Report — ${input.bookLabel}`,
    ``,
    `> Experimental only. Does not affect the production Knowledge Engine.`,
    ``,
    `## Source`,
    ``,
    `- PDF: \`${input.pdfRelativePath}\``,
    `- Provider: PaddleOCR`,
    `- Generated: ${new Date().toISOString()}`,
    ``,
    `## Summary`,
    ``,
    `| Metric | Value |`,
    `| --- | --- |`,
    `| Total pages | ${total} |`,
    `| OCR time (sum) | ${(totalTimeMs / 1000).toFixed(1)}s |`,
    `| Average confidence | ${avgConf === null ? "n/a" : avgConf.toFixed(3)} |`,
    `| Low confidence / empty (< ${threshold}) | ${low.length} |`,
    `| Failed | ${failed.length} |`,
    ``,
    `## Pages with low confidence or empty text`,
    ``,
  ];

  if (low.length === 0) {
    lines.push(`None.`);
  } else {
    lines.push(`| Page | Confidence | Notes |`);
    lines.push(`| --- | --- | --- |`);
    for (const r of low) {
      const note = r.error
        ? `error: ${r.error}`
        : !r.text.trim()
          ? "empty text"
          : "low confidence";
      lines.push(
        `| ${r.page} | ${r.confidence ?? "n/a"} | ${note.replace(/\|/g, "/")} |`,
      );
    }
  }

  lines.push(``, `## Failed pages`, ``);
  if (failed.length === 0) {
    lines.push(`None.`);
  } else {
    for (const r of failed) {
      lines.push(`- Page ${r.page}: ${r.error}`);
    }
  }

  lines.push(
    ``,
    `## Output layout`,
    ``,
    `- \`pages/pageNNN.png\` — rendered page images`,
    `- \`ocr/pageNNN.txt\` — raw OCR text`,
    `- \`ocr/pageNNN.json\` — confidence / timing metadata`,
    ``,
    `## Compare with PDF`,
    ``,
    `1. Open \`knowledge/books/original/Unit 2.pdf\` in Preview.`,
    `2. Open the matching PNG under \`pages/\` (same page number).`,
    `3. Open the matching \`.txt\` under \`ocr/\`.`,
    `4. Judge Arabic/Urdu recognition quality against the scan.`,
    ``,
  );

  return lines.join("\n");
}

export async function runPaddleOcrExperiment(
  options: PaddleOcrExperimentOptions,
): Promise<{
  pagesDir: string;
  ocrDir: string;
  reportPath: string;
  results: PaddleOcrPageResult[];
}> {
  const pagesDir = path.join(options.experimentRoot, "pages");
  const ocrDir = path.join(options.experimentRoot, "ocr");
  await mkdir(options.experimentRoot, { recursive: true });

  console.log("Rendering PDF pages…");
  const pagePngPaths = await renderPdfPagesToPng({
    pdfAbsolutePath: options.pdfAbsolutePath,
    pagesDir,
    maxPages: options.maxPages,
  });
  console.log(`Rendered ${pagePngPaths.length} pages → ${pagesDir}`);

  const projectRoot = path.resolve(options.experimentRoot, "../../../..");
  const pythonPath =
    options.pythonPath ??
    path.join(projectRoot, ".venv-free-ocr", "bin", "python");
  const paddleScriptPath =
    options.paddleScriptPath ??
    path.join(projectRoot, "scripts", "free-ocr-paddle.py");

  console.log("Running PaddleOCR…");
  const results = await runPaddleOcrOnPages({
    pagePngPaths,
    ocrDir,
    pythonPath,
    paddleScriptPath,
  });

  const report = buildFreeOcrReport({
    bookLabel: "Unit 2",
    pdfRelativePath: "knowledge/books/original/Unit 2.pdf",
    results,
  });
  const reportPath = path.join(options.experimentRoot, "report.md");
  await writeFile(reportPath, report, "utf8");
  console.log(`Report → ${reportPath}`);

  return { pagesDir, ocrDir, reportPath, results };
}
