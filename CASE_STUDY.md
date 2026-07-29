# Case Study: Iqra — Learning to Understand the Quran Word by Word

**Live demo:** [https://iqra-quran-learning-eight.vercel.app](https://iqra-quran-learning-eight.vercel.app)  
**GitHub:** [https://github.com/baheesa/iqra-quran-learning](https://github.com/baheesa/iqra-quran-learning)

---

## Overview

Iqra is a Quran learning app I built for Urdu-speaking learners who want to understand the mushaf more directly — without relying on a full side-by-side translation every time they open the book. The product follows a recognition-first approach inspired by **Muallim-ul-Quran** (Units 1–7): read first, confirm unfamiliar words, collect those words, and return to them later. The web demo is deployed on Vercel; the same curriculum also ships inside an offline-oriented Android app under `offline-apk/`.

The goal is simple. Someone should be able to open the Quran on a phone or laptop, keep attention on the Arabic text, tap only the words they do not know, and leave with a personal vocabulary list instead of a habit of reading through an entire translation page.

## The problem it solves

Traditional learning often means juggling a physical mushaf and a separate Urdu translation, or scrolling a translation-first interface that pulls attention away from the Arabic. That pattern is heavy to carry, slow to use day to day, and easy to turn into passive reading: the eye drifts to the Urdu line and never trains recognition of the Quranic word forms.

Iqra flips that. The mushaf stays primary. Meanings appear as short **Urdu tips on the word you tap**, not as a permanent second column. If a word is already familiar, you simply keep reading. If it is not, one tap confirms the sense and records the word for review. That is closer to how people actually learn language through repeated encounters — and it matches Muallim’s emphasis on recognition before formal grammar drills.

## Tech stack

What this repository actually uses:

- **Next.js 15** and **React 19** for the web app
- **TypeScript** (strict) and **Tailwind CSS**
- **Prisma** (schema/client present; public demo runs without a live database)
- **pnpm** for packages
- Static curriculum and mushaf data under **`data/`** (JSON), not live Google Sheets
- Browser **localStorage** for learner progress (tapped words, learned units, memorized duas, theme)
- **Capacitor** + Vite React app in **`offline-apk/`** for the installable offline experience
- **Vercel** for the public web deploy

Optional Supabase/AI pieces exist for auth and knowledge tooling, but the public learner demo does not require real API keys.

## Core features

These are implemented in the codebase and available on the live site:

1. **Interactive Quran reading** — Indo-Pak script mushaf with page/juz/surah navigation. Tap a word to see a word-by-word Urdu tip (`WordMeaningTooltip` / WBW data). Tips dismiss when you tap elsewhere.
2. **Personal vocabulary (“My words”)** — Each meaningful tap can be recorded via the tapped-words service into localStorage and reviewed on `/vocabulary`.
3. **Search** — Arabic or Urdu query against a word index; preview matches and **View all** ayahs that use the form, with Arabic + Urdu cards and navigation back into the mushaf.
4. **Muallim Units 1–7**
   - **Qawaid** — short rules with definitions and examples (tappable Arabic, Urdu when present)
   - **Words** — unit vocabulary with learned marks
   - **Ayahs** — unit practice ayahs/phrases
5. **Duas** — daily duas plus Quranic duas filterable by juz, with memorization toggles and mushaf links where pages exist.
6. **Theme** — light and dark mode.
7. **Progress on Home** — visited pages, unit word/ayah progress, memorized duas, and a small daily recognition practice slice. (There is no separate live dashboard route; `/dashboard` redirects home.)
8. **Offline APK** — after install, the Iqra app bundles mushaf and curriculum data and does not depend on ads. The **web** demo needs the server for page/tip APIs; that distinction is intentional.

## Technical challenges

**Word tips without inventing meanings.** Tips resolve through verified word-by-word Urdu (`data/quran/wbw-urdu.json`) and the reading API. On lists without an ayah reference (e.g. Qawaid examples), a first-hit lookup could return a context-bleeding gloss (such as «یا آئے» for جاء). I fixed that with form-consensus / standalone tips so unscoped taps prefer a stable cleaned meaning instead of the first Quran occurrence.

**Search and “view all.”** A normalized form index maps Arabic shapes to mushaf hits; ayah cards supply Arabic + Urdu for match lists. The UI has to stay usable on large result sets without turning into a translation browser.

**Tap-to-vocabulary.** Recording must be cheap and private: localStorage adapters, not a required login for the demo. Progress on Home also reads curriculum JSON and client-side learned sets.

**Deploying static Quran data on Vercel.** Mushaf pages and WBW files must be available to serverless routes (`outputFileTracingIncludes`). The home page originally wrote a file-backed learner store under `data/learner/`, which fails on Vercel’s read-only filesystem; production now uses an in-memory server store while the browser keeps real learner progress.

**Offline honesty.** Fully offline after install is true for the APK path. Claiming the same for the hosted Next.js app would be misleading — I document that clearly for portfolio readers.

## What’s next

1. **Stronger offline web** — selective caching or a PWA shell for recently opened pages and tips, without pretending the full mushaf API is offline today.
2. **Cloud sync (optional)** — signed-in sync of My words and learned marks for multi-device learners, keeping the guest/local path intact.
3. **Gentle revision prompts** — surface overdue tapped words or unit items in the Home flow for 15–20 minute sessions, still without turning the app into a quiz game.

---

*Built as a portfolio piece and a practical companion for recognition-first Quran reading.*
