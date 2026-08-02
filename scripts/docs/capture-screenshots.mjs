/**
 * Docs screenshot capture for Iqra Quran Learning.
 *
 * Uses Playwright + system Chrome (channel: "chrome") because bundled
 * Chromium is unavailable on some macOS versions.
 *
 * Learner progress lives in localStorage (not Prisma) — we seed that.
 *
 * Usage:
 *   DOCS_BASE_URL=https://iqra-quran-learning-eight.vercel.app pnpm docs:screenshots
 *   # or against local: pnpm docs:screenshots (starts pnpm dev if needed)
 */

import { chromium } from "playwright";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { spawn } from "child_process";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = path.join(ROOT, "docs", "images");

const VIEWPORT = { width: 1280, height: 900 };
const DEFAULT_LIVE = "https://iqra-quran-learning-eight.vercel.app";

function nowIso() {
  return new Date().toISOString();
}

function buildSeed() {
  const tapped = [
    {
      id: "بسم",
      arabic: "بِسْمِ",
      meaning: "اللہ کے نام سے",
      tapCount: 4,
      firstTappedAt: "2026-07-20T10:00:00.000Z",
      lastTappedAt: "2026-07-28T12:00:00.000Z",
      lastSurahId: 1,
      lastAyahNumber: 1,
      lastPage: 1,
    },
    {
      id: "الله",
      arabic: "ٱللَّهِ",
      meaning: "اللہ",
      tapCount: 6,
      firstTappedAt: "2026-07-20T10:01:00.000Z",
      lastTappedAt: "2026-07-28T12:05:00.000Z",
      lastSurahId: 1,
      lastAyahNumber: 1,
      lastPage: 1,
    },
    {
      id: "الرحمن",
      arabic: "ٱلرَّحْمَٰنِ",
      meaning: "بے حد مہربان",
      tapCount: 3,
      firstTappedAt: "2026-07-21T09:00:00.000Z",
      lastTappedAt: "2026-07-27T18:00:00.000Z",
      lastSurahId: 1,
      lastAyahNumber: 1,
      lastPage: 1,
    },
    {
      id: "الرحيم",
      arabic: "ٱلرَّحِيمِ",
      meaning: "نہایت رحم والا",
      tapCount: 2,
      firstTappedAt: "2026-07-22T09:00:00.000Z",
      lastTappedAt: "2026-07-26T18:00:00.000Z",
      lastSurahId: 1,
      lastAyahNumber: 1,
      lastPage: 1,
    },
    {
      id: "الحمد",
      arabic: "ٱلْحَمْدُ",
      meaning: "تعریف",
      tapCount: 2,
      firstTappedAt: "2026-07-23T09:00:00.000Z",
      lastTappedAt: "2026-07-28T11:00:00.000Z",
      lastSurahId: 1,
      lastAyahNumber: 2,
      lastPage: 1,
    },
  ];

  const visited = Array.from({ length: 24 }, (_, i) => i + 1);
  const learnedWords = [
    "u1-word-ايات",
    "u1-word-ایت",
    "u1-word-ايه",
    "u1-word-ابقي",
    "u2-word-ان",
  ];
  const learnedAyahs = [
    "u1-ayah-ابراهيمواسحاق",
    "u1-ayah-ابراهيموموسي",
  ];
  const memorizedDuas = ["quran-1:5-7", "quran-2:126", "quran-2:201"];

  // Note: do NOT seed quran.ui.theme here — addInitScript runs on every
  // navigation/reload and would overwrite withTheme().
  return {
    "quran.learning.tappedWords": JSON.stringify(tapped),
    "quran.learning.learnedWordIds": JSON.stringify(learnedWords),
    "quran.learning.learnedAyahIds": JSON.stringify(learnedAyahs),
    "quran.learning.memorizedQuranicDuaIds": JSON.stringify(memorizedDuas),
    "quran.reading.visitedPages": JSON.stringify(visited),
    "quran.reading.bookmarks": JSON.stringify([
      {
        id: "bm-1",
        page: 1,
        title: "الفاتحة — صفحہ 1",
        createdAt: "2026-07-25T10:00:00.000Z",
      },
      {
        id: "bm-2",
        page: 2,
        title: "البقرة — صفحہ 2",
        createdAt: "2026-07-26T10:00:00.000Z",
      },
    ]),
    "quran.reading.position": JSON.stringify({
      page: 2,
      updatedAt: nowIso(),
    }),
    "quran.reading.fontScale": "1",
  };
}

async function waitForServer(url, timeoutMs = 120_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (res.ok || res.status === 500) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server not ready: ${url}`);
}

async function maybeStartDevServer() {
  if (process.env.DOCS_BASE_URL) {
    return { baseUrl: process.env.DOCS_BASE_URL.replace(/\/$/, ""), child: null };
  }
  // Prefer live demo if reachable; else local
  try {
    const res = await fetch(DEFAULT_LIVE, { redirect: "follow" });
    if (res.ok) {
      console.log("Using live demo:", DEFAULT_LIVE);
      return { baseUrl: DEFAULT_LIVE, child: null };
    }
  } catch {
    // fall through
  }

  console.log("Starting local pnpm dev…");
  const child = spawn("pnpm", ["dev"], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, AUTH_PROVIDER: "memory" },
  });
  child.stdout.on("data", (d) => process.stdout.write(`[dev] ${d}`));
  child.stderr.on("data", (d) => process.stderr.write(`[dev] ${d}`));
  const baseUrl = "http://127.0.0.1:3000";
  await waitForServer(baseUrl);
  return { baseUrl, child };
}

async function saveShot(buffer, filename) {
  const out = path.join(OUT_DIR, filename);
  // Keep truecolor (no palette) so Arabic/Urdu stays sharp in docs.
  const optimized = await sharp(buffer)
    .resize({ width: 1400, withoutEnlargement: true })
    .png({ compressionLevel: 8, palette: false })
    .toBuffer();
  await writeFile(out, optimized);
  console.log("wrote", path.relative(ROOT, out), `(${Math.round(optimized.length / 1024)}KB)`);
}

async function applyStorage(page, theme) {
  const seed = { ...buildSeed(), "quran.ui.theme": theme };
  await page.evaluate((data) => {
    for (const [k, v] of Object.entries(data)) {
      localStorage.setItem(k, v);
    }
  }, seed);
}

async function withTheme(page, theme) {
  await applyStorage(page, theme);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(
    (t) =>
      document.documentElement.classList.contains("dark") === (t === "dark"),
    theme,
    { timeout: 10_000 },
  );
  await page.waitForTimeout(350);
}

/** Load a route, then seed localStorage + reload so React + theme script pick it up. */
async function seedAndGoto(page, baseUrl, pathName, theme = "light") {
  await page.goto(`${baseUrl}${pathName}`, {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
  await applyStorage(page, theme);
  await page.reload({ waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForFunction(
    (t) =>
      document.documentElement.classList.contains("dark") === (t === "dark"),
    theme,
    { timeout: 10_000 },
  );
  await page.waitForTimeout(500);
}

async function capture() {
  await mkdir(OUT_DIR, { recursive: true });
  const { baseUrl, child } = await maybeStartDevServer();

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();

  try {
    // --- Home light/dark ---
    await seedAndGoto(page, baseUrl, "/", "light");
    await saveShot(await page.screenshot({ fullPage: false }), "home-light.png");
    await withTheme(page, "dark");
    await saveShot(await page.screenshot({ fullPage: false }), "home-dark.png");
    await saveShot(await page.screenshot({ fullPage: false }), "dashboard-dark.png");
    await withTheme(page, "light");
    await saveShot(await page.screenshot({ fullPage: false }), "dashboard-light.png");

    // --- Quran mid-page ---
    await seedAndGoto(page, baseUrl, "/quran?page=2", "light");
    await page.waitForSelector("[data-quran-word='true'], [data-word-id]", {
      timeout: 60_000,
    });
    await page.waitForTimeout(800);
    await saveShot(await page.screenshot({ fullPage: false }), "reader-mid-page.png");
    await withTheme(page, "dark");
    await page.waitForSelector("[data-quran-word='true']", { timeout: 60_000 });
    await saveShot(await page.screenshot({ fullPage: false }), "reader-mid-page-dark.png");

    // --- Word tap tip ---
    await withTheme(page, "light");
    const word = page.locator("[data-quran-word='true']").nth(2);
    await word.click();
    await page.waitForSelector("[role='tooltip']", { timeout: 20_000 });
    await page.waitForTimeout(900);
    await saveShot(await page.screenshot({ fullPage: false }), "reader-word-tap.png");
    await page.keyboard.press("Escape").catch(() => undefined);
    await page.mouse.click(10, 10);

    // --- Vocabulary ---
    await seedAndGoto(page, baseUrl, "/vocabulary", "light");
    await page.waitForTimeout(500);
    await saveShot(await page.screenshot({ fullPage: false }), "vocabulary-list.png");

    // --- Search + view all ---
    await seedAndGoto(page, baseUrl, "/quran?page=1", "light");
    await page.waitForSelector("[data-quran-word='true']", { timeout: 60_000 });
    await page.getByRole("button", { name: "Search Quran" }).click();
    const search = page.getByPlaceholder("Search Arabic, Urdu, or surah name/number…");
    await search.fill("رب العالمين");
    await page.waitForTimeout(1400);
    await saveShot(await page.screenshot({ fullPage: false }), "search-results.png");
    const viewAll = page.getByRole("button", { name: /View all/i });
    if (await viewAll.count()) {
      await viewAll.first().click();
      await page.waitForTimeout(1500);
      await saveShot(await page.screenshot({ fullPage: false }), "search-view-all.png");
    }

    // --- Qawaid ---
    await seedAndGoto(page, baseUrl, "/rules", "light");
    await page.waitForTimeout(800);
    const collapse = page.getByRole("button", { name: /Collapse examples/i });
    if (!(await collapse.count())) {
      const expand = page.getByRole("button", { name: /Expand examples|more examples|مزید/i });
      if (await expand.count()) {
        await expand.first().click().catch(() => undefined);
        await page.waitForTimeout(400);
      }
    }
    await saveShot(await page.screenshot({ fullPage: false }), "qawaid-rule.png");

    // --- Words ---
    await seedAndGoto(page, baseUrl, "/curriculum", "light");
    await page.waitForTimeout(700);
    await saveShot(await page.screenshot({ fullPage: false }), "words-section.png");

    // --- Ayahs ---
    await seedAndGoto(page, baseUrl, "/ayahs", "light");
    await page.waitForTimeout(700);
    await saveShot(await page.screenshot({ fullPage: false }), "ayahs-section.png");

    // --- Daily / masnoon duas (non-quranic category) ---
    await seedAndGoto(page, baseUrl, "/duas", "light");
    await page.waitForTimeout(700);
    const morning = page.getByRole("button", { name: /Morning|evening|Home & chores|Worship|Travel/i });
    if (await morning.count()) {
      await morning.first().click();
      await page.waitForTimeout(700);
    }
    await saveShot(await page.screenshot({ fullPage: false }), "duas-daily.png");

    // --- Quranic by juz ---
    const quranicChip = page.getByRole("button", { name: /Qur.?anic duas/i });
    if (await quranicChip.count()) {
      await quranicChip.first().click();
      await page.waitForTimeout(500);
    }
    const juzSelect = page.locator("select").filter({ hasText: /All juz|Juz/i }).first();
    if (await juzSelect.count()) {
      await juzSelect.selectOption({ label: /Juz 1/ }).catch(async () => {
        await juzSelect.selectOption("1");
      });
      await page.waitForTimeout(600);
    }
    await saveShot(await page.screenshot({ fullPage: false }), "duas-quranic-juz.png");

    // theme pair near top of README
    await seedAndGoto(page, baseUrl, "/", "light");
    await saveShot(await page.screenshot({ fullPage: false }), "theme-light.png");
    await withTheme(page, "dark");
    await saveShot(await page.screenshot({ fullPage: false }), "theme-dark.png");

    console.log("Screenshots complete → docs/images/");
  } finally {
    await browser.close();
    if (child) {
      child.kill("SIGTERM");
    }
  }
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
