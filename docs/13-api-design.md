# 13 - API Design

> "The API is the contract between the user interface and the learning system."

---

# Purpose

The API provides secure, consistent, and versioned access to every part of the Quran Learning platform.

The frontend must never access the database directly.

Every interaction should go through the API.

---

# API Philosophy

The API should be:

- REST-first
- Stateless
- Versioned
- Predictable
- Fast
- Well documented

Future GraphQL support is optional.

---

# API Versioning

Always version the API.

Example

/api/v1/

Future

/api/v2/

Never introduce breaking changes without a new version.

---

# Authentication

Every learner has a secure account.

Authentication options:

- Email + Password
- Google
- Apple
- Anonymous Guest (future)

Use JWT or secure session tokens.

Never expose internal IDs.

---

# API Modules

The API is divided into independent modules.

```
Authentication API

Curriculum API

Reading API

Teacher API

Knowledge API

Review API

Learner API

Vision API (Admin)

Admin API
```

Each module has one responsibility.

---

# Authentication API

Base:

```
/api/v1/auth
```

Endpoints

POST /login

POST /logout

POST /register

POST /refresh

GET /me

Purpose

Manage learner identity.

---

# Learner API

```
/api/v1/learner
```

Examples

GET /profile

PATCH /profile

GET /progress

GET /dashboard

GET /statistics

GET /preferences

PATCH /preferences

---

# Curriculum API

```
/api/v1/curriculum
```

Examples

GET /today

GET /lesson/:id

GET /unit/:id

GET /volume/:id

GET /next

GET /previous

The frontend never decides lesson order.

---

# Reading API

```
/api/v1/reading
```

Examples

GET /resume

POST /start-session

POST /finish-session

POST /bookmark

DELETE /bookmark

GET /bookmarks

PATCH /current-position

---

# Quran API

```
/api/v1/quran
```

Examples

GET /juz/1

GET /surah/2

GET /ayah

GET /word

GET /page

GET /search

The Quran is served independently from lessons.

---

# Vocabulary API

```
/api/v1/vocabulary
```

Examples

GET /word/:id

GET /lesson/:id

GET /review

GET /history

GET /search

PATCH /notes

---

# Rule API

```
/api/v1/rules
```

Examples

GET /rule/:id

GET /lesson/:id

GET /review

---

# Teacher API

```
/api/v1/teacher
```

Main endpoint

POST /ask

Input

Question

Current Context

Selected Word

Output

Answer

Hint

Related Lesson

Related Rule

Suggested Review

The frontend never communicates directly with an LLM.

---

# Review API

```
/api/v1/review
```

Examples

GET /today

POST /complete

GET /history

GET /queue

POST /skip

PATCH /confidence

---

# Knowledge API

```
/api/v1/knowledge
```

Examples

GET /lesson

GET /exercise

GET /examples

GET /relationships

Used internally by the Teacher Engine.

---

# Vision API

(Admin only)

```
/api/v1/vision
```

Examples

POST /upload-book

POST /process-page

POST /reprocess

GET /status

POST /verify

Never exposed to learners.

---

# Admin API

```
/api/v1/admin
```

Examples

Books

Lessons

Vocabulary

Rules

Exercises

Verification

Users

Analytics

Restricted access only.

---

# Standard Response Format

Every endpoint returns:

```json
{
  "success": true,
  "data": {},
  "message": "",
  "timestamp": ""
}
```

Errors:

```json
{
  "success": false,
  "error": {
    "code": "LESSON_NOT_FOUND",
    "message": "Lesson not found."
  }
}
```

Keep responses consistent.

---

# Pagination

Large datasets must support:

page

limit

total

Example

```
GET /lessons?page=2&limit=20
```

---

# Search

Support:

Vocabulary

Rules

Lessons

Exercises

Quran

Search should not require AI.

---

# Rate Limiting

Protect expensive endpoints.

Especially:

Teacher API

Vision API

Authentication

Prevent abuse.

---

# Caching

Cache:

Quran

Lessons

Vocabulary

Rules

Static curriculum

Do NOT cache:

Learner progress

Teacher responses

Reviews

---

# Validation

Every request is validated.

Reject:

Missing fields

Invalid IDs

Invalid lesson order

Unauthorized access

Never trust frontend input.

---

# Logging

Log:

Errors

Latency

Failures

Authentication

Vision processing

AI requests

Do not log personal reflections unnecessarily.

---

# Security

Never expose:

API keys

Prompt templates

Database credentials

Internal system prompts

Always validate ownership of learner data.

---

# File Uploads

Support uploads for:

Muallim PDFs

Future audio

Future images

Maximum size configurable.

Virus scan recommended.

---

# Future APIs

The architecture should allow:

Speech API

Audio API

Teacher Notes API

Community API

Family API

Analytics API

Without redesigning existing endpoints.

---

# Internal Communication

Modules communicate through services.

Never call database logic directly from controllers.

Example

```
Controller

↓

Service

↓

Repository

↓

Database
```

This keeps the codebase maintainable.

---

# Success Criteria

The API is successful when:

The frontend remains simple.

The mobile app can reuse the same endpoints.

AI providers can change without changing the frontend.

Business logic exists only in backend services.

Version upgrades do not break existing clients.

---

# Final Principle

The API should expose the learning system—not the database.

Every endpoint should represent an educational action, not just a CRUD operation.

The API exists to support the learner's journey through the Quran with clarity, stability, and long-term maintainability.