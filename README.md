<div align="center">

# Iqra

### Learn the Quran word by word — Arabic text, Urdu meanings, built-in progress tracking. Offline PWA + Android.

<img src="https://img.shields.io/badge/Live-Web_App-1E4A38?style=for-the-badge" alt="Live web app" />
&nbsp;
<img src="https://img.shields.io/badge/Download-APK-1E4A38?style=for-the-badge&logo=android&logoColor=white" alt="Download APK" />
&nbsp;
<img src="https://img.shields.io/badge/Stack-React_PWA-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React PWA" />
&nbsp;
<img src="https://img.shields.io/badge/Offline-Ready-59625C?style=for-the-badge" alt="Offline" />

<br /><br />

**Open the app → tap any word → see its Urdu meaning → build vocabulary you keep.**  
All 604 Quran pages. Urdu word-by-word meanings. Search. Duas. Qawaid. No internet needed after install.

<br />

[Open Web App](https://iqra-quran-learning-eight.vercel.app)
&nbsp;&nbsp;·&nbsp;&nbsp;
[Download APK](https://github.com/baheesa/iqra-quran-learning/releases/latest)
&nbsp;&nbsp;·&nbsp;&nbsp;
[📘 PDF Manual](docs/manual/user-manual.pdf)

<br />

<img src="docs/images/home.jpg" width="260" alt="Iqra home screen — Quran page list" />

<sub>Offline PWA · Android APK · No account needed</sub>

</div>

---

## Who is this for?

**The problem:** Most people who grew up reciting the Quran can read Arabic without stumbling — and understand almost none of it. They know the sounds, not the words.

**The gap:** Tafseer apps give you full commentary per verse. Translation apps show sentence-level English or Urdu. Neither tells you what the individual word in front of you means — so vocabulary never builds.

**What Iqra does:** Tap any Arabic word on any page. A panel shows its Urdu meaning, transliteration, and root — right there, in context. Once you know الرَّحْمَٰنِ, you've unlocked a word that appears 169 times across the Quran. That compounds.

| Who | How Iqra helps |
| --- | --- |
| Adults who recite daily but don't understand | Tap words during your regular tilawat — no separate study session needed |
| Students learning Quranic Arabic | Use word tap + Qawaid rules together to connect grammar to real ayaat |
| Parents teaching children | Simple screen, no ads, no accounts — hand it to a child and it works |
| Anyone starting Quran reading from scratch | Built-in progress tracker with daily goals keeps the habit going |

---

## What's in the app?

| Feature | Detail |
| --- | --- |
| Quran pages | All 604 pages with Scheherazade Arabic font |
| Word meanings | Tap any word → Urdu meaning + transliteration |
| Search | Search by surah name, ayah number, or keyword |
| Duas | Daily duas with Arabic and Urdu |
| Qawaid | Basic Tajweed rules with examples |
| Progress | Track pages read, daily goal, streaks |
| Offline | Works fully without internet after first load |

<p align="center">
  <img src="docs/images/mushaf.jpg" width="230" alt="Mushaf view — Quran page" />
  &nbsp;
  <img src="docs/images/wordtap.jpg" width="230" alt="Word tap — Urdu meaning popup" />
  &nbsp;
  <img src="docs/images/search.jpg" width="230" alt="Search results" />
</p>

<p align="center">
  <sub>Left: Mushaf view · Center: Word meaning popup · Right: Search</sub>
</p>

---

## Screenshots

<table>
<tr>
<td width="50%" valign="top" align="center">

### Home
All surahs listed with Juz indicator. Tap any to jump straight to that page.

<img src="docs/images/home.jpg" alt="Home screen" />

</td>
<td width="50%" valign="top" align="center">

### Mushaf
Full-page Arabic text. Swipe left/right to turn pages. Tap a word to see its meaning.

<img src="docs/images/mushaf.jpg" alt="Mushaf page view" />

</td>
</tr>
<tr>
<td width="50%" valign="top" align="center">

### Word meanings
Tap any Arabic word. A panel slides up showing the Urdu meaning, transliteration, and root.

<img src="docs/images/wordtap.jpg" alt="Word meaning popup" />

</td>
<td width="50%" valign="top" align="center">

### Search
Search by surah name, Juz number, or keyword. Results link directly to the page.

<img src="docs/images/search.jpg" alt="Search results" />

</td>
</tr>
<tr>
<td width="50%" valign="top" align="center">

### Duas
Daily duas with full Arabic text, Urdu translation, and occasion notes.

<img src="docs/images/duas.jpg" alt="Duas screen" />

</td>
<td width="50%" valign="top" align="center">

### Progress
Daily reading goal, streak counter, and a log of pages completed.

<img src="docs/images/progress.jpg" alt="Progress screen" />

</td>
</tr>
</table>

---

## User manual

Full walkthrough — every screen, every feature:

**[📘 Download PDF Manual](docs/manual/user-manual.pdf)**

---

## Try it now

**Web (no install):**

Open [iqra-quran-learning-eight.vercel.app](https://iqra-quran-learning-eight.vercel.app) in any browser. Works on phone and desktop. Add to home screen for offline access.

**Android APK:**

Download from [Releases](https://github.com/baheesa/iqra-quran-learning/releases/latest). Install the APK directly — no Play Store needed. Enable "Install from unknown sources" in Android settings if prompted.

---

## Run locally

No build step required:

```bash
cd assets
python3 -m http.server 5173
```

Open [http://localhost:5173](http://localhost:5173).

Or open `assets/index.html` directly in a browser.

---

## Project layout

```text
assets/               Static PWA (HTML · CSS · JS · data)
assets/index.html     Single-file app entry point
assets/data/          Quran data: surahs, wbw-urdu, duas, qawaid
docs/images/          README screenshots
docs/manual/          PDF user manual
```

---

## Stack

| Layer | Tech |
| --- | --- |
| UI | React 18 (UMD, no build step) |
| Fonts | Scheherazade New · Noto Nastaliq Urdu · Instrument Sans |
| Data | Static JSON — all Quran data bundled |
| Hosting | Vercel (web) · Direct APK (Android) |
| Offline | PWA manifest + service worker |
