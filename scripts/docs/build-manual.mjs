/**
 * Build polished HTML + PDF user manual (README-matched style).
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
const GENERATED = new Date().toISOString().slice(0, 10);

/** @typedef {{ id: string, icon: string, title: string, html: string, images: { file: string, caption: string }[], pair?: boolean }} Section */

/** @type {Section[]} */
const SECTIONS = [
  {
    id: "links",
    icon: "🔗",
    title: "Quick links",
    html: `
      <p>Every link below is clickable in this PDF.</p>
      <div class="link-grid">
        <a class="link-card" href="${LIVE}"><span class="ic">🌐</span><span><strong>Live web app</strong><em>Open Iqra in the browser</em></span></a>
        <a class="link-card" href="${APK}"><span class="ic">📱</span><span><strong>Android APK</strong><em>Offline mushaf + curriculum</em></span></a>
        <a class="link-card" href="${HELP}"><span class="ic">💬</span><span><strong>In-app help</strong><em>Short how-to inside the app</em></span></a>
        <a class="link-card" href="${REPO}"><span class="ic">📦</span><span><strong>GitHub</strong><em>Source code</em></span></a>
        <a class="link-card" href="${README}"><span class="ic">📝</span><span><strong>README</strong><em>Full guide with screenshots</em></span></a>
        <a class="link-card" href="${PDF_ON_GITHUB}"><span class="ic">📘</span><span><strong>This PDF</strong><em>On GitHub</em></span></a>
      </div>`,
    images: [],
  },
  {
    id: "why",
    icon: "✨",
    title: "Why Iqra?",
    html: `
      <p>Most learners juggle two books: the Arabic mushaf and a full Urdu translation.
      The eye drifts to Urdu. The Arabic never becomes familiar.</p>
      <p><strong>Iqra flips that.</strong></p>
      <div class="compare">
        <div class="compare-col">
          <h3>📖 Mushaf stays primary</h3>
          <ul>
            <li>Continuous Arabic, page by page</li>
            <li>No permanent translation column</li>
            <li>Grammar only when a pattern helps</li>
          </ul>
        </div>
        <div class="compare-col">
          <h3>💡 Tips stay quiet until you ask</h3>
          <ul>
            <li>One tap → one short Urdu tip on <em>that</em> word</li>
            <li>Tap away to dismiss</li>
            <li>Progress grows from real reading</li>
          </ul>
        </div>
      </div>
      <blockquote>The app succeeds when you need it <strong>less</strong> — when you can open a mushaf and recognize more of what you see.</blockquote>`,
    images: [],
  },
  {
    id: "getting-started",
    icon: "🚀",
    title: "Try it in 60 seconds",
    html: `
      <ol class="steps">
        <li>Open the <a href="${LIVE}">live app</a> — or <a href="${APK}">install the APK</a> for offline phone use</li>
        <li>From <strong>Home</strong>, continue into the mushaf</li>
        <li>Read a few lines · tap one unfamiliar word</li>
        <li>Later, open <a href="${LIVE}/vocabulary">My words</a> — that tip is waiting for you</li>
      </ol>
      <p class="note">A good daily session is <strong>15–20 minutes</strong>: read → tap only when unsure → optionally revise one list.</p>`,
    images: [
      { file: "home-light.png", caption: "Home — resume reading, recognize, and progress" },
      { file: "home-dark.png", caption: "Same Home surface in dark mode" },
    ],
    pair: true,
  },
  {
    id: "reader",
    icon: "📖",
    title: "Quran reader & word tips",
    html: `
      <p>Open <a href="${LIVE}/quran">Read Quran</a>. Indo-Pak script, page / juz / surah jump,
      font size, bookmarks, last page remembered. Tools stay in the toolbar — the page stays clean.</p>
      <p><strong>Word tips:</strong> tap a word → short Urdu tip on that word. Tap elsewhere → gone.
      Optional full-ayah Urdu exists on demand — recognition first, translation second.</p>`,
    images: [
      { file: "reader-mid-page.png", caption: "Quran reader — mushaf stays center stage" },
      { file: "reader-word-tap.png", caption: "Word tip — Urdu meaning on the tapped word" },
    ],
    pair: true,
  },
  {
    id: "vocabulary",
    icon: "❤️",
    title: "My words",
    html: `
      <p>Useful taps become a personal review list on
      <a href="${LIVE}/vocabulary">My words</a> — vocabulary you met <em>in the mushaf</em>,
      not a random word bank.</p>`,
    images: [
      { file: "vocabulary-list.png", caption: "My words — saved tips with tap counts" },
    ],
  },
  {
    id: "search",
    icon: "🔎",
    title: "Search & View all",
    html: `
      <p>From the reader toolbar, search Arabic or Urdu. Preview matches, then open
      <strong>View all</strong> for every listed ayah and jump straight back into the mushaf.
      Try it on the <a href="${LIVE}/quran?page=1">reader</a>.</p>`,
    images: [
      { file: "search-results.png", caption: "Search preview with form chips" },
      { file: "search-view-all.png", caption: "View all matching ayahs" },
    ],
    pair: true,
  },
  {
    id: "qawaid",
    icon: "📐",
    title: "Qawaid (rules)",
    html: `
      <p>Short patterns from Muallim-ul-Quran on <a href="${LIVE}/rules">Qawaid</a>.
      Each rule has a brief definition and Quran examples. Tap example words for tips when available.
      Grammar only when it helps recognition.</p>`,
    images: [{ file: "qawaid-rule.png", caption: "Qawaid — rule with examples" }],
  },
  {
    id: "curriculum",
    icon: "🧩",
    title: "Unit words & ayahs",
    html: `
      <p>Browse Muallim Units 1–7 on <a href="${LIVE}/curriculum">Unit words</a> and
      <a href="${LIVE}/ayahs">Unit ayahs</a>. Mark items familiar when recognition sticks.
      Tap Arabic for tips; open the related mushaf page when linked.</p>`,
    images: [
      { file: "words-section.png", caption: "Unit words" },
      { file: "ayahs-section.png", caption: "Unit ayahs" },
    ],
    pair: true,
  },
  {
    id: "duas",
    icon: "🤲",
    title: "Duas",
    html: `
      <p>On <a href="${LIVE}/duas">Duas</a>: daily / masnoon duas for ordinary moments,
      and Qur’anic duas organized by <strong>juz</strong>. Mark memorized when you know them;
      the book icon opens the mushaf. Progress appears on Home.</p>`,
    images: [
      { file: "duas-daily.png", caption: "Daily / masnoon duas" },
      { file: "duas-quranic-juz.png", caption: "Qur’anic duas filtered by juz" },
    ],
    pair: true,
  },
  {
    id: "theme",
    icon: "🌙",
    title: "Dark & light mode",
    html: `
      <p>Toggle from the header on <a href="${LIVE}">Home</a>.
      Same calm surface — pick what’s easiest on your eyes for day or evening reading.</p>`,
    images: [
      { file: "theme-light.png", caption: "Light mode" },
      { file: "theme-dark.png", caption: "Dark mode" },
    ],
    pair: true,
  },
  {
    id: "progress",
    icon: "📊",
    title: "Progress — without quiz theater",
    html: `
      <p><a href="${LIVE}">Home</a> tracks pages visited, unit progress, memorized duas,
      and a short recognition practice. No streaks to game. No separate quiz dashboard.
      Just a calm place to continue.</p>`,
    images: [
      { file: "dashboard-light.png", caption: "Progress cards on Home" },
    ],
  },
  {
    id: "learn",
    icon: "🌱",
    title: "How to learn with it",
    html: `
      <div class="compare">
        <div class="compare-col good">
          <h3>✅ Do this</h3>
          <ul>
            <li>Read first · tap only what you don’t know</li>
            <li>Use tips to <em>confirm</em>, not replace thinking</li>
            <li>Revisit pages until forms feel familiar</li>
            <li>Open Qawaid when a pattern keeps repeating</li>
          </ul>
        </div>
        <div class="compare-col bad">
          <h3>🚫 Skip this</h3>
          <ul>
            <li>Treating the app like a translation book</li>
            <li>Collecting tips instead of reading</li>
            <li>Making grammar the main activity</li>
          </ul>
        </div>
      </div>
      <p class="flow">Reading → Recognition → Understanding → Practice → Reflection → Revision</p>
      <p>Iqra is <strong>not</strong> a chatbot, translation app, grammar course, quiz game, or social network.
      The Quran stays center stage. Muallim-ul-Quran is the source. Tips only help recognition.</p>`,
    images: [],
  },
  {
    id: "platforms",
    icon: "🌐",
    title: "Web vs Android",
    html: `
      <table class="platform">
        <thead>
          <tr><th></th><th>🌐 Web</th><th>📱 Android APK</th></tr>
        </thead>
        <tbody>
          <tr><td>Get it</td><td><a href="${LIVE}">Open demo</a></td><td><a href="${APK}">Download APK</a></td></tr>
          <tr><td>Mushaf + tips</td><td>Yes</td><td>Yes — bundled on device</td></tr>
          <tr><td>Qawaid · words · ayahs · duas</td><td>Yes</td><td>Yes</td></tr>
          <tr><td>Offline</td><td>Limited</td><td>Full</td></tr>
          <tr><td>Progress</td><td>Browser storage</td><td>On-device storage</td></tr>
          <tr><td>Ads</td><td>None</td><td>None</td></tr>
        </tbody>
      </table>
      <p class="cta"><a class="btn" href="${APK}">📱 Download Iqra APK</a>
      <a class="btn-outline" href="${LIVE}">🌐 Open live app</a></p>
      <p class="note">If Android asks, allow install from your browser. More setup detail lives in the
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

async function renderShots(images, pair) {
  const figs = [];
  for (const im of images) {
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
  if (!figs.length) return "";
  return `<div class="shots ${pair && figs.length > 1 ? "shots-pair" : ""}">${figs.join("\n")}</div>`;
}

async function buildHtml() {
  await mkdir(path.dirname(OUT_HTML), { recursive: true });

  const toc = SECTIONS.map(
    (s, i) =>
      `<li><a href="#${s.id}"><span class="toc-ic">${s.icon}</span> ${i + 1}. ${escapeHtml(s.title)}</a></li>`,
  ).join("\n");

  const body = [];
  for (const s of SECTIONS) {
    const shots = await renderShots(s.images, s.pair);
    body.push(`
      <section class="section" id="${s.id}">
        <h2><span class="h-ic">${s.icon}</span> ${escapeHtml(s.title)}</h2>
        <div class="prose">${s.html}${shots}</div>
      </section>`);
  }

  const coverHero = (await exists(imgSrc("theme-light.png")))
    ? pathToFileUrl(imgSrc("theme-light.png"))
    : "";
  const coverHeroDark = (await exists(imgSrc("theme-dark.png")))
    ? pathToFileUrl(imgSrc("theme-dark.png"))
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Iqra — User Manual</title>
  <style>
    :root {
      --green: #1e4a38;
      --green-mid: #2d6a4f;
      --green-soft: #e8f2ec;
      --green-wash: #f3f8f5;
      --ink: #1a1f1c;
      --muted: #5c6b63;
      --border: #d5e0d9;
      --paper: #fbfcfa;
      --white: #ffffff;
      --danger-soft: #f8ecec;
      --good-soft: #eaf6ee;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      color: var(--ink);
      background: var(--paper);
      line-height: 1.6;
      font-size: 11.5pt;
    }
    a { color: var(--green); text-decoration: underline; text-underline-offset: 2px; }
    .page { max-width: 860px; margin: 0 auto; padding: 28px 32px 56px; }

    /* Cover */
    .cover {
      min-height: 92vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 40px 20px 48px;
      page-break-after: always;
      position: relative;
    }
    .cover::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 80% 50% at 20% 0%, rgba(30,74,56,0.10), transparent 60%),
        radial-gradient(ellipse 60% 40% at 100% 20%, rgba(45,106,79,0.08), transparent 55%),
        linear-gradient(180deg, var(--green-wash), var(--paper) 70%);
      border-radius: 0;
      z-index: 0;
    }
    .cover > * { position: relative; z-index: 1; }
    .pill-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 22px; }
    .pill {
      display: inline-block;
      background: var(--green);
      color: #fff;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 9.5pt;
      font-weight: 650;
      letter-spacing: 0.02em;
    }
    .pill.soft {
      background: var(--green-soft);
      color: var(--green);
    }
    .cover h1 {
      font-size: 42pt;
      line-height: 1.05;
      color: var(--green);
      margin: 0 0 10px;
      letter-spacing: -0.02em;
    }
    .cover .subtitle {
      font-size: 15pt;
      color: var(--ink);
      font-weight: 550;
      margin: 0 0 10px;
      max-width: 22em;
    }
    .cover .tagline {
      font-size: 12pt;
      color: var(--muted);
      max-width: 36em;
      margin: 0 0 8px;
    }
    .cover .audience {
      font-size: 10.5pt;
      color: var(--muted);
      margin: 0 0 22px;
    }
    .cover-links { display: flex; flex-wrap: wrap; gap: 10px; margin: 8px 0 24px; }
    a.btn, .btn {
      display: inline-block;
      background: var(--green);
      color: #fff !important;
      text-decoration: none !important;
      padding: 11px 16px;
      border-radius: 11px;
      font-weight: 650;
      font-size: 10.5pt;
    }
    a.btn-outline, .btn-outline {
      display: inline-block;
      background: transparent;
      color: var(--green) !important;
      border: 1.5px solid var(--green);
      text-decoration: none !important;
      padding: 10px 15px;
      border-radius: 11px;
      font-weight: 650;
      font-size: 10.5pt;
    }
    .cover-shots {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 8px;
    }
    .cover-shots img {
      width: 100%;
      border-radius: 12px;
      border: 1px solid var(--border);
      box-shadow: 0 8px 24px rgba(30,74,56,0.08);
    }
    .cover .meta {
      margin-top: 22px;
      font-size: 9.5pt;
      color: var(--muted);
      line-height: 1.7;
    }

    /* TOC */
    .toc {
      page-break-after: always;
      padding-top: 12px;
    }
    .toc h2 {
      color: var(--green);
      font-size: 22pt;
      margin: 0 0 6px;
    }
    .toc .lead { color: var(--muted); margin: 0 0 18px; font-size: 11pt; }
    .toc ol { padding-left: 0; list-style: none; margin: 0; }
    .toc li {
      margin: 0;
      border-bottom: 1px solid var(--border);
    }
    .toc a {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--ink);
      text-decoration: none;
      padding: 11px 4px;
      font-weight: 500;
    }
    .toc-ic { width: 1.6em; text-align: center; }
    .toc-foot {
      margin-top: 22px;
      padding: 14px 16px;
      background: var(--green-soft);
      border-radius: 12px;
      font-size: 10.5pt;
      color: var(--muted);
    }

    /* Sections */
    .section {
      page-break-before: always;
      padding-top: 4px;
    }
    .section h2 {
      color: var(--green);
      font-size: 18pt;
      margin: 0 0 14px;
      padding-bottom: 10px;
      border-bottom: 3px solid var(--green-soft);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .h-ic { font-size: 16pt; }
    .prose p { margin: 0 0 12px; max-width: 64ch; }
    .prose strong { color: var(--green); }

    blockquote {
      margin: 16px 0;
      padding: 14px 18px;
      background: var(--green-wash);
      border-left: 4px solid var(--green);
      border-radius: 0 12px 12px 0;
      color: var(--ink);
      font-size: 11.5pt;
    }

    .compare {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin: 14px 0 18px;
    }
    .compare-col {
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 14px 16px;
    }
    .compare-col.good { background: var(--good-soft); border-color: #c5e3d0; }
    .compare-col.bad { background: var(--danger-soft); border-color: #e5cfcf; }
    .compare-col h3 {
      margin: 0 0 8px;
      font-size: 11.5pt;
      color: var(--green);
    }
    .compare-col ul {
      margin: 0;
      padding-left: 1.15em;
      font-size: 10.5pt;
    }
    .compare-col li { margin: 0.35em 0; }

    .steps {
      margin: 8px 0 16px;
      padding-left: 1.25em;
    }
    .steps li { margin: 0.55em 0; }

    .note {
      background: var(--green-soft);
      border-radius: 12px;
      padding: 12px 14px;
      font-size: 10.5pt;
      color: var(--muted);
    }

    .flow {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 10pt;
      background: var(--ink);
      color: #e8f2ec;
      padding: 12px 14px;
      border-radius: 10px;
      text-align: center;
      letter-spacing: 0.01em;
    }

    .link-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 12px;
    }
    a.link-card {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      text-decoration: none !important;
      color: inherit;
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 12px 14px;
      break-inside: avoid;
    }
    a.link-card .ic { font-size: 16pt; line-height: 1; }
    a.link-card strong { display: block; color: var(--green); font-size: 11pt; }
    a.link-card em {
      display: block;
      font-style: normal;
      color: var(--muted);
      font-size: 9.5pt;
      margin-top: 2px;
    }

    table.platform {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 16px;
      font-size: 10.5pt;
    }
    table.platform th, table.platform td {
      border: 1px solid var(--border);
      padding: 10px 12px;
      text-align: left;
    }
    table.platform th {
      background: var(--green);
      color: #fff;
      font-weight: 600;
    }
    table.platform tr:nth-child(even) td { background: var(--green-wash); }

    .cta { margin: 16px 0; display: flex; flex-wrap: wrap; gap: 10px; }

    .shots {
      display: grid;
      gap: 16px;
      margin-top: 16px;
    }
    .shots-pair { grid-template-columns: 1fr 1fr; }
    figure.shot {
      margin: 0;
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      background: #fff;
      break-inside: avoid;
      page-break-inside: avoid;
      box-shadow: 0 4px 16px rgba(30,74,56,0.06);
    }
    figure.shot img { display: block; width: 100%; height: auto; }
    figcaption {
      padding: 9px 12px;
      font-size: 9.5pt;
      color: var(--muted);
      background: var(--green-soft);
    }

    .closing {
      page-break-before: always;
      text-align: center;
      padding: 64px 24px;
    }
    .closing h2 { color: var(--green); font-size: 22pt; margin: 0 0 10px; }
    .closing p { color: var(--muted); max-width: 36em; margin: 0 auto 20px; }

    @page { size: A4; margin: 14mm 12mm 16mm; }
  </style>
</head>
<body>
  <div class="page">
    <header class="cover">
      <div class="pill-row">
        <span class="pill">User Manual</span>
        <span class="pill soft">Recognition-first</span>
        <span class="pill soft">Muallim Units 1–7</span>
      </div>
      <h1>Iqra</h1>
      <p class="subtitle">Learn to understand the Quran — word by word, without living in a translation.</p>
      <p class="tagline">Open the mushaf → read calmly → tap only what you don’t know.
      A short Urdu tip appears on that word. Everything familiar stays out of the way.</p>
      <p class="audience">Built for Urdu speakers · curriculum from <strong>Muallim-ul-Quran</strong></p>
      <div class="cover-links">
        <a class="btn" href="${LIVE}">🌐 Open live app</a>
        <a class="btn" href="${APK}">📱 Download APK</a>
        <a class="btn-outline" href="${HELP}">💬 In-app help</a>
        <a class="btn-outline" href="${README}">📝 README</a>
        <a class="btn-outline" href="${REPO}">📦 GitHub</a>
      </div>
      ${
        coverHero
          ? `<div class="cover-shots">
              <img src="${coverHero}" alt="Home light mode" />
              <img src="${coverHeroDark}" alt="Home dark mode" />
            </div>`
          : ""
      }
      <p class="meta">
        Live: <a href="${LIVE}">${LIVE}</a><br/>
        APK: <a href="${APK}">${APK}</a><br/>
        Source: <a href="${REPO}">${REPO}</a><br/>
        Generated: ${GENERATED}
      </p>
    </header>

    <nav class="toc">
      <h2>Contents</h2>
      <p class="lead">A calm guide to reading, recognizing, and depending less on translation.</p>
      <ol>${toc}</ol>
      <p class="toc-foot">
        Prefer the web write-up? See the <a href="${README}">README on GitHub</a>.
        Prefer the phone? <a href="${APK}">Download the APK</a>.
      </p>
    </nav>

    ${body.join("\n")}

    <section class="closing">
      <h2>Keep the mushaf primary</h2>
      <p>Educational use · Built to help you depend on the app less over time.</p>
      <div class="cover-links" style="justify-content:center">
        <a class="btn" href="${LIVE}">🌐 Live app</a>
        <a class="btn" href="${APK}">📱 APK</a>
        <a class="btn-outline" href="${REPO}">📦 GitHub</a>
      </div>
    </section>
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
    headerTemplate: `<div style="font-size:8.5px;width:100%;padding:3px 11mm 0;color:#5c6b63;font-family:system-ui,sans-serif;display:flex;justify-content:space-between;"><span>Iqra · User Manual</span><span style="color:#1e4a38;">${LIVE.replace("https://", "")}</span></div>`,
    footerTemplate: `<div style="font-size:8.5px;width:100%;padding:0 11mm;color:#5c6b63;font-family:system-ui,sans-serif;display:flex;justify-content:space-between;"><span>Recognition-first · Muallim Units 1–7</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
    margin: { top: "16mm", bottom: "16mm", left: "11mm", right: "11mm" },
  });
  await browser.close();
  console.log("PDF →", path.relative(ROOT, OUT_PDF));
}

const htmlPath = await buildHtml();
await buildPdf(htmlPath);
