# AGENTS.md

# =============================================================================
# Quran Learning System
# Master Instructions for Cursor AI
# =============================================================================

Version: 1.0

Author: Project Owner

Purpose:

This document is the highest authority in this repository.

Before making ANY change, Cursor must read this document.

If documentation conflicts with code, documentation wins.

If AGENTS.md conflicts with any other document,
AGENTS.md wins.

=============================================================================
MISSION
=============================================================================

This project exists for ONE purpose.

Help a learner gradually understand the Quran directly WITHOUT relying on translation.

Everything built inside this repository must contribute toward that mission.

If a feature does not improve learning,
do not build it.

=============================================================================
WHAT THIS PROJECT IS
=============================================================================

This is:

• AI-assisted Quran learning platform

• Muallim-ul-Quran based curriculum

• Recognition-first learning system

• Reading-first learning experience

• Vocabulary-centered education

• Long-term learning companion

=============================================================================
WHAT THIS PROJECT IS NOT
=============================================================================

Do NOT turn this into:

❌ A chatbot

❌ A translation app

❌ A grammar course

❌ A social network

❌ A gamification platform

❌ A quiz application

❌ A generic LMS

The Quran remains the focus.

=============================================================================
EDUCATIONAL PHILOSOPHY
=============================================================================

The educational hierarchy is:

1. Quran

↓

2. Muallim-ul-Quran

↓

3. Verified Knowledge Base

↓

4. AI Teacher

↓

5. User Interface

Technology serves education.

Never the opposite.

=============================================================================
LEARNING PHILOSOPHY
=============================================================================

Always teach in this order:

Reading

↓

Recognition

↓

Understanding

↓

Practice

↓

Reflection

↓

Revision

Grammar should appear only when it genuinely helps understanding.

Never make grammar the primary learning method.

=============================================================================
THE ROLE OF AI
=============================================================================

The AI is a teacher.

Not a scholar.

Not a curriculum.

Not the source of truth.

The AI should:

Encourage thinking.

Encourage recognition.

Provide hints.

Answer questions.

Track progress.

Support revision.

The AI should NOT:

Invent lessons.

Invent rules.

Invent page numbers.

Invent meanings.

Invent curriculum.

If uncertain,

say so.

=============================================================================
KNOWLEDGE BASE
=============================================================================

Primary source:

Muallim-ul-Quran

Current format:

Scanned image PDFs.

The books are the source of truth.

Original PDFs are NEVER modified.

Knowledge is extracted from them.

Every educational item must be traceable back to the original page.

=============================================================================
APPLICATION GOAL
=============================================================================

The learner should eventually be able to:

Open the Quran.

Read continuously.

Recognize familiar words.

Understand verses naturally.

Depend less on translation.

Depend less on AI.

The application succeeds when the learner no longer needs it frequently.

=============================================================================
DEVELOPMENT PRINCIPLES
=============================================================================

Before writing code:

1. Read AGENTS.md

2. Read relevant docs

3. Read .cursor/RULES.md

4. Read .cursor/PROMPTS.md

5. Read .cursor/MEMORY.md

6. Read current task

Never skip these steps.

=============================================================================
IMPLEMENTATION PRINCIPLES
=============================================================================

Always:

Understand first.

Plan first.

Build second.

Test third.

Document fourth.

Refactor fifth.

Never immediately generate code.

=============================================================================
ARCHITECTURE
=============================================================================

Use:

Next.js

TypeScript

Tailwind CSS

Prisma

PostgreSQL

Supabase

pnpm

Clean Architecture

Feature-first organization.

Keep components small.

Keep services independent.

Avoid unnecessary abstractions.

=============================================================================
USER EXPERIENCE
=============================================================================

The application should feel like:

A calm Quran teacher.

Not a productivity app.

Not a social media app.

Not an AI demo.

The Quran should always remain the center of attention.

=============================================================================
LANGUAGE
=============================================================================

Primary Language

Urdu

UI Font

Jameel Noori Nastaleeq Regular

Quran Font

Indo-Pak Quran Script

Never replace these defaults.

=============================================================================
LEARNING SESSION
=============================================================================

Daily session target:

15–20 minutes

Typical flow:

Review

↓

Read Quran

↓

Recognize words

↓

Ask questions

↓

Reflection

↓

Finish

Avoid overwhelming the learner.

=============================================================================
CODING STANDARDS
=============================================================================

Write:

Clean code.

Simple code.

Reusable code.

Readable code.

Maintainable code.

Avoid:

Large files.

Duplicate logic.

Magic values.

Commented-out code.

Unused code.

Use TypeScript strict mode.

Never use "any" unless absolutely necessary.

=============================================================================
DATABASE PRINCIPLES
=============================================================================

Use Prisma.

Use PostgreSQL.

Every table should include:

ID

createdAt

updatedAt

Proper relationships

Indexes

No duplicated educational data.

=============================================================================
AI PRINCIPLES
=============================================================================

Before asking AI:

Search database.

Search knowledge base.

Reuse cached information.

Only use AI when reasoning is required.

Reduce unnecessary AI calls.

=============================================================================
OCR PRINCIPLES
=============================================================================

Books are scanned images.

OCR is never trusted automatically.

Every extracted item stores:

Confidence

Source page

Verification status

Only verified information enters the curriculum.

=============================================================================
SECURITY
=============================================================================

Never expose:

API keys

Secrets

Database credentials

Prompt templates

Private learner data

Always use environment variables.

=============================================================================
TESTING
=============================================================================

Every feature should include:

Unit tests

Integration tests

Manual testing

Educational validation

A feature is incomplete without testing.

=============================================================================
DOCUMENTATION
=============================================================================

Documentation is part of the codebase.

Whenever architecture changes:

Update documentation.

Whenever prompts change:

Update PROMPTS.md.

Whenever decisions change:

Update MEMORY.md.

Documentation should never become outdated.

=============================================================================
PROJECT MEMORY
=============================================================================

Important architectural decisions belong in:

.cursor/MEMORY.md

Do not duplicate them elsewhere.

=============================================================================
AI PROMPTS
=============================================================================

All production prompts belong in:

.cursor/PROMPTS.md

Never hardcode prompts inside components.

=============================================================================
DEVELOPMENT WORKFLOW
=============================================================================

For every task:

Read

↓

Understand

↓

Plan

↓

Explain

↓

Implement

↓

Test

↓

Document

↓

Review

↓

Stop

Wait for approval before beginning unrelated work.

=============================================================================
DEFINITION OF DONE
=============================================================================

A task is complete only if:

✓ Code builds

✓ Tests pass

✓ Lint passes

✓ TypeScript passes

✓ Documentation updated

✓ No regressions

✓ Educational philosophy preserved

✓ Architecture preserved

✓ User experience remains simple

=============================================================================
FINAL PRINCIPLE
=============================================================================

Whenever making a decision, ask:

"Will this help the learner understand the Quran more directly?"

If YES,

continue.

If NO,

do not build it.

Every file, component, database table, prompt, and feature should ultimately serve this one mission.

The learner comes first.

The Quran comes first.

Technology exists only to support that journey.