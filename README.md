<div align="center">

# إقرأ · Iqra

### Learn the Quran word by word — Arabic text, Urdu meanings, built-in progress tracking.

**Tap any word → see its Urdu meaning → build vocabulary you keep.**  
All 604 Quran pages · Word-by-word Urdu meanings · Search · Duas · Qawaid · Works offline

<br />

[![Open Web App](https://img.shields.io/badge/🌐%20Open%20Web%20App-1E4A38?style=for-the-badge)](https://iqra-quran-learning-eight.vercel.app)
&nbsp;&nbsp;
[![Download APK](https://img.shields.io/badge/📱%20Download%20APK-android-1E4A38?style=for-the-badge)](https://github.com/baheesa/iqra-quran-learning/releases/latest/download/iqra-latest.apk)

<br />

<img src="docs/images/home.jpg" width="220" alt="Iqra home screen" />

<sub>PWA · Android APK · No account needed · No internet after install</sub>

</div>

---

## Install

| Platform | How |
| --- | --- |
| **Android** | [Download APK →](https://github.com/baheesa/iqra-quran-learning/releases/latest) · tap the `.apk` file · enable *Install from unknown sources* if asked |
| **iPhone / iPad** | Open [the web app](https://iqra-quran-learning-eight.vercel.app) in Safari → Share → *Add to Home Screen* |
| **Web browser** | Open [iqra-quran-learning-eight.vercel.app](https://iqra-quran-learning-eight.vercel.app) — works on any device |

---

## Who is this for?

Most people who grew up reciting the Quran can read Arabic without stumbling — and understand almost none of it. They know the sounds, not the words.

Tafseer apps give full commentary. Translation apps show sentence-level Urdu. Neither tells you what the individual word in front of you means — so vocabulary never sticks.

Iqra is built for that gap. Tap any Arabic word on any of the 604 pages, and a panel shows its Urdu meaning right there in context. Once you know الرَّحْمَٰنِ, you've unlocked a word that appears 169 times across the Quran. That compounds.

| Who | What they get |
| --- | --- |
| People who recite daily but don't understand | Tap words during regular tilawat — no separate study session needed |
| Students learning Quranic Arabic | Word meanings + Qawaid rules together, anchored to real ayaat |
| Parents teaching children | No ads, no account, no setup — hand it over and it works |
| Anyone starting Quran from scratch | Daily goal + streak counter to keep the habit going |

---

## Features

| Feature | Detail |
| --- | --- |
| Quran pages | All 604 pages in IndoPak calligraphic font |
| Word meanings | Tap any word → Urdu meaning instantly |
| Search | Search in Arabic or Urdu across the whole Quran |
| Duas | Quranic duas + daily masnoon duas, with word-by-word meanings |
| Qawaid | Grammar rules with Quranic examples |
| Progress | Pages read, words known, daily goal, streaks |
| Offline | Works fully without internet after first load |

<p align="center">
  <img src="docs/images/mushaf.jpg" width="190" alt="Mushaf view" />
  &nbsp;
  <img src="docs/images/wordtap.jpg" width="190" alt="Word meaning popup" />
  &nbsp;
  <img src="docs/images/search.jpg" width="190" alt="Search results" />
</p>

<p align="center">
  <sub>Mushaf view · Word meaning popup · Search</sub>
</p>

---

## User manual

Full walkthrough of every screen and feature:

**[📘 Download PDF Manual](https://github.com/baheesa/iqra-quran-learning/raw/main/docs/manual/user-manual.pdf)**

---

## Stack

| Layer | Tech |
| --- | --- |
| UI | React 18 (UMD, no build step) |
| Fonts | Amiri Quran · Scheherazade New · Noto Nastaliq Urdu · Instrument Sans |
| Data | Static JSON — all Quran data bundled |
| Web hosting | Vercel |
| Android | Capacitor · GitHub Actions CI build |
| Offline | PWA manifest + service worker |
