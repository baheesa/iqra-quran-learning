#!/usr/bin/env bash
# Re-copy offline data/fonts from the parent Next.js repo.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEST="$(cd "$(dirname "$0")/.." && pwd)/public"

mkdir -p "$DEST/data/quran/by-page" "$DEST/data/curriculum" "$DEST/data/duas" "$DEST/fonts"

cp -R "$ROOT/data/quran/by-page/"*.json "$DEST/data/quran/by-page/"
cp "$ROOT/data/quran/meta.json" "$ROOT/data/quran/surahs.json" "$ROOT/data/quran/juz-index.json" "$ROOT/data/quran/wbw-urdu.json" "$DEST/data/quran/"
cp "$ROOT/data/curriculum/unit-vocabulary.json" \
   "$ROOT/data/curriculum/unit-ayahs.json" \
   "$ROOT/data/curriculum/learner-rules.json" \
   "$ROOT/data/curriculum/journey-ayahs.json" \
   "$DEST/data/curriculum/"
cp "$ROOT/data/duas/daily-duas.json" "$DEST/data/duas/"
cp "$ROOT/public/fonts/"IndoPakQuran.* "$DEST/fonts/" 2>/dev/null || true
cp "$ROOT/public/fonts/"NotoNastaliqUrdu-Regular.* "$DEST/fonts/" 2>/dev/null || true

# Rebuild compact Quran word → page index for search
DEST="$DEST" node <<'NODE'
const fs = require("fs");
const path = require("path");
const dest = process.env.DEST;
function norm(ar) {
  return ar
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[ٱأإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\u0621-\u064A]/g, "");
}
const index = {};
const punct = /^[\u0610-\u061A\u064B-\u065F\u06D6-\u06EDۖۗۘۙۚۛۜ\s]+$/u;
const dir = path.join(dest, "data/quran/by-page");
for (let p = 1; p <= 604; p++) {
  const page = JSON.parse(fs.readFileSync(path.join(dir, `${p}.json`), "utf8"));
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
fs.writeFileSync(path.join(dest, "data/quran/word-search-index.json"), JSON.stringify(out));
console.log("search forms", out.formCount);

// Ayah cards: Arabic mushaf text + Urdu from joined WBW glosses
const wbw = JSON.parse(
  fs.readFileSync(path.join(dest, "data/quran/wbw-urdu.json"), "utf8"),
).meanings || {};
const ayahs = {};
for (let p = 1; p <= 604; p++) {
  const page = JSON.parse(fs.readFileSync(path.join(dir, `${p}.json`), "utf8"));
  for (const a of page.ayahs) {
    const urParts = [];
    for (const w of a.words) {
      const m = wbw[w.id];
      if (m && String(m).trim()) urParts.push(String(m).trim());
    }
    ayahs[a.id] = {
      p: page.page,
      ar: a.text,
      ur: urParts.join(" "),
    };
  }
}
const cards = {
  version: 1,
  builtAt: new Date().toISOString(),
  ayahCount: Object.keys(ayahs).length,
  ayahs,
};
fs.writeFileSync(
  path.join(dest, "data/quran/ayah-cards.json"),
  JSON.stringify(cards),
);
console.log("ayah cards", cards.ayahCount);
NODE

echo "Synced data into $DEST"
echo "Pages: $(ls "$DEST/data/quran/by-page" | wc -l | tr -d ' ')"
