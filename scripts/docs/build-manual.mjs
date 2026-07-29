/**
 * Build polished HTML + PDF user manual from docs/images screenshots.
 *
 * Usage: pnpm docs:manual
 */

import { chromium } from "playwright";
import { mkdir, writeFile, access } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const IMG = path.join(ROOT, "docs", "images");
const OUT_HTML = path.join(ROOT, "docs", "manual", "user-manual.html");
const OUT_PDF = path.join(ROOT, "docs", "Quran-Learning-System-User-Manual.pdf");

const LIVE = "https://iqra-quran-learning-eight.vercel.app";
const APK = `${LIVE}/downloads/iqra-quran-learning.apk`;
const REPO = "https://github.com/baheesa/iqra-quran-learning";
const HELP = `${LIVE}/help`;
const README = `${REPO}#readme`;
const PDF_ON_GITHUB = `${REPO}/blob/main/docs/Quran-Learning-System-User-Manual.pdf`;

/** @typedef {{ id: string, title: string, html: string, images: { file: string, caption: string }[] }} Section */

/** @type {Section[]} */
const SECTIONS = [
  {
    id: "links",
    title: "Quick Links",
    html: `
      <p>Use these links anytime (they stay clickable in the PDF):</p>
      <ul class="link-list">
        <li><a href="${LIVE}">Live web app</a> — open Iqra in the browser</li>
        <li><a href="${APK}">Download Android APK</a> — offline mushaf + curriculum</li>
        <li><a href="${HELP}">In-app help</a> — short how-to inside the app</li>
        <li><a href="${REPO}">GitHub repository</a> — source code</li>
        <li><a href="${README}">README on GitHub</a> — full app guide with screenshots</li>
        <li><a href="${PDF_ON_GITHUB}">This PDF on GitHub</a></li>
      </ul>`,
    images: [],
  },
  {
    id: "getting-started",
    title: "Getting Started",
    html: `
      <p>Open the <a href="${LIVE}">live app</a> or install the
      <a href="${APK}">Android APK</a>. Start on Home to see your progress, then
      open Quran for a short reading session. Progress (tapped words, memorized
      duas, pages visited) stays on this device.</p>
      <p>Suggested first session: Home → Read Quran (15–20 minutes) → tap only
      unfamiliar words → optionally check <a href="${LIVE}/vocabulary">My words</a>.</p>`,
    images: [
      { file: "home-light.png", caption: "Home — progress overview (light mode)" },
      { file: "home-dark.png", caption: "Home — same surface in dark mode" },
    ],
  },
  {
    id: "reader",
    title: "Quran Reader & Word Tips",
    html: `
      <p>Open <a href="${LIVE}/quran">Read Quran</a>. The mushaf stays at the
      center. Read a page, then tap only the words you do not recognize. A short
      Urdu tip appears on that word. Tap elsewhere to dismiss.</p>`,
    images: [
      { file: "reader-mid-page.png", caption: "Quran reader mid-page" },
      { file: "reader-word-tap.png", caption: "Word tap — Urdu meaning tip" },
    ],
  },
  {
    id: "vocabulary",
    title: "My Words (Vocabulary List)",
    html: `
      <p>Words you tap while reading can be reviewed later in
      <a href="${LIVE}/vocabulary">My words</a>. Use this list to strengthen
      recognition without opening a full translation book.</p>`,
    images: [
      { file: "vocabulary-list.png", caption: "Saved vocabulary with sample words" },
    ],
  },
  {
    id: "search",
    title: "Search & View All Ayahs",
    html: `
      <p>From the reader toolbar, search in Arabic or Urdu. Preview matches, then
      open <strong>View all</strong> to see every listed ayah and jump back into
      the mushaf. Try it on the <a href="${LIVE}/quran?page=1">reader</a>.</p>`,
    images: [
      { file: "search-results.png", caption: "Search results preview" },
      { file: "search-view-all.png", caption: "View all matching ayahs" },
    ],
  },
  {
    id: "qawaid",
    title: "Qawaid (Rules)",
    html: `
      <p>Short patterns from Muallim-ul-Quran on
      <a href="${LIVE}/rules">Qawaid</a>. Each rule has a brief definition and
      examples. Tap example words for tips when available.</p>`,
    images: [{ file: "qawaid-rule.png", caption: "Qawaid — rule with examples" }],
  },
  {
    id: "words",
    title: "Unit Words",
    html: `
      <p>Browse vocabulary from Muallim Units 1–7 on
      <a href="${LIVE}/curriculum">Unit words</a>. Mark words familiar as you
      recognize them in real reading.</p>`,
    images: [{ file: "words-section.png", caption: "Unit Words section" }],
  },
  {
    id: "ayahs",
    title: "Unit Ayahs",
    html: `
      <p>Practice curriculum ayahs on <a href="${LIVE}/ayahs">Unit ayahs</a>.
      Tap Arabic for tips and mark items familiar when ready.</p>`,
    images: [{ file: "ayahs-section.png", caption: "Unit Ayahs section" }],
  },
  {
    id: "duas-daily",
    title: "Daily Duas",
    html: `
      <p>Masnoon and daily duas for regular practice on
      <a href="${LIVE}/duas">Duas</a>. Read calmly; use tips on Arabic when you
      need them.</p>`,
    images: [{ file: "duas-daily.png", caption: "Daily duas" }],
  },
  {
    id: "duas-quranic",
    title: "Quranic Duas by Juz",
    html: `
      <p>On <a href="${LIVE}/duas">Duas</a>, choose Qur’anic duas and filter by
      juz for structured memorization. Mark memorized when you know them, and
      open the mushaf page when linked.</p>`,
    images: [
      { file: "duas-quranic-juz.png", caption: "Quranic duas filtered by juz" },
    ],
  },
  {
    id: "theme",
    title: "Dark & Light Mode",
    html: `
      <p>Switch theme from the header toggle on the
      <a href="${LIVE}">home page</a>. Choose the mode that is easiest on your
      eyes during evening or daytime reading.</p>`,
    images: [
      { file: "theme-light.png", caption: "Light mode" },
      { file: "theme-dark.png", caption: "Dark mode" },
    ],
  },
  {
    id: "progress",
    title: "Progress on Home",
    html: `
      <p><a href="${LIVE}">Home</a> is the progress surface: pages visited, unit
      word/ayah progress, memorized duas, and a short daily recognition practice.
      There is no separate quiz dashboard — the journey stays calm and
      reading-first.</p>`,
    images: [
      { file: "dashboard-light.png", caption: "Progress cards on Home" },
    ],
  },
  {
    id: "apk",
    title: "Android APK (Offline)",
    html: `
      <p>For phone use without relying on the web server:</p>
      <p class="cta"><a class="btn" href="${APK}">Download Iqra APK</a></p>
      <p>After install, mushaf and curriculum data are bundled on the device.
      Progress stays local. No ads. Build steps and more detail are in the
      <a href="${README}">README</a>.</p>`,
    images: [],
  },
];

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

function imgSrc(file) {
  return path.join(IMG, file);
}

async function buildHtml() {
  await mkdir(path.dirname(OUT_HTML), { recursive: true });

  const toc = SECTIONS.map(
    (s, i) =>
      `<li><a href="#${s.id}">${i + 1}. ${escapeHtml(s.title)}</a></li>`,
  ).join("\n");

  const body = [];
  for (const s of SECTIONS) {
    const figs = [];
    for (const im of s.images) {
      const full = imgSrc(im.file);
      if (!(await exists(full))) {
        console.warn("missing image", im.file);
        continue;
      }
      figs.push(`
        <figure class="shot">
          <img src="${pathToFileUrl(full)}" alt="${escapeHtml(im.caption)}" />
          <figcaption>${escapeHtml(im.caption)}</figcaption>
        </figure>`);
    }
    body.push(`
      <section class="section" id="${s.id}">
        <h2>${escapeHtml(s.title)}</h2>
        <div class="prose">${s.html}
        <div class="shots">${figs.join("\n")}</div>
        </div>
      </section>`);
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Iqra — Quran Learning System User Manual</title>
  <style>
    :root {
      --green: #1e4a38;
      --green-soft: #e8f2ec;
      --ink: #1a1f1c;
      --muted: #5c6b63;
      --border: #d5e0d9;
      --paper: #fbfcfa;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      color: var(--ink);
      background: var(--paper);
      line-height: 1.55;
      font-size: 12.5pt;
    }
    a { color: var(--green); text-decoration: underline; text-underline-offset: 2px; }
    a:hover { color: #16382b; }
    .page {
      max-width: 820px;
      margin: 0 auto;
      padding: 36px 40px 64px;
    }
    .cover {
      min-height: 88vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 48px 24px;
      border-bottom: 1px solid var(--border);
      page-break-after: always;
    }
    .cover .badge {
      display: inline-block;
      background: var(--green-soft);
      color: var(--green);
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 11pt;
      font-weight: 600;
      margin-bottom: 18px;
    }
    .cover h1 {
      font-size: 34pt;
      line-height: 1.15;
      color: var(--green);
      margin: 0 0 12px;
    }
    .cover .tagline {
      font-size: 14pt;
      color: var(--muted);
      max-width: 34em;
    }
    .cover-links {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 28px;
    }
    .cover-links a.btn,
    a.btn {
      display: inline-block;
      background: var(--green);
      color: #fff !important;
      text-decoration: none;
      padding: 10px 16px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 11pt;
    }
    .cover-links a.btn-outline {
      display: inline-block;
      background: transparent;
      color: var(--green) !important;
      border: 1.5px solid var(--green);
      text-decoration: none;
      padding: 9px 15px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 11pt;
    }
    .cover .meta {
      margin-top: 28px;
      font-size: 10.5pt;
      color: var(--muted);
    }
    .toc {
      page-break-after: always;
      padding-top: 24px;
    }
    .toc h2 { color: var(--green); }
    .toc ol { padding-left: 1.2em; }
    .toc li { margin: 0.35em 0; }
    .toc a { color: var(--ink); text-decoration: none; }
    .section {
      page-break-before: always;
      padding-top: 8px;
    }
    .section h2 {
      color: var(--green);
      font-size: 18pt;
      margin: 0 0 10px;
      border-bottom: 2px solid var(--green-soft);
      padding-bottom: 8px;
    }
    .prose p { margin: 0 0 12px; max-width: 62ch; }
    .prose ul.link-list {
      margin: 8px 0 16px;
      padding-left: 1.2em;
    }
    .prose ul.link-list li { margin: 0.45em 0; }
    .cta { margin: 14px 0 16px; }
    .shots {
      display: grid;
      gap: 18px;
      margin-top: 8px;
    }
    figure.shot {
      margin: 0;
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      background: #fff;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    figure.shot img {
      display: block;
      width: 100%;
      height: auto;
    }
    figcaption {
      padding: 10px 12px;
      font-size: 10pt;
      color: var(--muted);
      background: var(--green-soft);
    }
    @page {
      size: A4;
      margin: 16mm 14mm 18mm;
    }
  </style>
</head>
<body>
  <div class="page">
    <header class="cover">
      <div class="badge">User Manual</div>
      <h1>Iqra</h1>
      <p class="tagline">Learn to understand the Quran word by word — recognition first, calm daily reading, Muallim-ul-Quran units.</p>
      <div class="cover-links">
        <a class="btn" href="${LIVE}">Open live app</a>
        <a class="btn" href="${APK}">Download Android APK</a>
        <a class="btn-outline" href="${HELP}">In-app help</a>
        <a class="btn-outline" href="${REPO}">GitHub</a>
        <a class="btn-outline" href="${README}">Full README</a>
      </div>
      <p class="meta">
        Live: <a href="${LIVE}">${LIVE}</a><br/>
        APK: <a href="${APK}">${APK}</a><br/>
        Source: <a href="${REPO}">${REPO}</a><br/>
        Generated: ${new Date().toISOString().slice(0, 10)}
      </p>
    </header>

    <nav class="toc">
      <h2>Contents</h2>
      <ol>${toc}</ol>
      <p style="margin-top:18px;font-size:11pt;color:var(--muted);">
        Prefer the web write-up? See the
        <a href="${README}">README on GitHub</a>
        (screenshots + setup). Prefer the phone? 
        <a href="${APK}">Download the APK</a>.
      </p>
    </nav>

    ${body.join("\n")}
  </div>
</body>
</html>`;

  await writeFile(OUT_HTML, html, "utf8");
  console.log("HTML →", path.relative(ROOT, OUT_HTML));
  return OUT_HTML;
}

function pathToFileUrl(p) {
  const resolved = path.resolve(p);
  if (process.platform === "win32") {
    return "file:///" + resolved.replace(/\\/g, "/");
  }
  return "file://" + resolved;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function buildPdf(htmlPath) {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  await page.goto(pathToFileUrl(htmlPath), { waitUntil: "networkidle" });
  await page.pdf({
    path: OUT_PDF,
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size:9px;width:100%;padding:4px 12mm 0;color:#5c6b63;font-family:system-ui,sans-serif;">Iqra — Quran Learning System · <span style="color:#1e4a38;">${LIVE.replace("https://", "")}</span></div>`,
    footerTemplate: `<div style="font-size:9px;width:100%;padding:0 12mm;color:#5c6b63;font-family:system-ui,sans-serif;display:flex;justify-content:space-between;"><span>User Manual</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
    margin: { top: "18mm", bottom: "18mm", left: "12mm", right: "12mm" },
  });
  await browser.close();
  console.log("PDF →", path.relative(ROOT, OUT_PDF));
}

const htmlPath = await buildHtml();
await buildPdf(htmlPath);
