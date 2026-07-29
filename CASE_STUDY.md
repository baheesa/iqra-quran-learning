# Case Study: Iqra — Learning to Understand the Quran Word by Word

**Live demo:** [https://iqra-quran-learning-eight.vercel.app](https://iqra-quran-learning-eight.vercel.app)  
**GitHub:** [https://github.com/baheesa/iqra-quran-learning](https://github.com/baheesa/iqra-quran-learning)

---

## Overview

Iqra is a Quran learning app I built for Urdu-speaking learners who want to understand the mushaf more directly — without relying on a full side-by-side translation every time they open the book. It follows a recognition-first approach inspired by **Muallim-ul-Quran** (Units 1–7): read first, confirm unfamiliar words, collect those words, and return to them later. The web demo is on Vercel; the same curriculum also ships in an offline Android app under `offline-apk/`.

The goal is practical. Open the Quran, keep attention on the Arabic, tap only the words you do not know, and leave with a personal vocabulary list instead of a habit of reading through an entire translation page.

## The problem it solves

Traditional learning often means juggling a physical mushaf and a separate Urdu translation, or using a translation-first screen that pulls attention away from the Arabic. That pattern is awkward to carry day to day and easy to turn into passive reading: the eye drifts to the Urdu line and never trains recognition of Quranic word forms.

Iqra flips that. The mushaf stays primary. Meanings appear as short **Urdu tips on the word you tap**, not as a permanent second column. Familiar words stay out of the way; unfamiliar ones get one tap for confirmation and are saved for review. That matches how recognition grows through repeated encounters — and Muallim’s emphasis on recognition before heavy grammar.

## Tech stack

What this repository actually uses:

- **Next.js 15**, **React 19**, **TypeScript**, **Tailwind CSS**
- **Prisma** (present; public demo runs without a live database)
- **pnpm**; static JSON under **`data/`** (not live Google Sheets)
- Browser **localStorage** for tapped words, learned marks, duas, and theme
- **Capacitor** app in **`offline-apk/`** for installable offline use
- **Vercel** for the public web deploy

Optional Supabase/AI tooling exists in the repo, but the public learner demo does not require real API keys.

## Core features

Implemented and available on the live site:

1. **Interactive Quran reading** — Indo-Pak mushaf; tap a word for a word-by-word Urdu tip; dismiss by tapping elsewhere.
2. **My words** — meaningful taps can be stored in localStorage and reviewed on `/vocabulary`.
3. **Search** — Arabic or Urdu against a word index, with **View all** matching ayahs (Arabic + Urdu) and return to the mushaf.
4. **Muallim Units 1–7** — **Qawaid** (rules + examples), **Words**, and **Ayahs**, with learned/memorized marks.
5. **Duas** — daily and Quranic (by juz), with memorization toggles and mushaf links where available.
6. **Dark / light** theme.
7. **Home progress** — pages visited, unit progress, memorized duas, and a short daily recognition slice. (`/dashboard` redirects home.)
8. **Offline APK** — bundled data after install, no ads. The **web** demo needs the server for page/tip APIs; that difference is intentional and documented.

## Technical challenges

**Tips without inventing meanings.** Meanings come from verified word-by-word Urdu data. Unscoped tips (e.g. Qawaid) could wrongly take the first Quran hit and pick up neighbor bleed (like «یا آئے» for جاء). Standalone form-consensus tips fixed that.

**Search at scale.** A normalized form index maps shapes to mushaf hits; ayah cards feed match lists without turning the product into a translation browser.

**Tap-to-vocabulary and deploy.** Learner state for the demo stays in the browser. On Vercel, a file-backed server learner store failed on the read-only filesystem and crashed home; production now uses an in-memory server store while localStorage keeps real progress. Quran JSON must also be traced into serverless functions for tip/page APIs.

**Offline honesty.** Fully offline after install is true for the APK. Claiming the same for the hosted Next.js app would be misleading.

## What’s next

1. Stronger offline web caching for recently opened pages/tips — without pretending the full mushaf API is offline today.
2. Optional signed-in sync of My words and learned marks across devices, keeping the guest path intact.
3. Gentle revision prompts on Home for short daily sessions — still not a quiz game.

---

*Built as a portfolio piece and a practical companion for recognition-first Quran reading.*
