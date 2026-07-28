# 24 - Learning Engine

> Recognition-first learning without requiring AI. The Learning Engine is the teacher; AI is an optional assistant later.

---

## Purpose

Help the learner gradually recognize Quranic words while reading, measure understanding, and schedule revision.

Works with AI disabled.

---

## Learning sequence

```
Read → Recognize → Understand → Practice → Review → Repeat
```

Never teach grammar or translation first.

---

## Architecture

```
createLearningEngine()
  ├─ VocabularyService
  ├─ LearningService
  ├─ ReviewService
  ├─ RuleService
  ├─ LessonService
  ├─ ProgressAnalyticsService
  ├─ ReflectionService
  └─ SessionService
```

Storage: file-backed local learner (`data/learner/`) while auth is deferred. Prisma models mirror progress for future cloud sync.

Curriculum: seed data in `features/learning/curriculum/seed.ts` until approved knowledge exports are available.

---

## Vocabulary stages

```
Unknown → Seen → Recognizing → Understood → Mastered
                    ↘ Needs Review ↗
```

Stages never skip automatically — one step per successful event.

Confidence: 0–100. Drives spaced-repetition intervals.

---

## Daily session (15–20 min)

```
Review → Reading → Recognize → New words → Reflection → Finish
```

UI: `/session`  
Dashboard: `/dashboard`

---

## APIs

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/v1/learning/vocabulary` | Curriculum + events |
| GET/POST | `/api/v1/learning/lessons` | Lessons + progress |
| GET/POST | `/api/v1/learning/rules` | Rules + understanding |
| GET/POST | `/api/v1/learning/session` | Daily session |
| GET | `/api/v1/learning/progress` | Raw progress |
| GET/POST | `/api/v1/learning/review` | Spaced review queue |
| GET/POST | `/api/v1/learning/reflections` | Session reflections |
| GET | `/api/v1/learning/dashboard` | Dashboard summary |

---

## Database

Migration `20260721190000_learning_engine` adds:

- `LearningStage`, `LearningSessionPhase`, `LearningSessionStatus`
- Progress stage / mastery fields
- `LearningSession` table
- Structured reflection fields
- `Vocabulary.occurrenceCount`

---

## Out of scope (later)

- Conversational chatbot beyond Muallim teaching
- Authentication
- Gamification / notifications
