# 17 - Coding Standards

> "Readable, maintainable code is an educational asset. Every module should be understandable by another developer months later."

---

# Purpose

This document defines the coding standards for the Quran Learning application.

Every developer and every AI coding assistant (Cursor, Claude Code, GitHub Copilot, etc.) must follow these standards.

Consistency is more important than cleverness.

---

# Core Principles

## 1. Clarity over cleverness

Write code that is easy to understand.

Avoid unnecessary abstractions.

Avoid "magic."

---

## 2. One responsibility

Every:

- Component
- Function
- Service
- Class
- Hook

should have one clear purpose.

---

## 3. Small files

Prefer:

100–250 lines

Avoid:

1000-line components.

Split when responsibilities grow.

---

## 4. Strong typing

Use TypeScript everywhere.

Never use:

```ts
any
```

Prefer:

```ts
unknown
```

when necessary.

---

# Naming

Use meaningful names.

Good

```ts
getVocabularyByLesson()
```

Bad

```ts
getData()
```

---

Variables

Good

```ts
currentLesson
learnerProgress
reviewQueue
selectedWord
```

Bad

```ts
obj
temp
x
data
```

---

Boolean names

Always begin with:

is

has

can

should

Example

```ts
isCompleted
hasReviewed
canContinue
shouldReview
```

---

# Folder Organization

Organize by feature.

Good

```
features/

reading/

teacher/

review/

curriculum/

learner/
```

Avoid

```
components/

hooks/

utils/

pages/

everything mixed together
```

---

# Component Rules

React components should:

Receive props.

Render UI.

Delegate logic elsewhere.

Avoid database access.

Avoid AI requests.

Avoid business logic.

---

Good

```
LessonCard

↓

Displays lesson
```

Bad

```
LessonCard

↓

Fetches lesson

↓

Updates progress

↓

Calls AI

↓

Renders UI
```

---

# Hooks

Custom hooks should encapsulate behavior.

Example

```
useReading()

useLesson()

useReview()

useTeacher()
```

Avoid generic hooks.

---

# Services

Business logic belongs inside services.

Example

```
TeacherService

KnowledgeService

ReviewService

ReadingService
```

Services communicate with repositories.

---

# Database Access

Never query the database directly from:

React components

Controllers

Hooks

Always use:

Repository

↓

Service

↓

API

---

# Error Handling

Every async operation must handle:

Network failure

Validation failure

Timeout

Unexpected exceptions

Never swallow errors.

---

# Logging

Log meaningful events.

Good

```
Vision extraction failed for page 42.
```

Bad

```
Error
```

---

# Comments

Write comments only when explaining:

Why

not

What

Bad

```ts
// increment i

i++
```

Good

```ts
// Confidence is reduced only after two consecutive failures
```

---

# Functions

Keep functions short.

Ideal:

10–30 lines.

Maximum:

~50 lines.

Extract helper functions when necessary.

---

# Constants

Avoid hardcoded values.

Good

```ts
const DAILY_STUDY_MINUTES = 20;
```

Bad

```ts
if (minutes > 20)
```

---

# Configuration

Environment-specific values belong in configuration.

Examples

API URLs

Storage paths

Feature flags

AI providers

---

# Async Code

Always use:

```ts
async / await
```

Avoid deeply nested promises.

---

# Validation

Validate all external input.

Never trust:

Forms

API requests

Uploaded files

AI responses

---

# AI Integration

Never call AI directly from UI components.

Correct flow:

```
UI

↓

API

↓

Teacher Service

↓

AI Adapter

↓

LLM
```

---

# Prompt Management

Never hardcode prompts inside services.

Store prompts separately.

Example

```
prompts/

teacher.md

vision.md

review.md
```

---

# Testing

Every service should have tests.

Critical areas:

Review logic

Progress tracking

Lesson progression

Knowledge extraction

AI adapters

---

# Code Formatting

Use:

Prettier

ESLint

Strict TypeScript

Automated formatting on commit.

---

# Imports

Prefer absolute imports.

Example

```ts
import { TeacherService } from "@/services/teacher";
```

Avoid long relative paths.

---

# Security

Never expose:

API keys

Secrets

Internal prompts

Database credentials

Keep sensitive logic on the server.

---

# Performance

Avoid unnecessary re-renders.

Lazy-load heavy modules.

Cache static data.

Optimize images.

Measure before optimizing.

---

# Accessibility

Every interactive element should have:

Accessible labels

Keyboard support

Adequate touch size

Readable contrast

---

# Internationalization

Although Version 1 is Urdu-first,

write code to support future localization.

Do not hardcode UI strings inside components.

---

# Git Workflow

Recommended branch names:

```
feature/quran-reader

feature/review-engine

feature/teacher-panel

fix/vocabulary-progress

refactor/knowledge-service
```

Commit messages

```
feat:

fix:

refactor:

docs:

test:

chore:
```

Example

```
feat: add learner review queue
```

---

# Pull Requests

Each PR should:

Have one purpose.

Pass tests.

Update documentation if needed.

Avoid unrelated changes.

---

# Definition of Done

A task is complete only when:

✓ Code works

✓ Tests pass

✓ Documentation updated

✓ Types are correct

✓ No console errors

✓ Code reviewed

---

# Refactoring

Refactor when:

A file becomes difficult to understand.

Logic is duplicated.

Responsibilities overlap.

Never refactor without tests.

---

# Final Principle

The codebase should be welcoming.

A new developer—or an AI coding assistant—should be able to understand any module quickly, make changes confidently, and preserve the educational integrity of the application.