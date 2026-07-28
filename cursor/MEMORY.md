# .cursor/MEMORY.md

# =============================================================================
# Project Memory
# Quran Learning System
# =============================================================================

Version: 1.0

Purpose

This file stores long-term project decisions.

It explains WHY certain architectural, educational, and technical decisions
were made.

Cursor should consult this file before making significant changes.

This document evolves throughout the life of the project.

---

# Project Identity

Project Name

Quran Learning System

Mission

Help learners gradually understand the Quran directly without relying on translation.

Primary Audience

Urdu-speaking learners.

Primary Methodology

Muallim-ul-Quran

---

# Core Philosophy

This is NOT an AI chatbot.

This is NOT a Quran translation app.

This is NOT an Arabic grammar course.

This is an AI-assisted learning platform.

The curriculum teaches.

AI assists.

---

# Long-Term Goal

A learner should eventually be able to:

Open the Quran.

Read continuously.

Recognize words naturally.

Understand verses without depending on translation.

Need the AI less over time.

---

# Educational Decisions

Decision

Recognition-first learning.

Reason

Recognition develops natural understanding.

Status

Permanent.

---

Decision

Avoid grammar-first teaching.

Reason

Muallim-ul-Quran focuses on gradual understanding.

Status

Permanent.

---

Decision

AI only explains when needed.

Reason

The learner should think first.

Status

Permanent.

---

Decision

Daily learning sessions remain short.

Reason

Consistency is more valuable than long sessions.

Target

15–20 minutes.

Status

Permanent.

---

# Knowledge Base Decisions

Source of Truth

Muallim-ul-Quran books.

Books exist only as scanned image PDFs.

The original PDFs are never modified.

All extracted information must be traceable back to a page in the original books.

AI is not allowed to invent curriculum.

---

# OCR Decisions

OCR output is never trusted automatically.

Every extracted item stores:

Confidence Score

Verification Status

Source Image

Only verified content becomes educational content.

---

# Quran Text Decisions

Original Quran text is immutable.

Never:

Modify

Rewrite

Auto-correct

Remove diacritics

Normalize in place

If normalization is required,

store separately.

---

# AI Decisions

The AI is:

Patient.

Supportive.

Recognition-focused.

Encouraging.

Simple.

Never:

Hallucinate.

Guess.

Invent references.

Invent page numbers.

Invent rules.

Invent lessons.

---

# User Interface Decisions

UI chrome language

English only (no Urdu/English toggle). `html` is `lang=en` `dir=ltr`.

Lesson content language

Arabic (Quran / vocabulary) and Urdu meanings stay as-is — never translated by the UI. Content blocks use `dir="rtl"` with `.font-quran` / `.font-urdu`.

Primary UI Font

Source Serif 4 (next/font) for English chrome

Content fonts

Jameel Noori Nastaleeq Regular (Urdu meanings)

Indo-Pak Script (Quran Arabic)

Design Style

Minimal

Calm green reading aesthetic

Focused

Reading-first

No unnecessary animations.

---

# Technical Decisions

Frontend

Next.js

TypeScript

Tailwind CSS

Backend

Next.js API

Database

PostgreSQL

ORM

Prisma

Storage

Supabase

Package Manager

pnpm

Architecture

Clean Architecture

Feature-first modules.

---

# Database Decisions

Every table should include:

ID

CreatedAt

UpdatedAt

Relationships

Indexes

Avoid duplicated data.

Store educational relationships explicitly.

---

# AI Prompt Decisions

Never hardcode prompts.

All prompts remain inside:

.cursor/PROMPTS.md

Application loads prompts from there.

---

# Rules Decisions

Development rules remain inside:

.cursor/RULES.md

Never duplicate rules elsewhere.

---

# Documentation Decisions

Project documentation lives inside:

docs/

Do not duplicate information.

Each document has one responsibility.

---

# Performance Decisions

Optimize for:

Reading speed.

Word lookup.

Review generation.

Minimal AI calls.

Use cached data whenever possible.

---

# Security Decisions

Never expose:

API keys.

Environment variables.

Database credentials.

Prompt templates.

Private learner data.

---

# Development Workflow

For every feature:

Read documentation.

Understand architecture.

Explain implementation.

Implement.

Test.

Document.

Review.

Never skip steps.

---

# Things We Will NOT Build

Social feed.

Likes.

Comments.

Leaderboards.

Gamification that distracts from learning.

Advertising.

Translation-first learning.

Grammar-first curriculum.

---

# Future Features

Offline mode.

Mobile application.

Desktop application.

Voice pronunciation.

Teacher dashboard.

Community curriculum verification.

Multiple AI providers.

Multiple Muallim editions.

Additional languages.

---

# Architectural Principles

Prefer:

Small components.

Simple services.

Reusable modules.

Clear naming.

Low coupling.

High cohesion.

Readable code.

---

# Lessons Learned

This section grows over time.

Whenever an important architectural lesson is discovered:

Record it here.

---

2026-07-21

Decision

Milestone 9 Production hardening locks ADMIN_OPEN_LOCAL (never on in production; non-prod opt-in only), adds middleware rate limits and security headers, health/readiness checks, structured logging, Quran API cache headers, TeacherPanel dynamic import, error/not-found pages, accessibility fixes, Prisma composite indexes, GitHub CI, and Docker standalone image. No new educational features.

Reason

The app must be safe and maintainable for daily real-world use before further feature work.

Status

Implemented.

Docs: `docs/29-production-readiness.md`, `docs/30-deployment-guide.md`, `docs/31-maintenance-guide.md`

---

2026-07-21

Decision

Milestone 8 Admin & Knowledge Management adds RoleService (Admin/Reviewer/Viewer), AuditLogService, VersionService, KnowledgeValidationService, PublicationService, and AdminService on top of the Knowledge Engine. Original PDFs are never overwritten. Publication requires validation to pass; only APPROVED extractions knowledge is exported for learners. Staff state lives in data/admin/ (memory in tests); Prisma models mirror roles, versions, audit, and publication history. ADMIN_OPEN_LOCAL is opt-in for non-prod only (locked off in production as of Milestone 9).

Reason

Maintainers need a safe review/publish path so draft OCR and unverified extraction never reach learners.

Status

Implemented.

Docs: `docs/28-admin-knowledge-management.md`

---

2026-07-21

Decision

Milestone 7 Authentication & Cloud Sync wraps existing engines with AuthService, SyncEngine, MigrationService, and OfflineQueue. Guest mode remains. Sync uses versioned SyncBundle + checksum incremental uploads. Memory auth/cloud for tests; Supabase Auth + file cloud for local/dev. User must confirm merge when local and cloud both have progress.

Reason

Identity and sync must not rewrite Learning Engine or AI Teacher. Reading must work offline.

Status

Implemented.

Docs: `docs/27-authentication-and-sync.md`

---

2026-07-21

Decision

Milestone 6 Personalization Engine derives learner profile/insights from Learning Engine state (no duplicated curriculum). Recommendations and study plans are priority-based, never random. AdaptationEngine feeds explanation depth and recognition emphasis into the AI Teacher. Prefs stored in data/personalization/; Prisma extended for ExplanationStyle + analytics snapshots.

Reason

Each learner needs different HOW without changing WHAT the curriculum teaches.

Status

Implemented.

Docs: `docs/26-personalization-engine.md`

---

2026-07-21

Decision

Milestone 5 AI Teacher is recognition-first and Learning-Engine-driven. Prompts load from cursor/PROMPTS.md. KnowledgeRetriever uses APPROVED exports only for Muallim claims; curriculum seed is labeled as general/learning context. Conversations are stored (file + Prisma models). Stub teacher works without OPENAI_API_KEY.

Reason

AI must not replace the curriculum or invent Muallim content. The teacher explains HOW; the Learning Engine owns WHAT.

Status

Implemented.

Docs: `docs/25-ai-teacher.md`

---

2026-07-21

Decision

Milestone 4 Learning Engine is AI-independent: file-backed local learner state, seed curriculum, recognition-first stages, spaced review by priority, daily session flow, and Urdu dashboard. Prisma models extended for future sync.

Reason

The Learning Engine must teach even when AI is disabled. Auth is still deferred, so learner state is local until Supabase Auth.

Status

Implemented.

Docs: `docs/24-learning-engine.md`

---

2026-07-21

Decision

Milestone 3.5 adds OpenAI Vision OCR + extraction providers driven by cursor/PROMPTS.md, with stub fallback when OPENAI_API_KEY is absent. Verification gains REJECTED. Admin review UI supports OCR/JSON compare and approve/reject/reprocess.

Reason

Knowledge must be AI-assisted but never invented; human approval remains the gate for exports.

Status

Implemented.

Docs: `docs/23-ai-extraction.md`

---

2026-07-21

Decision

Milestone 3 Knowledge Engine is file-first with swappable Pdf/Ocr/Extraction providers. Stub OCR/Extraction never invent content. pdf-lib registers page metadata; PNG rasterization is deferred to a future render provider.

Reason

Simplicity and correctness: large scanned PDFs must not be silently corrupted, and AI must not invent curriculum. File artifacts remain traceable; Prisma models prepared for later sync.

Status

Implemented.

Docs: `docs/22-knowledge-engine.md`

---

2026-07-21

Decision

Milestone 2 Quran Reading Engine uses static per-page Quran JSON + localStorage progress/bookmarks behind a StorageAdapter.

Reason

Auth is not ready. Reading must work offline-friendly and remain swappable to Prisma later. Avoid unused AI/recognition placeholder UI.

Status

Implemented.

Details

- Quran text: Uthmani source, Indo-Pak via font
- Word IDs: `{surah}:{ayah}:{position}`
- No dashboard in Milestone 2 (explicitly deferred)
- Docs: `docs/21-quran-reader.md`

---

2026-07-21

Decision

Milestone 1 Foundation bootstrapped with Next.js 15 App Router, Prisma 6, Supabase client wiring, and no authentication yet.

Reason

Establish a correct, maintainable base before reading/auth/AI features. Auth is deferred by explicit product request.

Status

Implemented.

Details

- Package manager: pnpm
- ORM: Prisma 6.19 (pinned; Prisma 7 deferred due to adapter/config churn)
- Database: PostgreSQL via Supabase `DATABASE_URL`
- Initial migration: `prisma/migrations/20260721160000_foundation`
- Knowledge doc renamed: `knowledge/KNOWLEDGE-BASE.md`
- Cursor rules live in `cursor/` (not `.cursor/` yet)

---

2026-07-20

Decision

Separate OCR from AI extraction.

Reason

Improves testing and reduces hallucinations.

Status

Implemented.

---

# Open Questions

Record unresolved questions here.

Example

Should embeddings be generated per page or per lesson?

Status

Pending.

---

# Known Limitations

Record temporary limitations.

Example

Current OCR struggles with low-resolution scans.

Future Work

Investigate alternative OCR engines.

---

2026-07-22

Decision

Claude (Anthropic) is a first-class live AI backend alongside OpenAI. `AI_PROVIDER=claude|openai|auto` selects OCR, extraction, and teacher LLM. Auto prefers `ANTHROPIC_API_KEY` when present. Stubs remain when no live key is set.

Reason

Learner/admin workflow needs Vision OCR from Muallim page images; the operator requested Claude API keys instead of OpenAI.

Status

Implemented.

Docs: `docs/23-ai-extraction.md`, `.env.example`

---

2026-07-22

Decision

Free OCR POC (PaddleOCR) lives under `knowledge/experiments/free-ocr/` and `features/knowledge/experimental/PaddleOcrExperiment.ts`. It is intentionally isolated from the Knowledge Engine and Claude/OpenAI providers. CLI: `pnpm free-ocr:unit2` (Unit 2.pdf only). Install: `scripts/install-free-ocr.sh`.

Reason

Allow comparing free OCR quality without risking production extraction / verification / publish flows.

Status

Implemented (experimental).

Docs: `knowledge/experiments/free-ocr/README.md`

---

2026-07-22

Decision

Manually transcribed TXT under `knowledge/books/original/` is the primary Knowledge Engine source. Import parses sections into `pages/` + `ocr/` with `provider=txt-source`. Vision OCR and PDF raster remain in the codebase but are inactive unless `OCR_ENABLED=1` (Future OCR Import). Admin UI demotes Run OCR accordingly.

Reason

Authoritative human transcripts replace OCR noise for Muallim curriculum extraction while preserving the optional OCR architecture.

Status

Implemented.

Docs: `docs/22-knowledge-engine.md`, `docs/23-ai-extraction.md`, `docs/28-admin-knowledge-management.md`

---

2026-07-22

Decision

Development auto-approval (`KNOWLEDGE_AUTO_APPROVE=1`, or `NODE_ENV=development` when the flag is unset) runs after import/extract: Approve → export/publish → rebuild `vocabulary-index.json`. Records `approvedBy=development-auto` with an explicit reason. `NODE_ENV=production` always disables this — manual verification remains mandatory. Admin shows "Auto Approved (Development)" badge.

Reason

Local TXT import should yield immediately searchable Muallim vocabulary for Quran word lookup without manual Admin steps, without weakening production review.

Status

Implemented.

---

2026-07-22

Decision

Quran word click uses verified Knowledge Lookup first (`GET /api/v1/knowledge/lookup`). Publish/export builds `knowledge/books/exports/vocabulary-index.json` for O(1) normalized Arabic lookup. AI teacher enrichment is opt-in via "مزید وضاحت استاد سے پوچھیں" and must never replace verified Muallim fields. Unknown words show a fixed Urdu message — no invented meanings. Sources: approved exports only (never raw TXT/original).

Reason

Recognition-first learning requires immediate, traceable Muallim vocabulary on click; AI is a teacher assistant, not the curriculum.

Status

Implemented.

CLI: `pnpm knowledge:rebuild-index`

---

2026-07-22

Decision

Canonical curriculum extraction is deterministic `txt-structure` parsing of manually transcribed TXT (not OCR, not AI). AI providers remain available only via `EXTRACTION_PROVIDER=claude|openai` for experiments. Export rebuilds four indexes: vocabulary, rules, lessons, references.

Reason

TXT is the source of truth; AI must teach from verified knowledge, never invent the knowledge base.

Status

Implemented.

---

2026-07-22

Decision

Canonical curriculum extraction is deterministic `txt-structure` parsing of manually transcribed TXT. AI never generates core vocabulary/rules/lessons. Export rebuilds four indexes: vocabulary-index, rules-index, lessons-index, references-index. Optional `EXTRACTION_PROVIDER=claude|openai` is experimental only.

Reason

TXT is the immutable source of truth; structured knowledge and O(1) lookup indexes must be generated automatically from it.

Status

Implemented.

---

2026-07-23

Decision

Word lookup uses smart Arabic candidates (normalize, dagger-alif ↔ alef, strip ال / proclitics و ف ب ك ل) against the Muallim vocabulary index. Rebuild also writes `data/quran/token-index.json` (surfaces + occurrence refs only — no meanings). Popup is meaning-first: no surah/ayah/page/juz; qaida only when a real rule exists; otherwise meaning alone. Never invent glosses for misses.

Reason

Coverage grows by matching Quran orthography to taught Muallim forms without fabricating curriculum content; the UI stays calm and recognition-first.

Status

Implemented.

---

2026-07-23

Decision

Quran click index only accepts clean single-word Muallim glosses: no multi-word phrases, no `->` transforms, no tashkeel-only "meanings", no sentence demos. Collision resolution prefers short word glosses. Bare `ل` is never stripped (avoids لولا↔ولا). Missing words stay unknown — never invent a meaning.

Reason

Wrong meanings were coming from sentence/example lines attached to sibling tokens; honest misses are better than false glosses.

Status

Implemented.

---

2026-07-23

Decision

Primary learner loop is three surfaces only: (1) inline Urdu meaning tooltip on Quran word tap, (2) chronological Muallim rules browser `/rules` (units 1–7 from rules-index, noise filtered), (3) tapped-words vocabulary list `/vocabulary` in localStorage. End-of-page meaning panel removed from the reader.

Reason

These three match the product mission: read, recognize, revise — without chatbot/quiz chrome.

Status

Implemented.

---

2026-07-23

Decision

`/rules` reads curated `learner-rules.json`: brief Muallim-based definitions only (unit + title + definition), chronological units 1–7, no page numbers, no exercise/question text. Word tooltip has no close button; dismisses on outside click; shows for every tapped word (verified meaning or honest unknown note).

Reason

Learner asked for clear rule definitions and frictionless inline meanings — noise and inventing both break trust.

Status

Implemented.

---

2026-07-23

Decision

Learner UI chrome is English-only (`DEFAULT_UI_LOCALE = "en"`, no LocaleToggle). Shared `AppShell` provides brand + primary nav. Lesson content (Muallim words, meanings, rules, ayah Arabic/Urdu) always stays Arabic/Urdu with RTL fonts and is never translated.

Reason

A calm English interface for chrome; keep educational content authentic and untranslated.

Status

Implemented.




---

2026-07-23

Decision

Unit ayah/chunk meanings (`data/curriculum/unit-ayahs.json`) prefer complete published glosses over truncated Muallim parentheses. Incomplete phrase glosses are completed by composing quranwbw Urdu WBW (same source as the mushaf reader). Near-full ayah gaps may use ur.jalandhry. Rebuild with `pnpm curriculum:export`.

Reason

Muallim demo lines often store partial paren meanings (e.g. "اپنے بندوں کو" for يُبَشِّرُ اللَّهُ عِبَادَهُ). Learners need the full phrase sense on the ayahs page without inventing curriculum.

Status

Implemented.



---

2026-07-23

Decision

Curriculum vocab export parses Muallim `lemma : كَانَ/لَا form (urdu)` and arrow lines so the Urdu parenthesis becomes the lemma meaning — never the Arabic form. Particle drills (`إِلَّا`/`فِي`/`يَا`/…) attach glosses to the form only. Unit 2 qisas `بِ` body-part glosses complete to `… کے بدلے` where Muallim left a bare noun.

Reason

Broken colon parsing produced entries like أُمَّةٌ → كَانَ أُمَّةً (عظیم پیشوا and رَسُولٌ → مگر رسول.

Status

Implemented.


---

2026-07-24

Decision

Memory-conscious production defaults for ~1GB Node hosts: in-process curriculum JSON cache, 12-page mushaf LRU (never all 604), slimmer Home RSC props, `serverExternalPackages` for openai/Prisma, Docker/`pnpm start:low-mem` with `--max-old-space-size=512`. Build must not run on the 1GB box.

Reason

Shared 1GB plans OOM on Next 15 when every request re-parses large curriculum JSON and when the heap is uncapped. Caching + heap caps make a dedicated 1GB VPS/Docker host workable; PHP-style shared “Node” panels may still kill the process for non-memory reasons.

Status

Implemented.


---

# Final Reminder

Every decision in this repository should answer one question:

"Does this help the learner understand the Quran more directly?"

If the answer is yes,

continue.

If the answer is no,

reconsider the implementation.

The learner is always more important than the technology.