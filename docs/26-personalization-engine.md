# 26 - Personalization Engine

> Adapt teaching and recommendations to each learner over time — without inventing curriculum or replacing the Learning Engine.

---

## Purpose

The Personalization Engine builds a learner profile from Learning Engine state and produces:

- Smart recommendations (never random)
- Progress insights
- Daily study plans
- Adaptation hints for the AI Teacher

Educational content remains in Muallim / Learning Engine. Analytics stay separate.

---

## Architecture

```
createPersonalizationEngine()
  ├─ LearnerProfileService
  ├─ WeaknessAnalyzer
  ├─ StrengthAnalyzer
  ├─ InsightService
  ├─ RecommendationService
  ├─ StudyPlanner
  └─ AdaptationEngine
```

Preferences (explanation style) are file-backed (`data/personalization/`).  
Profile fields are **derived** from learning progress — not duplicated curriculum rows.

---

## Learner profile

Tracks (computed):

- Current unit / lesson / juz / page
- Reading speed (pages per session proxy)
- Daily streak, average session duration
- Known / weak / strong vocabulary
- Rules mastered / needing review
- Confidence trend
- Preferred explanation style (`brief` | `guided` | `detailed`)

---

## Recommendations

Examples:

- Continue where you stopped
- Practice today's review queue
- Review weak words
- Revise a struggling rule
- Repeat current lesson
- Read two more pages

Priority-ordered from learner state.

---

## Personalized AI

`AdaptationEngine` injects hints into Teacher `ContextBuilder` / prompts / stub explanations:

- explanation depth
- emphasize recognition
- reinforce known words
- gentle weak-word cues
- avoid overwhelm

---

## APIs

| Method | Path | Purpose |
|--------|------|---------|
| GET/PATCH | `/api/v1/personalization/profile` | Profile + style preference |
| GET | `/api/v1/personalization/recommendations` | Smart recommendations |
| GET | `/api/v1/personalization/insights` | Progress insights |
| GET | `/api/v1/personalization/study-plan` | Daily plan |
| GET | `/api/v1/personalization/analytics` | Combined analytics |

---

## Dashboard

`/dashboard` now includes personalization: recommendations, study plan, weekly summary, improved/difficult vocabulary.

---

## Database

Migration `20260721210000_personalization`:

- `ExplanationStyle` enum
- `LearnerPreferences.preferredExplanationStyle`
- `LearnerAnalyticsSnapshot` (optional future cache; live compute used today)

---

## Out of scope

- Push notifications
- Multiplayer / social
