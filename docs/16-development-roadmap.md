# 16 - Development Roadmap

> "Build the smallest system that genuinely helps someone understand the Quran. Then improve it step by step."

---

# Purpose

This roadmap defines the recommended development order.

The project should be built in small, testable phases.

Every phase should produce a working application.

Never build features that have no immediate educational value.

---

# Guiding Principles

1. Reading comes before AI.

2. Structure comes before intelligence.

3. Simplicity comes before automation.

4. Manual verification comes before full automation.

5. Understanding comes before features.

---

# Overall Timeline

Phase 0

↓

Foundation

↓

Phase 1

Core Reading App

↓

Phase 2

Learning System

↓

Phase 3

AI Teacher

↓

Phase 4

Knowledge Extraction

↓

Phase 5

Polish & Scale

---

# Phase 0 — Foundation

Goal

Prepare the project for long-term development.

Tasks

- Create monorepo
- Configure TypeScript
- Configure Next.js
- Configure Tailwind CSS
- Configure Prisma
- Configure PostgreSQL
- Configure Supabase
- Configure authentication
- Configure linting
- Configure formatting
- Configure testing
- Configure CI/CD

Deliverable

A clean project with no learning features yet.

---

# Phase 1 — Core Reading App

Goal

Create the smallest useful application.

Features

✓ Login

✓ Dashboard

✓ Quran Reader

✓ Resume Reading

✓ Bookmarks

✓ Reading Sessions

✓ Urdu Interface

✓ Indo-Pak Quran Font

✓ Jameel Noori Nastaleeq

No AI.

No Muallim.

No reviews.

Deliverable

A learner can comfortably read the Quran.

---

# Phase 2 — Learning System

Goal

Introduce structured learning.

Features

✓ Lessons

✓ Vocabulary

✓ Rules

✓ Exercises

✓ Progress Tracking

✓ Confidence Scores

✓ Lesson Completion

✓ Personal Notes

Deliverable

The application becomes a Quran learning platform.

Still no AI.

---

# Phase 3 — Memory & Review

Goal

Help the learner remember.

Features

✓ Review Queue

✓ Daily Review

✓ Recognition Practice

✓ Rule Revision

✓ Vocabulary Confidence

✓ Reflection

Deliverable

The learner begins retaining vocabulary over time.

---

# Phase 4 — AI Teacher

Goal

Introduce guided assistance.

Features

✓ Teacher Panel

✓ Word Explanations

✓ Guided Hints

✓ Recognition Questions

✓ Lesson Connections

✓ Gentle Encouragement

Restrictions

AI never changes curriculum.

AI never creates lessons.

Deliverable

The learner has a digital Muallim.

---

# Phase 5 — Muallim Knowledge Base

Goal

Import the books.

Features

✓ Upload PDFs

✓ Vision Processing

✓ Lesson Extraction

✓ Vocabulary Extraction

✓ Rule Extraction

✓ Exercise Extraction

✓ Manual Verification

Deliverable

The curriculum becomes searchable.

---

# Phase 6 — Knowledge Graph

Goal

Connect everything.

Relationships

Word

↓

Lesson

↓

Rule

↓

Exercise

↓

Quran Verse

↓

Learner

↓

Review

Deliverable

The AI can reason using structured knowledge.

---

# Phase 7 — Optimization

Goal

Improve speed.

Tasks

Caching

Indexes

Search

Image Optimization

Lazy Loading

API Optimization

Performance Monitoring

Deliverable

Fast production application.

---

# Phase 8 — Mobile Experience

Goal

Prepare for mobile-first usage.

Tasks

Responsive Design

PWA

Offline Reading

Offline Lessons

Offline Reviews

Deliverable

Comfortable daily learning anywhere.

---

# Phase 9 — Advanced Features

Only after everything else is stable.

Possible additions

Voice Interaction

Recitation

Speech Recognition

Teacher Dashboard

Analytics

Community Features

Multiple Curricula

Family Accounts

Multiple Languages

None of these belong in Version 1.

---

# MVP Definition

Version 1 is complete when a learner can:

✓ Open the app

✓ Continue reading

✓ Tap an unknown word

✓ Receive help

✓ Learn the related Muallim lesson

✓ Finish reading

✓ Complete today's review

✓ Resume tomorrow

Nothing more is required.

---

# Development Priorities

Priority 1

Reading Experience

---

Priority 2

Knowledge Structure

---

Priority 3

Review

---

Priority 4

AI Assistance

---

Priority 5

Automation

---

Priority 6

Advanced Features

---

# Weekly Milestones

Week 1

Project setup

Week 2

Authentication

Week 3

Quran Reader

Week 4

Progress Tracking

Week 5

Lessons

Week 6

Vocabulary

Week 7

Review System

Week 8

AI Teacher

Week 9

Vision Pipeline

Week 10

Knowledge Graph

Adjust the schedule as needed, but maintain the order.

---

# Testing Strategy

Every phase must include:

Unit Tests

Integration Tests

Manual Testing

Educational Testing

Never postpone testing until the end.

---

# Success Criteria Per Phase

Before moving to the next phase:

The previous phase must be stable.

No major bugs.

No broken learner progress.

No unfinished architecture.

---

# Technical Debt

Allowed

Small UI improvements

Minor refactoring

Performance tuning

Not Allowed

Breaking database schema repeatedly

Skipping tests

Duplicating logic

Embedding business logic in UI

---

# Release Strategy

Internal Alpha

↓

Private Beta

↓

Personal Daily Use

↓

Small User Group

↓

Public Release

The application should mature through real usage.

---

# Versioning

v0.1

Reader

v0.2

Lessons

v0.3

Reviews

v0.4

AI Teacher

v0.5

Knowledge Base

v1.0

Complete Personal Learning System

---

# What NOT to Build Initially

❌ Gamification

❌ Leaderboards

❌ Badges

❌ Social Feed

❌ Daily Quotes

❌ AI Chat Home Screen

❌ Complex Analytics

❌ Fancy Animations

❌ Multi-language Support

❌ Voice Chat

Stay focused.

---

# Definition of Success

The project is successful when:

A learner spends 15–20 minutes every day.

Reads the Quran.

Recognizes more words each month.

Needs less AI assistance.

Gradually understands the Quran directly.

The learner becomes more independent over time.

---

# Final Principle

Every line of code should answer one question:

"Does this help the learner understand the Quran without relying on translation?"

If the answer is no, it probably does not belong in the application.