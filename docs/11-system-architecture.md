# 11 - System Architecture

> "A good architecture allows every part of the system to evolve independently while working together seamlessly."

---

# Purpose

This document defines the complete software architecture for the Quran Learning application.

It explains:

- System layers
- Core modules
- Data flow
- AI integration
- Communication between engines
- Scalability
- Offline support
- Future expansion

This architecture should remain stable even if technologies or AI providers change.

---

# Architectural Philosophy

The application is built around one activity:

Reading the Quran.

Everything else exists to support that activity.

The architecture should therefore be:

- Modular
- Observable
- Replaceable
- Testable
- Scalable

Every module should have one responsibility.

---

# High-Level Layers

```
┌─────────────────────────────────────────────┐
│              Presentation Layer             │
│---------------------------------------------│
│ Urdu UI                                     │
│ Quran Reader                                │
│ AI Teacher Panel                            │
│ Progress Dashboard                          │
│ Settings                                    │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│               Application Layer             │
│---------------------------------------------│
│ Reading Engine                              │
│ Teacher Engine                              │
│ Curriculum Engine                           │
│ Learner Engine                              │
│ Memory & Review Engine                      │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│                Knowledge Layer              │
│---------------------------------------------│
│ Knowledge Engine                            │
│ Vision Pipeline                             │
│ Search                                      │
│ Knowledge Graph                             │
│ AI Services                                 │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│                  Data Layer                 │
│---------------------------------------------│
│ PostgreSQL                                  │
│ pgvector                                    │
│ Redis                                       │
│ Storage (PDFs & Images)                     │
└─────────────────────────────────────────────┘
```

---

# Core Modules

The application is composed of independent modules.

Each module has one responsibility.

## 1. Reading Module

Responsible for:

- Displaying Quran
- Tracking reading
- Word selection
- Bookmarks
- Resume reading

Never performs AI reasoning.

---

## 2. Teacher Module

Responsible for:

- Answering learner questions
- Giving hints
- Guiding understanding
- Referring to Muallim lessons

Never stores data permanently.

---

## 3. Curriculum Module

Responsible for:

- Lesson order
- Unit progression
- Daily lesson
- Prerequisites
- Lesson completion

The curriculum cannot be changed by AI.

---

## 4. Learner Module

Responsible for:

- Vocabulary confidence
- Rule confidence
- Reading history
- Study progress
- Personal notes

This module represents the learner.

---

## 5. Memory Module

Responsible for:

- Review scheduling
- Forgetting model
- Spaced repetition
- Revision queue

---

## 6. Knowledge Module

Responsible for:

- Structured lessons
- Vocabulary
- Rules
- Exercises
- Quran links

Provides educational content to the Teacher Module.

---

## 7. Vision Module

Responsible for:

- Understanding image PDFs
- Extracting structured curriculum
- Updating knowledge

Runs only during import or reprocessing.

---

# Request Flow

Example:

The learner taps a Quranic word.

```
Learner
   │
   ▼
Reading Module
   │
   ▼
Teacher Module
   │
   ▼
Knowledge Module
   │
   ▼
Learner Module
   │
   ▼
AI Model
   │
   ▼
Teacher Module
   │
   ▼
Reading Module
   │
   ▼
Learner
```

The Reading Module never talks directly to the AI.

---

# AI Orchestration

The AI receives only the context it needs.

Example context:

- Current lesson
- Current ayah
- Related Muallim rule
- Learner confidence
- Previous mistakes

Never send the entire database.

---

# Context Builder

Before every AI request:

Build context.

```
Current Ayah
       +
Current Lesson
       +
Related Vocabulary
       +
Related Rules
       +
Learner Progress
       +
Review Status
       +
Question
```

This context is sent to the AI.

---

# State Management

The application has three types of state.

## Session State

Current screen

Current ayah

Current lesson

Temporary UI state

---

## Learner State

Vocabulary confidence

Rules

Progress

History

Bookmarks

Persistent.

---

## Knowledge State

Lessons

Rules

Exercises

Vocabulary

Static.

---

# Offline Mode

Available offline:

- Quran
- Muallim lessons
- Vocabulary
- Rules
- Reading history
- Reviews
- Bookmarks

Unavailable offline:

- AI explanations
- PDF processing
- Cloud synchronization

---

# Synchronization

When online:

Upload:

Progress

Notes

Reviews

Bookmarks

Reading history

Never upload unnecessary data.

---

# Security

The system should protect:

Learner progress

Personal notes

Uploaded books

API keys

Database credentials

No sensitive information should reach the client.

---

# Error Handling

If AI fails:

Continue reading.

If search fails:

Use cached lesson.

If internet fails:

Continue offline.

Reading should never stop.

---

# Performance Goals

App startup:

< 2 seconds

Word lookup:

< 200 ms

Lesson loading:

< 300 ms

Review generation:

< 1 second

AI response:

Target 2–5 seconds

Reading must always remain responsive.

---

# Scalability

Support:

Multiple learners

Multiple curricula

Additional languages

Different AI providers

Additional books

Without changing the core architecture.

---

# Logging

Log:

Errors

Vision processing

AI latency

Review generation

Database migrations

Do not log Quran reading content unnecessarily.

---

# Monitoring

Monitor:

API latency

Vision failures

Search performance

Database health

Storage usage

AI costs

Use metrics to improve the system.

---

# Dependency Direction

Dependencies should always point inward.

```
Presentation
      │
Application
      │
Knowledge
      │
Data
```

Lower layers never depend on higher layers.

---

# Technology Recommendations

Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

Backend

- NestJS (or Next.js API routes for MVP)
- TypeScript

Database

- PostgreSQL
- Prisma ORM
- pgvector

Storage

- Supabase Storage or Cloudflare R2

Authentication

- Clerk or Supabase Auth

AI Providers

- OpenAI
- Anthropic
- Google Gemini

Use adapters so providers can be switched.

---

# Design Rules

Every module should:

- Have one responsibility.
- Be independently testable.
- Expose a clear API.
- Avoid direct database access from the UI.
- Avoid business logic in components.

---

# Future Extensions

The architecture should support:

- Audio recitation
- Speech recognition
- Teacher mode
- Multiple Muallim curricula
- Family accounts
- Classroom mode
- AI-generated revision plans
- Offline AI models

No redesign should be required.

---

# Success Criteria

The architecture is successful when:

- Reading remains smooth.
- AI is optional, not central.
- Modules are loosely coupled.
- New features are easy to add.
- AI providers can be replaced.
- The learner's progress is preserved.

---

# Final Principle

The architecture exists to make the learner's journey stable.

Technologies will change.

AI models will improve.

Databases may evolve.

But the learner's path—from opening the Quran to understanding it directly—must remain uninterrupted.