#!/usr/bin/env bash
# Rebuild Quran search index + ayah cards into data/quran/ (web + offline source).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/data/quran"
DIR="$DEST/by-page"

node <<NODE
const fs = require("fs");
const path = require("path");
const dest = ${JSON.stringify("$DEST")};
const dir = ${JSON.stringify("$DIR")};
function norm(ar) {
  return ar
    .replace(/[\\u064B-\\u065F\\u0670\\u06D6-\\u06ED]/g, "")
    .replace(/[ٱأإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\\u0621-\\u064A]/g, "");
}
const index = {};
const punct = /^[\\u0610-\\u061A\\u064B-\\u065F\\u06D6-\\u06EDۖۗۘۙۚۛۜ\\s]+$/u;
for (let p = 1; p <= 604; p++) {
  const page = JSON.parse(fs.readFileSync(path.join(dir, p + ".json"), "utf8"));
  for (const a of page.ayahs) {
    for (const w of a.words) {
      if (punct.test(w.arabic) || w.arabic.length < 2) continue;
      const key = norm(w.arabic);
      if (key.length < 2) continue;
      if (!index[key]) index[key] = [];
      const arr = index[key];
      if (arr.length && arr[arr.length - 1].p === p && arr[arr.length - 1].a === a.id) continue;
      if (arr.length >= 250) continue;
      arr.push({ p, a: a.id, w: w.id, ar: w.arabic });
    }
  }
}
const out = {
  version: 1,
  builtAt: new Date().toISOString(),
  formCount: Object.keys(index).length,
  forms: index,
};
fs.writeFileSync(path.join(dest, "word-search-index.json"), JSON.stringify(out));
console.log("search forms", out.formCount);

const wbw = JSON.parse(fs.readFileSync(path.join(dest, "wbw-urdu.json"), "utf8")).meanings || {};
const ayahs = {};
for (let p = 1; p <= 604; p++) {
  const page = JSON.parse(fs.readFileSync(path.join(dir, p + ".json"), "utf8"));
  for (const a of page.ayahs) {
    const urParts = [];
    for (const w of a.words) {
      const m = wbw[w.id];
      if (m && String(m).trim()) urParts.push(String(m).trim());
    }
    ayahs[a.id] = { p: page.page, ar: a.text, ur: urParts.join(" ") };
  }
}
const cards = {
  version: 1,
  builtAt: new Date().toISOString(),
  ayahCount: Object.keys(ayahs).length,
  ayahs,
};
fs.writeFileSync(path.join(dest, "ayah-cards.json"), JSON.stringify(cards));
console.log("ayah cards", cards.ayahCount);
NODE
