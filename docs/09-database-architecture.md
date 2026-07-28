# 09 - Database Architecture

> "The database is not merely a place to store data.
> It is a structured representation of the learner's journey through the Quran."

---

# Purpose

The database should be designed around the educational model.

Do not design the educational model around the database.

The architecture must support:

- Muallim-ul-Quran curriculum
- Quran reading
- AI teaching
- Vocabulary tracking
- Rule tracking
- Review scheduling
- Learner progress
- Future expansion

---

# Design Principles

## Principle 1

Store structured data whenever possible.

Never store important knowledge as long paragraphs.

---

## Principle 2

Everything should have relationships.

Words connect to lessons.

Lessons connect to rules.

Rules connect to verses.

Verses connect to learner progress.

---

## Principle 3

Every important object has a stable ID.

Never use text as an identifier.

---

## Principle 4

The original Muallim pages are always preserved.

Extracted data is secondary.

---

# High-Level Architecture

                    Quran
                      │
                      ▼
               Quran Database
                      │
                      ▼
            Knowledge Database
                      │
                      ▼
           Curriculum Database
                      │
                      ▼
             Learner Database
                      │
                      ▼
             Review Database
                      │
                      ▼
               AI Teacher

---

# Main Collections / Tables

The system should contain these major entities.

## Quran

Stores the Quran itself.

Fields:

- Surah
- Ayah
- Juz
- Page
- Arabic Text
- Word List

---

## Quran Words

Each Quranic word is stored separately.

Fields

- Word ID
- Arabic
- Root (future)
- Position
- Surah
- Ayah
- Juz

Example

الحمد

↓

Word ID 2034

---

## Muallim Books

Stores uploaded books.

Fields

- Book ID
- Title
- Volume
- Edition
- PDF
- Upload Date
- Version

---

## Muallim Pages

Each scanned page.

Fields

- Page ID
- Book ID
- Page Number
- Image
- OCR Text
- Vision Output
- Verification Status

The original image is always preserved.

---

## Lessons

Each lesson becomes structured.

Fields

- Lesson ID
- Volume
- Unit
- Lesson Number
- Title
- Objectives
- Summary
- Original Pages

---

## Vocabulary

Fields

- Vocabulary ID
- Arabic
- Urdu Meaning
- Lesson ID
- Difficulty
- Related Rules

---

## Rules

Fields

- Rule ID
- Lesson ID
- Title
- Explanation
- Examples
- Difficulty

---

## Exercises

Fields

- Exercise ID
- Lesson ID
- Question
- Answer
- Difficulty
- Exercise Type

---

## Quran Links

Connects Muallim content with Quran.

Fields

- Link ID
- Vocabulary ID
- Rule ID
- Lesson ID
- Surah
- Ayah

---

# Learner Tables

## Learner Profile

Fields

- User ID
- Name
- Current Volume
- Current Unit
- Current Lesson
- Current Juz
- Current Surah
- Current Ayah
- Daily Goal

---

## Vocabulary Progress

Each learner has their own relationship with every vocabulary word.

Fields

- User ID
- Vocabulary ID
- Confidence
- First Seen
- Last Seen
- Times Seen
- Times Forgotten
- Times Recognized
- Next Review

---

## Rule Progress

Fields

- User ID
- Rule ID
- Confidence
- Attempts
- Mistakes
- Last Reviewed
- Next Review

---

## Lesson Progress

Fields

- User ID
- Lesson ID
- Started
- Completed
- Confidence
- Notes

---

## Reading Sessions

Every reading session is stored.

Fields

- Session ID
- User ID
- Date
- Duration
- Start Ayah
- End Ayah
- Questions Asked
- Reflection

---

## Review Queue

Dynamic review list.

Fields

- Review ID
- User ID
- Object Type
- Object ID
- Priority
- Due Date
- Review Status

---

## Reflections

Personal learning journal.

Fields

- Reflection ID
- User ID
- Date
- Lesson
- Quran Reading
- Notes

---

# Relationships

Vocabulary

↓

Lesson

↓

Rule

↓

Exercise

↓

Quran Word

↓

Ayah

↓

Reading Session

↓

Learner Progress

Everything is connected.

---

# Image Storage

Never modify uploaded pages.

Store:

Original PDF

↓

Page Image

↓

Thumbnail

↓

OCR

↓

Vision Extraction

↓

Manual Corrections

The original scan remains untouched.

---

# AI Memory

The AI should never rely on chat history.

Instead it queries:

Learner Profile

↓

Current Lesson

↓

Vocabulary Progress

↓

Rule Progress

↓

Review Queue

↓

Reading Session

This makes responses consistent.

---

# Semantic Search

Embeddings are useful for:

Searching explanations

Finding similar lessons

Finding related rules

Finding related vocabulary

Embeddings should never replace structured data.

---

# Versioning

Every important object supports version history.

Books

Lessons

Rules

Vocabulary

Exercises

This allows future improvements without losing history.

---

# Backup Strategy

Always keep:

Original PDFs

Extracted JSON

Database

Manual Corrections

Knowledge Graph

Nothing should be regenerated unnecessarily.

---

# Future Tables

Reserved for future versions.

Audio Lessons

Teacher Notes

User Notes

Bookmarks

Achievements (optional)

Multi-language Support

Collaborative Learning

API Integrations

---

# Suggested Technology Stack

Database:

PostgreSQL

Reason:

Strong relationships.

Reliable.

Easy migrations.

Excellent indexing.

---

Search

PostgreSQL Full-Text Search

Then

Meilisearch (optional)

---

Embeddings

pgvector

Only for semantic retrieval.

---

Image Storage

Supabase Storage

or

Cloudflare R2

---

Cache

Redis

For:

Current learner state

Frequently accessed lessons

AI context

---

ORM

Prisma

Reason:

Excellent TypeScript support.

Easy migrations.

Strong developer experience.

---

# What Should NEVER Be Stored

Never store:

AI conversations as educational truth

Generated explanations as permanent curriculum

Temporary prompts

Hallucinated content

Only verified educational data becomes permanent.

---

# Migration Philosophy

The schema will evolve.

Every migration should preserve:

Learner progress

Lesson history

Review history

Manual corrections

Never require learners to start over.

---

# Final Principle

The database exists to preserve learning, not merely information.

A learner should be able to return after months or years and continue exactly where they left off—with every lesson, every word, every review, and every reflection still connected as part of one continuous Quran learning journey.