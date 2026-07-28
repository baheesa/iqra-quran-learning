================================================================================
QURAN LEARNING SYSTEM — BUILDER / DEVELOPMENT GUIDE
================================================================================
File:     readme.txt
Audience: Anyone who wants to understand, run, extend, or rebuild this system
Also see: AGENTS.md (highest authority), README.md (product overview),
          docs/USER_MANUAL.pdf (learner manual), docs/*.md (deep dives)

If AGENTS.md conflicts with this file or with code: AGENTS.md wins.
If educational content conflicts with convenience: education wins.


================================================================================
1. MISSION (read this before writing code)
================================================================================

ONE purpose:

  Help a learner gradually understand the Quran DIRECTLY,
  without relying on translation as a permanent crutch.

Everything in this repository must serve that mission.
If a feature does not improve learning: do not build it.

This is:
  - AI-assisted Quran learning platform
  - Muallim-ul-Quran based curriculum
  - Recognition-first, reading-first, vocabulary-centered
  - Long-term learning companion

This is NOT:
  - A chatbot product
  - A translation app
  - A grammar course
  - A social network / gamification / quiz LMS

Educational order (always):

  Reading -> Recognition -> Understanding -> Practice -> Reflection -> Revision

Grammar appears only when it genuinely helps understanding.


================================================================================
2. TECH STACK
================================================================================

  Runtime / app:     Next.js 15 (App Router), React 19, TypeScript (strict)
  Styling:           Tailwind CSS v4
  Package manager:   pnpm (required; see packageManager field in package.json)
  Data (local):      JSON under data/ (mushaf, curriculum, duas, rules)
  Data (cloud):      PostgreSQL via Prisma 6 + Supabase (auth/sync/admin when configured)
  Validation:        Zod
  Tests:             Vitest (+ Testing Library where used)
  AI (optional):     OpenAI / Anthropic providers under features/knowledge + teacher
  Deploy:            Docker / standalone Next output (see Dockerfile, docs/30-*)

Primary learner UI language: Urdu (where lesson text is shown)
UI font:                     Jameel Noori Nastaleeq (see public/fonts)
Quran font:                  Indo-Pak Quran script (do not replace defaults casually)


================================================================================
3. QUICK START (local learner path — works without full cloud)
================================================================================

Prerequisites:
  - Node.js 20+ recommended
  - pnpm 9.x (corepack enable && corepack prepare pnpm@9.15.4 --activate)
  - On this project Mac, Node may live under: $HOME/.local/node/bin

Steps:

  1) export PATH="$HOME/.local/node/bin:$PATH"   # if needed
  2) cp .env.example .env.local
     # For local-only UI learning you can keep AUTH_PROVIDER=memory
     # and skip real Supabase keys until you need auth/admin/DB.
  3) pnpm install
  4) pnpm db:generate          # Prisma client (safe even if DB unused yet)
  5) pnpm dev
  6) Open http://localhost:3000

Phone on same Wi-Fi:

  http://<mac-lan-ip>:3000
  Keep "pnpm dev" running. Use browser "Add to Home Screen".
  There is no offline APK in-repo yet (see section 14).

Useful scripts:

  pnpm dev                 Start Next.js (Turbopack)
  pnpm build / pnpm start  Production build + serve
  pnpm start:low-mem      Cap V8 heap for ~1GB RAM hosts (see docs/30-deployment-guide.md)
  pnpm typecheck           tsc --noEmit
  pnpm lint                ESLint
  pnpm test                Vitest once
  pnpm prepare:check       typecheck + lint + test + build
  pnpm db:*                Prisma generate / migrate / studio / validate


================================================================================
4. SYSTEM ARCHITECTURE (mental model)
================================================================================

Layered idea (education before UI):

  Quran / Muallim curriculum / verified knowledge
           |
           v
  Domain services (reading, learning, knowledge, teacher, ...)
           |
           v
  Feature UI (features/*/components)
           |
           v
  App Router pages (app/**/page.tsx) + API routes (app/api/v1/**)

Organization style: FEATURE-FIRST under features/

  features/<name>/
    components/     React UI
    services/       Business logic
    domain/         Pure helpers / rules
    repository/     Persistence adapters (file / memory / DB)
    create-engine.ts / server.ts   Wiring for server use

Shared cross-cutting code:

  lib/              env, db, storage adapters, security, prompts, observability
  middleware.ts     Security headers + API rate limits
  prisma/           schema + migrations
  data/             Static educational content (treat as source of truth files)
  scripts/          Offline pipelines (OCR, curriculum export, Quran rebuild)
  knowledge/        Book/OCR experiment assets (not day-to-day UI)
  public/           Fonts, icons, static assets
  docs/             Long-form architecture & milestone docs
  tasks/            Implementation plans

Request flow examples:

  Home page
    app/page.tsx
      -> features/learning/components/LearnerHome.tsx
      -> localStorage helpers in curriculum-filters.tsx
      -> progress-service for mushaf position

  Quran page
    app/quran/page.tsx
      -> QuranReader
      -> quran-service reads data/quran/by-page/<n>.json
      -> optional API: app/api/v1/quran/page/[page]

  Words / Ayahs / Rules / Duas
    app/curriculum|ayahs|rules|duas/page.tsx
      -> UnitWordsBrowser | UnitAyahsBrowser | RulesBrowser | DuasBrowser
      -> data/curriculum/* or data/duas/daily-duas.json


================================================================================
5. WHAT IS ALREADY BUILT (stable learner path)
================================================================================

CORE (day-to-day learning — mature):

  Home dashboard          compact resume, recognize, progress, units
  Quran reader            Indo-Pak mushaf, juz/page/surah nav, bookmarks
  Words                   unit vocabulary, search, learned, next remaining
  Ayahs                   unit ayah practice
  Qawaid                  learner-facing rules/patterns
  Duas                    masnoon + Qur'anic duas juz 1-30, memorization
  Theme                   light / dark
  Local progress          browser localStorage (device-local)

ADVANCED (platform — use when extending cloud/AI/admin):

  AI Teacher              features/teacher/**
  Knowledge / OCR         features/knowledge/providers/**, scripts/knowledge-*
  Admin knowledge Mgmt    features/admin/**, app/admin/**
  Auth + sync             features/auth/**, Supabase
  Personalization         features/personalization/**

Stable composition for local learning:

  LearnerHome + QuranReader + UnitWordsBrowser + UnitAyahsBrowser
  + RulesBrowser + DuasBrowser + curriculum-filters localStorage
  + data/quran + data/curriculum + data/duas


================================================================================
6. DIRECTORY & FILE MAP (builders start here)
================================================================================

Legend:  [CORE] learner path   [DATA] content   [SUPPORT] shared
         [ADVANCED] optional cloud/AI/admin     [DOCS] documentation

--- Authority / docs ---
  AGENTS.md                         [DOCS] Product + education authority
  readme.txt                        [DOCS] THIS builder guide
  README.md                         [DOCS] Product-facing overview
  docs/USER_MANUAL.pdf              [DOCS] Learner manual + tablet screenshots (820x1180)
  docs/manual-screenshots/          [DOCS] PNG captures for the manual
  scripts/build-user-manual.cjs     [DOCS] Rebuild USER_MANUAL.pdf from screenshots
  offline-apk/                      [MOBILE] Separate Capacitor offline Android app + APK build
                                    See offline-apk/README.md and dist-apk/*.apk
  docs/00-*.md ... docs/31-*.md     [DOCS] Vision, engines, API, deploy
  docs/20-foundation-setup.md       [DOCS] Bootstrap / env details
  docs/21-quran-reader.md           [DOCS] Quran reader notes
  docs/30-deployment-guide.md       [DOCS] Deploy
  docs/31-maintenance-guide.md      [DOCS] Maintenance
  cursor/MEMORY.md                  [DOCS] Architectural decisions log
  tasks/IMPLEMENTATION-PLAN.md      [DOCS] Roadmap / plan

--- App Router ---
  app/layout.tsx                    [CORE] Root layout, fonts, theme FOUC
  app/globals.css                   [CORE] Design tokens (incl. dark)
  app/page.tsx                      [CORE] Home -> LearnerHome
  app/quran/page.tsx                [CORE] Quran
  app/curriculum/page.tsx           [CORE] Words
  app/ayahs/page.tsx                [CORE] Ayahs
  app/rules/page.tsx                [CORE] Qawaid
  app/duas/page.tsx                 [CORE] Duas
  app/manifest.ts                   [SUPPORT] PWA manifest
  app/api/v1/**                     [ADVANCED] HTTP API (health, quran, ...)
  app/admin/**                      [ADVANCED] Admin UI
  app/auth/**                       [ADVANCED] Login / register / profile
  middleware.ts                     [SUPPORT] Headers + mutating API rate limit
  next.config.ts                    [SUPPORT] Next config / headers

--- Features (UI + services) ---
  features/learning/components/LearnerHome.tsx              [CORE]
  features/learning/components/JourneyAyahCarousel.tsx      [CORE]
  features/learning/services/*                              [SUPPORT]/ADVANCED]
  features/reading/components/QuranReader.tsx               [CORE]
  features/reading/components/QuranPage.tsx                 [CORE]
  features/reading/components/QuranAyah.tsx                 [CORE]
  features/reading/components/QuranWord.tsx                 [CORE]
  features/reading/components/ReadingToolbar.tsx            [CORE]
  features/reading/components/PageNavigation.tsx            [CORE]
  features/reading/components/JuzSelector.tsx               [CORE]
  features/reading/services/quran-service.ts                [CORE]
  features/reading/services/progress-service.ts             [CORE]
  features/reading/services/bookmark-service.ts             [SUPPORT]
  features/reading/services/wbw-urdu.ts                     [SUPPORT]
  features/knowledge/components/UnitWordsBrowser.tsx        [CORE]
  features/knowledge/components/UnitAyahsBrowser.tsx        [CORE]
  features/knowledge/components/RulesBrowser.tsx            [CORE]
  features/knowledge/components/curriculum-filters.tsx      [CORE]
      Shared: LearnedToggle, next-remaining, localStorage load/save
      for learned words/ayahs, memorized duas, focus unit, last unit
  features/duas/components/DuasBrowser.tsx                  [CORE]
  features/i18n/AppShell.tsx                                [CORE]
  features/i18n/messages.ts                                 [SUPPORT]
  features/theme/theme-provider.tsx                         [CORE]
  features/teacher/**                                       [ADVANCED]
  features/admin/**                                         [ADVANCED]
  features/auth/**                                          [ADVANCED]
  features/personalization/**                               [ADVANCED]
  features/knowledge/providers/**                           [ADVANCED]
  features/knowledge/services/knowledge-pipeline related    [ADVANCED]

--- Data (do not invent; edit carefully; keep traceable) ---
  data/quran/by-page/1.json ... 604.json   [DATA] Mushaf pages (Arabic words)
  data/quran/juz-index.json                [DATA] Juz start pages
  data/quran/surahs.json                   [DATA] Surah metadata
  data/quran/wbw-urdu.json                 [DATA] Word-by-word Urdu index (if present)
  data/curriculum/unit-vocabulary.json     [DATA] Unit words
  data/curriculum/unit-ayahs.json          [DATA] Unit ayahs
  data/curriculum/learner-rules.json       [DATA] Qawaid for learners
  data/curriculum/journey-ayahs.json       [DATA] Home ayah carousel
  data/duas/daily-duas.json                [DATA] Masnoon + Qur'anic duas
  data/duas/README.md                      [DOCS] Duas provenance notes

--- Lib / infra ---
  lib/env.ts                 Env parsing
  lib/db/**                  Prisma access helpers
  lib/storage/**             Storage adapters (browser local, etc.)
  lib/security/**            Admin open-local guards, etc.
  lib/api/rate-limit.ts      API rate limiting used by middleware
  prisma/schema.prisma       DB schema
  public/fonts/**            Urdu / Quran fonts
  public/icons/**            App icons
  scripts/**                 Offline rebuild / OCR / curriculum tools


================================================================================
7. DATA CONTRACTS (how content enters the app)
================================================================================

Rule: AI must NOT invent Quran text, meanings, page numbers, or curriculum.
Prefer verified files under data/. OCR/extraction results stay unverified until
reviewed (see knowledge/admin docs).

Mushaf page JSON (data/quran/by-page/<page>.json) typically includes:
  page, juz, surahIds, ayahs[]
  ayah: id ("2:255"), surahId, ayahNumber, globalNumber, juz, page, text, words[]
  word: id, position, arabic

Curriculum vocabulary / ayahs:
  Structured by unit; consumed by UnitWordsBrowser / UnitAyahsBrowser.
  Export/update via scripts/export-curriculum-from-txt.ts (and related).

Duas (data/duas/daily-duas.json):
  categories[] + duas[]
  Qur'anic items: category "quranic", juz, ref, arabic (often excerpt), urdu,
  page, order. Memorization IDs stored in browser only.

Learner rules:
  data/curriculum/learner-rules.json — distilled for learners (not raw OCR dump).

When changing educational JSON:
  1) Keep IDs stable if progress keys depend on them
  2) Document source (page / edition) in nearby README or MEMORY
  3) Re-run typecheck/tests; spot-check the UI on phone width


================================================================================
8. PROGRESS & STORAGE (device-local today)
================================================================================

Learner progress for the stable path is primarily browser localStorage
on that device (not yet the source of truth in Postgres unless sync is enabled).

Keys / areas (see curriculum-filters.tsx + progress-service):

  quran.learning.learnedWordIds
  quran.learning.learnedAyahIds
  quran.learning.memorizedQuranicDuaIds
  quran.learning.lastWordsUnit
  quran.learning.lastAyahsUnit
  focus unit key(s)
  daily checklist / recognized-today keys
  reading position / visited pages via progress-service + storage adapter

Implications for builders:
  - Clearing site data resets that device's progress
  - Multi-device sync requires auth + sync engine (features/auth, docs/27)
  - Do not assume server has learned-word state unless you wire it


================================================================================
9. ENVIRONMENT & CONFIGURATION
================================================================================

Templates:
  .env.example     Commit-safe template — copy to .env.local
  .env.local       Local secrets (gitignored)
  .env             Sometimes used alongside .env.local

Important variables (see .env.example for full list):

  NEXT_PUBLIC_APP_URL
  DATABASE_URL / DIRECT_URL          Postgres (Supabase)
  SUPABASE_* / NEXT_PUBLIC_SUPABASE_*
  AUTH_PROVIDER=memory|supabase
  ADMIN_OPEN_LOCAL=0|1               Local admin bypass — NEVER in production
  ADMIN_PROVIDER
  API_RATE_LIMIT / API_RATE_WINDOW_MS
  AI provider keys (optional) for OCR / teacher

Local learning UI can run with memory auth and without a live DB,
but Prisma generate should still succeed. Cloud features need real keys.


================================================================================
10. HOW TO EXTEND THE SYSTEM (recipes)
================================================================================

A) Add a new learner page
  1. Create app/<route>/page.tsx using AppShell
  2. Put UI in features/<feature>/components/
  3. Put logic in features/<feature>/services/ (not in the page)
  4. Add nav entry in features/i18n/AppShell.tsx / messages.ts
  5. Update docs/USER_MANUAL.pdf + this guide if user-facing

B) Add curriculum unit content
  1. Prefer pipeline/scripts over hand-inventing
  2. Update data/curriculum/*.json with stable IDs
  3. Verify UnitWordsBrowser / UnitAyahsBrowser filters
  4. Keep Urdu meanings from verified sources only

C) Change mushaf rendering
  1. Start at QuranReader / QuranPage / QuranWord
  2. Do not alter original scanned PDFs; only derived JSON
  3. Preserve Indo-Pak font classes (font-quran)

D) Add a Qur'anic dua
  1. Edit data/duas/daily-duas.json (or regenerate via script)
  2. Prefer dua EXCERPT (not surrounding narrative)
  3. Include juz, page, ref, arabic, urdu
  4. Keep id stable: quran-<surah>:<ayah...>

E) Wire AI teacher / OCR
  1. Read AGENTS.md AI + OCR principles
  2. Read docs/23-ai-extraction.md, docs/25-ai-teacher.md
  3. Use providers under features/knowledge/providers
  4. Never auto-publish unverified OCR into curriculum

F) Enable auth / sync
  1. Fill Supabase env from .env.example
  2. AUTH_PROVIDER=supabase
  3. Read docs/27-authentication-and-sync.md
  4. Test merge/offline queue paths carefully

G) Admin knowledge workflow
  1. docs/28-admin-knowledge-management.md
  2. ADMIN_OPEN_LOCAL only for local machine
  3. Verification status required before curriculum entry


================================================================================
11. CODING STANDARDS (builders)
================================================================================

  - TypeScript strict; avoid "any" unless unavoidable
  - Feature-first folders; keep components small
  - Services independent from React where possible
  - No magic values; no commented-out dead code
  - Do not hardcode production AI prompts in components
    (prompts belong in lib/prompts or .cursor/PROMPTS docs)
  - Never commit secrets (.env.local, service role keys)
  - UI: calm, Quran-centered; preserve Urdu + Indo-Pak defaults
  - Educational validation matters as much as unit tests
  - Prefer reading AGENTS.md + relevant docs/* before large changes

Workflow for every non-trivial task:

  Read -> Understand -> Plan -> Explain -> Implement -> Test -> Document -> Review

Definition of done (from AGENTS.md):

  builds, tests pass, lint/typecheck pass, docs updated when architecture
  changes, no regressions, philosophy preserved, UX stays simple


================================================================================
12. TESTING & QUALITY
================================================================================

  pnpm typecheck
  pnpm lint
  pnpm test
  pnpm prepare:check     # full gate

Tests live beside features (*.test.ts) and cover services/domain logic.
Manual checks that matter:
  - Phone-width Home / Quran / Words / Duas
  - localStorage progress survives refresh
  - Dark mode readability
  - No invented Arabic/Urdu on educational surfaces


================================================================================
13. DOCUMENTATION INDEX (go deeper)
================================================================================

  Vision / rules:     docs/00-project-vision.md
                       docs/01-non-negotiable-principles.md
                       docs/02-learning-philosophy.md
  Engines:             docs/04-curriculum-engine.md
                       docs/05-learning-engine.md / docs/24-learning-engine.md
                       docs/06-reading-engine.md / docs/21-quran-reader.md
                       docs/07-knowledge-engine.md / docs/22-knowledge-engine.md
                       docs/03-ai-teacher.md / docs/25-ai-teacher.md
                       docs/26-personalization-engine.md
  Architecture:        docs/11-system-architecture.md
                       docs/14-frontend-architecture.md
                       docs/09-database-architecture.md
                       docs/13-api-design.md
  Process:             docs/16-development-roadmap.md
                       docs/17-coding-standards.md
                       docs/18-testing-strategy.md
                       docs/19-project-governance.md
  Ops:                 docs/20-foundation-setup.md
                       docs/29-production-readiness.md
                       docs/30-deployment-guide.md
                       docs/31-maintenance-guide.md
  Learner manual:      docs/USER_MANUAL.pdf


================================================================================
14. DEPLOYMENT & MOBILE (current reality)
================================================================================

Web:
  - Local: pnpm dev
  - Production-oriented: pnpm build && pnpm start (or Docker)
  - See Dockerfile, docker-compose.yml, docs/30-deployment-guide.md

Mobile today:
  - Network URL to the running Next server + Add to Home Screen
  - Still requires a host process (Mac or cloud)

Not in repo yet:
  - Android APK / iOS IPA offline package
  Paths later: (A) host online + TWA/PWA, or (B) Capacitor + offline assets


================================================================================
15. TROUBLESHOOTING
================================================================================

  "node: No such file or directory"
    -> export PATH="$HOME/.local/node/bin:$PATH" (or install Node 20+)

  Port 3000 in use
    -> stop old "next dev" or use another port: pnpm dev -- -p 3001

  Phone cannot connect
    -> same Wi-Fi; use Network URL from Next startup log; firewall allows 3000

  Urdu font 404
    -> check public/fonts and app/layout font paths / README under public/fonts

  Progress vanished
    -> different browser/device, or site data cleared (localStorage)

  Admin / DB errors
    -> verify .env.local; ADMIN_OPEN_LOCAL only for local; run pnpm db:generate

  After pulling large changes
    -> pnpm install && pnpm db:generate && rm -rf .next && pnpm dev


================================================================================
16. FIRST WEEK PLAN FOR A NEW BUILDER
================================================================================

  Day 1: Read AGENTS.md sections Mission + Philosophy + Architecture.
         Run pnpm dev. Use the app as a learner for 20 minutes.
  Day 2: Read this file sections 4-7. Trace Home -> LearnerHome in code.
  Day 3: Trace QuranReader -> quran-service -> data/quran/by-page.
  Day 4: Trace Words + curriculum-filters localStorage.
  Day 5: Read docs/11 + docs/14. Skim prisma/schema.prisma.
  Day 6: Pick a tiny UI improvement; follow Definition of Done.
  Day 7: Read docs/22 knowledge + docs/23 extraction BEFORE touching OCR/AI.


================================================================================
17. CONTACT POINTS INSIDE THE REPO
================================================================================

  Product law:     AGENTS.md
  Builder guide:   readme.txt  (this file)
  Product README:  README.md
  Decisions log:   cursor/MEMORY.md
  Learner help:    docs/USER_MANUAL.pdf

End of guide.
================================================================================
