# 21 - Quran Reader

> The Reading Engine is the heart of the application.

---

## Purpose

Provide a calm, distraction-free Quran reading experience with local progress and bookmarks.

Authentication, AI teaching, OCR, curriculum, and dashboard are out of scope for this milestone.

---

## Architecture

```
UI (QuranReader)
   │
   ├─ QuranService (static JSON via API)
   ├─ ProgressService (StorageAdapter)
   ├─ BookmarkService (StorageAdapter)
   └─ ReadingService (orchestrates progress + bookmarks)
```

### Quran content

- Source text: Uthmani (alquran.cloud)
- Rendered with Indo-Pak Quran font (font file in `public/fonts/`)
- Packaged as static per-page JSON under `data/quran/by-page/`
- Served by `GET /api/v1/quran/page/[page]`
- Meta/surahs/juz: `GET /api/v1/quran/meta`

### Learner state (pre-auth)

- `StorageAdapter` abstraction
- Browser `localStorage` implementation today
- Memory adapter for tests
- Swap to Prisma later without changing UI components

---

## Routes

| Route | Behavior |
|-------|----------|
| `/` | Continue Reading + start from page 1 |
| `/quran` | Resume last saved page |
| `/quran?page=N` | Open explicit page (does not prefer stored resume) |

---

## Features

- Juz / Surah / page navigation
- Previous / Next page
- RTL Urdu UI
- Selectable words (returns word id + metadata only)
- Bookmarks (add / remove / list)
- Reading position + history

---

## Intentionally not built

- AI explanations
- Recognition status / confidence UI
- Auth-backed progress
- Dashboard
- Vocabulary / rules / review

---

## Key files

- `features/reading/components/*`
- `features/reading/services/*`
- `lib/storage/adapter.ts`
- `data/quran/`
- `app/quran/page.tsx`
- `app/api/v1/quran/**`
