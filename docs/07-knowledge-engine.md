# 07 - Knowledge Engine

> "The Knowledge Engine transforms books into structured knowledge without changing their meaning."

---

# Purpose

The Knowledge Engine is responsible for acquiring, organizing, validating, and serving all educational knowledge used by the application.

It is **not** an AI model.

It is the system that prepares trustworthy knowledge so the AI Teacher can teach consistently.

---

# Core Philosophy

The application does not teach from internet searches.

It teaches from trusted knowledge sources.

Knowledge must always have a source.

Every explanation should be traceable.

Nothing should exist inside the system without knowing where it came from.

---

# Sources of Truth

Knowledge should always be retrieved in the following priority.

## Level 1

Muallim-ul-Quran

(The official curriculum)

↓

## Level 2

The Quran

(The text being studied)

↓

## Level 3

Authentic Quranic Arabic references

(Classical dictionaries, morphology references, Quran corpus)

↓

## Level 4

AI reasoning

Only when necessary.

Always identified as supplementary.

---

# Primary Responsibilities

The Knowledge Engine is responsible for:

• Importing Muallim books

• Understanding scanned pages

• Extracting lessons

• Extracting vocabulary

• Extracting rules

• Extracting exercises

• Connecting lessons to Quran verses

• Creating searchable knowledge

• Supporting the Teacher Engine

---

# Knowledge Pipeline

The complete pipeline is:

Image PDF

↓

Page Images

↓

Vision AI

↓

Structured Extraction

↓

Validation

↓

Knowledge Graph

↓

Database

↓

Teacher Engine

The original images are never discarded.

---

# Why Vision Instead of OCR?

Muallim-ul-Quran exists as scanned image PDFs.

Traditional OCR often fails with:

- Urdu Nastaleeq
- Arabic diacritics
- Tables
- Mixed layouts
- Page annotations

Therefore:

Vision AI should understand the page directly.

OCR should only improve search.

OCR should never become the source of truth.

---

# Page Preservation

Every page should store:

Original PDF

Page Number

Image

Thumbnail

Vision Output

OCR Output (optional)

Manual Corrections

Extraction Status

Nothing is permanently lost.

---

# Lesson Extraction

Vision AI should identify:

Lesson Number

Lesson Title

Objectives

Vocabulary

Rules

Examples

Exercises

Teacher Notes

Revision Questions

References

Every extracted lesson should be reviewable.

---

# Vocabulary Extraction

Each vocabulary item should include:

Arabic

Urdu Meaning

Lesson

Unit

Volume

Page

Occurrences

Related Rules

Related Exercises

Confidence

Verification Status

---

# Rule Extraction

Each rule should contain:

Rule Number

Rule Title

Explanation

Examples

Exercises

Page Reference

Lesson

Difficulty

Related Vocabulary

Related Quran Verses

---

# Exercise Extraction

Each exercise should contain:

Exercise Type

Question

Answer

Lesson

Rule

Vocabulary

Difficulty

Page Number

Original Image

---

# Quran Linking

Every extracted concept should connect back to the Quran.

Examples

Word

↓

All Quran Occurrences

Rule

↓

Verses using that rule

Lesson

↓

Verses reinforcing the lesson

Knowledge should always be contextual.

---

# Knowledge Graph

Everything should be connected.

Example

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

Surah

↓

Juz

Nothing exists in isolation.

---

# Example Relationship

الحمد

↓

Lesson 2

↓

Rule 1

↓

Exercise 3

↓

Surah Al-Fatihah

↓

Juz 1

↓

Learner Confidence

The Teacher Engine can now teach intelligently.

---

# Validation

Every extracted item should have a status.

Draft

↓

Verified

↓

Corrected

↓

Approved

The system should allow manual corrections.

---

# Manual Editing

Every extracted lesson should be editable.

The developer should be able to correct:

Vocabulary

Rules

Exercises

Lesson Titles

Page Numbers

Without reprocessing the PDF.

---

# Search

The Knowledge Engine should support searching by:

Word

Meaning

Rule

Lesson

Exercise

Page

Surah

Ayah

Juz

Root (future)

Search should be fast and local.

---

# Retrieval

When the Teacher Engine asks:

"What should I teach?"

The Knowledge Engine returns:

Relevant Lesson

Relevant Rule

Relevant Vocabulary

Relevant Examples

Relevant Quran Context

Relevant Review

Nothing more.

The Teacher Engine should never search raw PDFs.

---

# Versioning

Knowledge changes over time.

Every extraction should have:

Version

Created Date

Updated Date

Extraction Model

Manual Changes

History

Nothing should be overwritten permanently.

---

# AI Usage

AI is used only during:

Extraction

Understanding layouts

Summarization

Relationship generation

It is NOT used as permanent storage.

Structured knowledge always lives in the database.

---

# Database Philosophy

Never store paragraphs when structured data is possible.

Example

Instead of:

"This lesson teaches several words..."

Store:

Lesson

↓

Vocabulary List

↓

Rule List

↓

Exercise List

↓

Examples

↓

Relationships

Structured data is easier to search, review, and teach.

---

# Error Handling

If Vision AI is uncertain:

Mark the item for review.

Never invent missing information.

Never silently guess.

Trust is more important than automation.

---

# Future Expansion

The Knowledge Engine should eventually support:

Additional Muallim editions

Teacher notes

Audio lessons

Handwritten notes

User annotations

Additional curricula

Without changing the architecture.

---

# Integration

The Knowledge Engine provides knowledge to:

Curriculum Engine

Teacher Engine

Reading Engine

Learner Engine

Review Engine

It never interacts directly with the user.

---

# Success Criteria

The Knowledge Engine succeeds when:

Every lesson is structured.

Every word is connected.

Every rule is searchable.

Every exercise is preserved.

Every explanation has a source.

The AI never needs to "guess."

---

# Final Principle

The Knowledge Engine exists to preserve the integrity of Muallim-ul-Quran.

It transforms scanned books into a structured educational system while preserving every lesson, every rule, every example, and every exercise.

Knowledge should become easier to access.

Never different.