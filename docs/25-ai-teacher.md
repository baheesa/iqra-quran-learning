# 25 - AI Teacher

> The Learning Engine decides **what** to teach. The AI Teacher decides **how** to explain — as a Muallim-style guide, never a chatbot.

---

## Purpose

Help the learner gradually understand the Quran directly using Muallim-ul-Quran methodology.

- Recognition before translation
- Hints before answers
- Simple Urdu
- Verified knowledge first
- Encourage continued reading

---

## Architecture

```
createTeacherEngine()
  ├─ ContextBuilder
  ├─ KnowledgeRetriever
  ├─ PromptService          (cursor/PROMPTS.md)
  ├─ TeacherService
  ├─ ConversationService
  ├─ ExplanationService     (stub / offline path)
  ├─ SuggestionService
  └─ ResponseFormatter
```

LLM: OpenAI when `OPENAI_API_KEY` is set; otherwise recognition-first stub explanations.

---

## Context Builder

Minimum context per request:

- Reading: page, juz, surah, ayah, selected word/phrase
- Learner: known / unknown / weak vocabulary, review queue, reflections, stage summary
- Related lesson + rule
- Knowledge references

Learning Engine remains the source of learner state.

---

## Knowledge retrieval

1. Search **APPROVED** knowledge exports (`knowledge/books/exports/`)
2. Fall back to curriculum seed for learning context only
3. Never present seed as verified Muallim book content
4. Responses distinguish **معلم القرآن (تصدیق شدہ)** vs **عام وضاحت**

---

## Prompts

Loaded from `cursor/PROMPTS.md` via `PromptService`:

| Intent | Prompt |
|--------|--------|
| ASK | Prompt 1 — Teacher |
| WORD / PHRASE | Word Recognition |
| LESSON | Vocabulary Explanation |
| RULE | Rule Explanation |
| REVIEW_SUGGESTION | Daily Review |

Also applied: Recognition First, Grammar Guard, Hallucination Prevention, Urdu Style Guide.

---

## APIs

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/teacher/ask` | Ask teacher |
| POST | `/api/v1/teacher/word` | Word explanation |
| POST | `/api/v1/teacher/lesson` | Lesson explanation |
| POST | `/api/v1/teacher/rule` | Rule explanation |
| GET | `/api/v1/teacher/conversations` | History |
| POST | `/api/v1/teacher/context` | Context preview |

---

## UI

- `TeacherPanel` on `/quran` (reading-focused)
- Word panel: “استاد سے اس لفظ کے بارے میں پوچھیں”

---

## Storage

- File: `data/teacher/local-learner.json` (auth deferred)
- Prisma: `TeacherConversation`, `TeacherMessage`, `TeacherFeedback` (future sync)

---

## Out of scope

- Grammar tutor / translation mode
- General Islamic Q&A chatbot
- Authentication (next milestone)
