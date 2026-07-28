# Quran Learning System

> **Open the Quran and gradually understand it without relying on translation.**

---

# Vision

The Quran Learning System is an AI-assisted learning platform designed to help Urdu-speaking learners understand the Quran naturally through **recognition**, **repetition**, and **guided learning**.

The application follows the educational methodology of **Muallim-ul-Quran** and does **not** attempt to replace it.

The AI acts as a patient teacher that assists the learner while gradually reducing their dependence on both translation and AI.

The ultimate goal is:

> **A learner should be able to open the Quran and understand it directly, without constantly referring to a translation.**

---

# Core Philosophy

This project follows a simple educational philosophy:

```
Read

↓

Recognize

↓

Understand

↓

Practice

↓

Review

↓

Reflect

↓

Repeat
```

Grammar is **not** the primary teaching method.

Recognition comes first.

Understanding develops naturally.

---

# Educational Source

The primary educational source is:

**Muallim-ul-Quran**

The books are provided as **manually transcribed TXT files** under `knowledge/books/original/` (primary knowledge source). Scanned PDFs / Vision OCR remain available as an optional Future OCR Import path (`OCR_ENABLED=1`) but are not used in the normal workflow.

They are the **source of truth** for:

- Lessons
- Vocabulary
- Rules
- Exercises
- Teaching methodology

The AI never replaces the books.

---

# Project Goals

The learner should gradually:

- Read the Quran confidently
- Recognize frequently occurring Quranic words
- Understand verses naturally
- Review forgotten words
- Build long-term retention
- Depend less on translation
- Depend less on AI

---

# What This Project Is

✅ AI-assisted Quran learning platform

✅ Recognition-first learning

✅ Muallim-ul-Quran based curriculum

✅ Reading-first education

✅ Vocabulary-centered learning

✅ Urdu-first experience

---

# What This Project Is NOT

❌ Translation app

❌ Arabic grammar course

❌ Generic AI chatbot

❌ Social platform

❌ Quiz application

❌ Gamified learning app

---

# Getting Started (Milestone 1 Foundation)

```bash
pnpm install
cp .env.example .env.local
cp .env.local .env          # Prisma CLI reads .env
# Fill Supabase DATABASE_URL + API keys
pnpm db:generate
pnpm db:migrate             # requires a live PostgreSQL (Supabase)
pnpm dev
```

Open:

- `/` — home with Continue Reading / session / dashboard
- `/quran` — Quran reader (resumes last page)
- `/quran?page=1` — start at page 1
- `/dashboard` — learner progress (Milestone 4)
- `/session` — daily learning session (15–20 min)

Health check: `GET /api/v1/health`

Quran page API: `GET /api/v1/quran/page/1`

Fonts: place `JameelNooriNastaleeqRegular.ttf` and `IndoPakQuran.ttf` in `public/fonts/`.

Authentication is available (Milestone 7). Guest mode still works for reading without an account.  
Sign in: `/auth/login` · Profile / sync: `/auth/profile`  
Learner state: `data/learner/` · Cloud sync snapshots: `data/sync/cloud/` (or Supabase Auth + Prisma `LearnerCloudState`).  
Set `AUTH_PROVIDER=memory` to force local auth without Supabase.

Knowledge pipeline (Milestone 3 + 3.5): see `docs/22-knowledge-engine.md` and `docs/23-ai-extraction.md`  
Learning engine (Milestone 4): see `docs/24-learning-engine.md`  
AI Teacher (Milestone 5): see `docs/25-ai-teacher.md` — panel on `/quran`  
Personalization (Milestone 6): see `docs/26-personalization-engine.md` — extended `/dashboard`  
Auth & sync (Milestone 7): see `docs/27-authentication-and-sync.md`  
Admin & knowledge management (Milestone 8): see `docs/28-admin-knowledge-management.md`  
Admin dashboard: `/admin` · Books review: `/admin/knowledge` · Search: `/admin/search`  
Staff data: `data/admin/` · **Production:** never set `ADMIN_OPEN_LOCAL`. Local opt-in: `ADMIN_OPEN_LOCAL=1`.  
Production readiness (Milestone 9): `docs/29-production-readiness.md`  
Deploy: `docs/30-deployment-guide.md` · Maintain: `docs/31-maintenance-guide.md`  
Health: `GET /api/v1/health` · Ready: `GET /api/v1/ready`  
CI: `.github/workflows/ci.yml` · Docker: `Dockerfile`  
Set `AI_PROVIDER=claude` + `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`) for live **extraction** and AI Teacher (otherwise stubs are used). Vision OCR stays off unless `OCR_ENABLED=1`.  
CLI: `pnpm knowledge:discover` / `pnpm knowledge:import` / `pnpm knowledge:extract -- --slug=unit-1` / `pnpm knowledge:rebuild-index`

Local development: set `KNOWLEDGE_AUTO_APPROVE=1` in `.env.local` so import/extract also auto-approve, publish, and rebuild the vocabulary index. Production always requires manual Admin approval.

Reader details: `docs/21-quran-reader.md`  
Setup notes: `docs/20-foundation-setup.md`

**Learner features manual:** [`docs/learner/features-manual.md`](docs/learner/features-manual.md) (also in-app at `/help`)

---

# Technology Stack

## Frontend

- Next.js 15 (App Router)
- TypeScript (strict)
- Tailwind CSS v4

---

## Backend

- Next.js API Routes
- Prisma ORM 6
- PostgreSQL
- Supabase

---

## AI

- OpenAI API (primary)
- Provider abstraction for future AI models

---

## Knowledge import (TXT primary)

The application ingests manually transcribed Muallim-ul-Quran TXT files.

Pipeline:

```
TXT (original/, immutable)

↓

Parser (sections)

↓

AI Extraction

↓

Manual Verification

↓

Knowledge Base
```

Optional Future OCR Import (`OCR_ENABLED=1`): PDF → images → Vision OCR → same extraction path.

---

# Repository Structure

```
quran-learning-app/

├── AGENTS.md
├── README.md
│
├── docs/
├── tasks/
├── knowledge/          # Muallim books + extraction docs
├── cursor/             # RULES.md, PROMPTS.md, MEMORY.md
│
├── app/                # Next.js App Router
├── components/
├── features/           # Feature-first modules
├── lib/                # env, db, supabase, constants
├── services/
├── stores/
├── types/
├── prisma/
└── public/fonts/
```

---

# Important Documents

## AGENTS.md

The highest authority in the repository.

Defines:

- Project mission
- Educational philosophy
- Development workflow
- Coding expectations

Cursor should always read this first.

---

## .cursor/RULES.md

Contains:

- Coding rules
- Architecture rules
- Database rules
- Security rules
- Testing rules

---

## .cursor/PROMPTS.md

Contains every AI prompt used by the application.

No prompts should be hardcoded.

---

## .cursor/MEMORY.md

Stores long-term architectural decisions.

Explains why decisions were made.

---

## knowledge/KNOWLEDGE-BASE.md

Defines:

- Muallim-ul-Quran processing
- OCR
- Extraction
- Verification
- Educational data model

---

# Learning Flow

A typical learning session lasts **15–20 minutes**.

```
Review

↓

Continue Reading

↓

Tap Unknown Word

↓

AI Recognition

↓

Explanation

↓

Practice

↓

Reflection

↓

Save Progress
```

The learner should spend more time reading than chatting with AI.

---

# AI Teacher

The AI behaves like a Quran teacher.

It should:

- Encourage recognition
- Ask questions
- Give hints
- Explain simply
- Connect answers to Muallim lessons
- Track learner progress

The AI should never:

- Invent lessons
- Invent rules
- Guess meanings
- Contradict the knowledge base
- Replace the curriculum

---

# Knowledge Base

The Muallim-ul-Quran books are converted into structured educational data.

Examples:

- Units
- Lessons
- Vocabulary
- Rules
- Exercises
- Review Questions

Every item remains traceable to its original page.

---

# Development Workflow

Before implementing any feature:

1. Read `AGENTS.md`
2. Read the relevant documents in `/docs`
3. Read `.cursor/RULES.md`
4. Read `.cursor/PROMPTS.md`
5. Read `.cursor/MEMORY.md`
6. Review `tasks/IMPLEMENTATION-PLAN.md`
7. Explain the implementation plan
8. Implement
9. Test
10. Update documentation

---

# Guiding Principles

Every implementation should satisfy the following:

- Keep the Quran central to the experience.
- Preserve the Muallim-ul-Quran methodology.
- Favor recognition over translation.
- Favor simplicity over complexity.
- Use AI only when it adds educational value.
- Keep the interface calm and distraction-free.

---

# Long-Term Roadmap

## Phase 1

- Project setup
- Authentication
- Database
- Quran reader

---

## Phase 2

- Vocabulary tracking
- Rule tracking
- Bookmarks
- Reading progress

---

## Phase 3

- AI teacher
- Word recognition
- Daily review
- Reflection

---

## Phase 4

- OCR pipeline
- Knowledge extraction
- Verification tools

---

## Phase 5

- Spaced repetition
- Offline support
- Mobile application
- Voice assistance

---

# Definition of Success

The project is successful when a learner can:

- Open the Quran confidently.
- Recognize a growing number of Quranic words.
- Understand verses naturally.
- Require translation less often.
- Use the AI less over time because genuine understanding has developed.

---

# License

This project is intended for educational purposes.

The Muallim-ul-Quran books remain the intellectual property of their respective publishers and are used as the educational foundation for personal learning. Any distribution or commercial use of the original books must comply with applicable copyright and licensing requirements.

---

# Final Principle

> **Every feature should help the learner move one step closer to understanding the Quran directly, with less dependence on translation and less dependence on AI.**