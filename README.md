<div align="center">

# Iqra

### Understand the Quran word by word — without living inside a translation.

Open the mushaf. Read calmly. Tap only what you don’t recognize.  
A short Urdu tip appears on that word. Familiar words stay out of the way.

Built for Urdu speakers · grounded in **Muallim-ul-Quran** (Units 1–7)

<br />

[**Open live app**](https://iqra-quran-learning-eight.vercel.app)
&nbsp;·&nbsp;
[**Download Android APK**](https://iqra-quran-learning-eight.vercel.app/downloads/iqra-quran-learning.apk)
&nbsp;·&nbsp;
[**PDF manual**](docs/Quran-Learning-System-User-Manual.pdf)
&nbsp;·&nbsp;
[**Case study**](CASE_STUDY.md)

<br />

<img src="docs/images/theme-light.png" alt="Iqra home in light mode" width="46%" />
&nbsp;
<img src="docs/images/theme-dark.png" alt="Iqra home in dark mode" width="46%" />

<sub>Light & dark — same calm surface, built for short daily reading.</sub>

</div>

---

## Why Iqra exists

Most people who want to *understand* the Quran end up juggling two books: the Arabic mushaf and a full Urdu translation. The eye drifts to the Urdu line. The Arabic never becomes familiar.

Iqra flips that.

| The mushaf stays primary | Tips stay quiet until you ask |
| --- | --- |
| You read continuous Arabic, page by page | One tap → one short Urdu tip on that word |
| No permanent translation column | Tap away to dismiss |
| Grammar only when a pattern helps | Progress grows from real reading |

The app succeeds when you need it **less** — when you can open a mushaf and recognize more of what you see.

---

## Try it in under a minute

1. Open the [live app](https://iqra-quran-learning-eight.vercel.app) *(or [install the APK](https://iqra-quran-learning-eight.vercel.app/downloads/iqra-quran-learning.apk) for offline phone use).*
2. From **Home**, continue into the mushaf.
3. Read for a few lines. Tap one unfamiliar word.
4. Check **My words** later — that tip is waiting for you.

A good daily session is **15–20 minutes**: read → tap only when unsure → optionally revise one list (My words, Qawaid, or a dua).

<img src="docs/images/home-light.png" alt="Home with resume reading, recognize practice, and progress" width="720" />

---

## What’s inside

### Quran reader

Indo-Pak script. Page, juz, and surah navigation. Font size, bookmarks, last page remembered.  
Tools stay in the toolbar — the page itself stays uncluttered.

<img src="docs/images/reader-mid-page.png" alt="Quran reader mid-page" width="720" />

### Word tips (recognition first)

Tap a word → Urdu tip on the word. Tap elsewhere → gone.  
Optional full-ayah Urdu exists on demand, but it never replaces the mushaf as the main surface.

<img src="docs/images/reader-word-tap.png" alt="Word tip floating above a tapped Arabic word" width="720" />

### My words

Every useful tap can become a personal review list — vocabulary you already met *in context*, not from a random word bank.

<img src="docs/images/vocabulary-list.png" alt="My words vocabulary list" width="720" />

### Search & “View all”

Search Arabic or Urdu. Preview matches. Open **View all** for every listed ayah, then jump straight back into the mushaf.

<img src="docs/images/search-results.png" alt="Search results for الله" width="46%" />
<img src="docs/images/search-view-all.png" alt="View all matching ayahs" width="46%" />

### Muallim curriculum (Units 1–7)

**Qawaid** — short rules with Quran examples.  
**Unit words** & **Unit ayahs** — curriculum practice you can mark as familiar.

<img src="docs/images/qawaid-rule.png" alt="Qawaid rule with examples" width="720" />

<img src="docs/images/words-section.png" alt="Unit words" width="46%" />
<img src="docs/images/ayahs-section.png" alt="Unit ayahs" width="46%" />

### Duas

Daily / masnoon duas for ordinary moments.  
Qur’anic duas organized by **juz**, with memorization marks and a shortcut back into the mushaf.

<img src="docs/images/duas-daily.png" alt="Daily duas" width="46%" />
<img src="docs/images/duas-quranic-juz.png" alt="Qur’anic duas by juz" width="46%" />

### Progress without quizzes

**Home** is the progress surface — pages visited, unit progress, memorized duas, a short recognition practice.  
No streak theater. No quiz dashboard. Just a calm place to continue.

<img src="docs/images/dashboard-light.png" alt="Progress on Home" width="720" />

---

## Web vs Android

| | **Web** ([open](https://iqra-quran-learning-eight.vercel.app)) | **Android APK** ([download](https://iqra-quran-learning-eight.vercel.app/downloads/iqra-quran-learning.apk)) |
| --- | --- | --- |
| Mushaf + word tips | Yes | Yes — data bundled on device |
| Qawaid, words, ayahs, duas | Yes | Yes |
| Offline | Limited | Full offline reading |
| Progress | Browser localStorage | On-device storage |
| Ads | None | None |

Install tip: if Android asks, allow install from your browser. Repo copy: [`public/downloads/iqra-quran-learning.apk`](public/downloads/iqra-quran-learning.apk).

---

## How to learn with it

**Do this**

- Read first. Tap only what you don’t know.
- Use tips to *confirm* — not to replace thinking.
- Revisit the same pages until forms feel familiar.
- Open Qawaid when the same pattern keeps showing up.

**Skip this**

- Treating the app like a translation book
- Collecting tips instead of reading
- Making grammar the main activity

```
Reading → Recognition → Understanding → Practice → Reflection → Revision
```

---

## What this is not

Iqra is **not** a chatbot, a translation app, a grammar course, a quiz game, or a social network.

The Quran stays at the center.  
Muallim-ul-Quran is the educational source.  
Tips help recognition — they are not the curriculum.

---

## For developers

### Stack

Next.js 15 · React 19 · TypeScript · Tailwind · Prisma · pnpm · Capacitor (APK) · static JSON in `data/` · Vercel

UI defaults: Urdu · Jameel Noori Nastaleeq · Indo-Pak Quran script.

### Run the web app

```bash
pnpm install
cp .env.example .env.local
pnpm db:generate
pnpm dev
```

Demo mode works with `AUTH_PROVIDER=memory` and no AI keys — see `.env.production.example`.  
Local: [http://127.0.0.1:3000](http://127.0.0.1:3000) · Help: [/help](http://127.0.0.1:3000/help)

### Build the APK

```bash
cd offline-apk
bash scripts/sync-data.sh
npm install
npm run apk:debug
```

Copy the build into `public/downloads/iqra-quran-learning.apk` to expose it on the web download link.

### Content model

Learner content is **static JSON** under `data/` (not live Google Sheets). The web app reads it on the server; the APK syncs it into the install bundle. That keeps the public demo reliable — no quotas, no broken Sheets links, no secrets for data.

### Regenerate docs & screenshots

```bash
pnpm docs:screenshots   # docs/images/
pnpm docs:manual        # PDF + HTML manual
pnpm docs:all
```

Defaults to the live demo. For local capture: `DOCS_BASE_URL=http://127.0.0.1:3000`.

### More reading

| | |
| --- | --- |
| [PDF user manual](docs/Quran-Learning-System-User-Manual.pdf) | Screenshots + clickable links |
| [CASE_STUDY.md](CASE_STUDY.md) | Portfolio write-up |
| `docs/00`–`docs/31` | Architecture notes for contributors |

---

## License

Educational use.
