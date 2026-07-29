# Iqra — Quran Learning App

**Live demo:** [https://iqra-quran-learning-eight.vercel.app](https://iqra-quran-learning-eight.vercel.app)  
**GitHub:** [https://github.com/baheesa/iqra-quran-learning](https://github.com/baheesa/iqra-quran-learning)

> Open the Quran, tap only the words you don’t know, and gradually understand without carrying a side-by-side translation.

This repository is a recognition-first Quran learning system for Urdu speakers, grounded in **Muallim-ul-Quran** (Units 1–7). It ships as a **Next.js web app** (this deploy) and an **offline Iqra Android APK** under `offline-apk/`.

---

## Case study

See the full write-up in **[CASE_STUDY.md](./CASE_STUDY.md)** (also summarized below).

### Overview

I built Iqra so a learner can read the mushaf, confirm unfamiliar words with a short Urdu tip, and keep those words for later review — without treating the app as a translation book or a grammar course.

### Core features (implemented)

- Interactive mushaf with **word-by-word Urdu tips** on tap
- Tapped words saved to **My words** (browser localStorage)
- **Arabic / Urdu search** with View all matching ayahs
- **Qawaid**, **Words**, and **Ayahs** from Muallim Units 1–7
- **Daily + Quranic duas** (Quranic organized by juz), with memorization marks
- **Dark / light** theme
- Progress on **Home** (pages, unit progress, memorized duas)
- Offline-capable **Iqra APK** (bundled data; no ads)

### Tech stack (used in this repo)

Next.js 15 · React 19 · TypeScript · Tailwind CSS · Prisma · pnpm · Capacitor (APK) · static JSON under `data/` · Vercel

### Run locally

```bash
pnpm install
cp .env.example .env.local   # or use .env.production.example for demo env shape
pnpm db:generate
pnpm dev
```

Learner demo works with `AUTH_PROVIDER=memory` and no AI keys. See `.env.production.example`.

### Offline APK

```bash
cd offline-apk
bash scripts/sync-data.sh
npm install
npm run apk:debug
```

### Docs

- Learner manual: [`docs/learner/features-manual.md`](docs/learner/features-manual.md) (also `/help` in-app)
- Data pipeline: [`docs/learner/data-pipeline.md`](docs/learner/data-pipeline.md)
- Architecture / ops: `docs/20`–`docs/31`

---

## License

Educational use.
