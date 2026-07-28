# EXTRACTION.md

# =============================================================================
# Muallim-ul-Quran Knowledge Extraction Specification
# =============================================================================

Version: 1.0

Purpose

This document defines how scanned Muallim-ul-Quran books are converted into a
verified, structured knowledge base.

The original books remain the source of truth.

AI assists with extraction but never becomes the source of truth.

---

# Overall Pipeline

Scanned PDF

↓

Image Processing

↓

OCR

↓

AI Extraction

↓

Structured JSON

↓

Verification

↓

Database

↓

Application

Each step is independent.

Nothing overwrites the previous step.

---

# Guiding Principles

Always preserve:

• Original PDF

• Original page image

• OCR output

• AI output

• Verified output

Every stage should be reproducible.

---

# Step 1 — PDF Import

Input

Scanned image PDF

Store

Book ID

Book Name

Volume

Number of Pages

Import Date

Checksum

Never modify the original file.

---

# Step 2 — Image Processing

Convert every page into a high-quality image.

Store

Book

Page

Resolution

Image Path

Rotation

Processing Date

Requirements

Never compress destructively.

Never crop content.

Preserve margins.

---

# Step 3 — OCR

OCR extracts:

Arabic

Urdu

English (if present)

Numbers

Tables

Headings

Output

Raw OCR text.

Bounding boxes.

Confidence score.

Language.

Never trust OCR automatically.

---

# OCR Rules

Arabic should remain unchanged.

Urdu should remain unchanged.

Unknown text should never be guessed.

Low confidence must be flagged.

Never silently correct OCR.

---

# Step 4 — AI Extraction

Purpose

Convert OCR output into structured educational data.

Extract only:

Book

Unit

Lesson

Vocabulary

Rules

Exercises

Examples

Headings

Review Questions

Do not generate educational content.

Only extract.

---

# AI Extraction Prompt

System Role

You are an educational extraction assistant.

Your job is to convert OCR text from Muallim-ul-Quran into structured JSON.

Never invent information.

Never summarize.

Never interpret.

Extract only what exists.

If uncertain,

return null.

Return valid JSON only.

---

# Vocabulary Extraction

Extract

Arabic Word

Simple Urdu Meaning

Lesson

Unit

Page

Difficulty

Examples

Confidence

Verification Status

Example

```json
{
  "arabic": "رَبِّ",
  "urdu": "رب",
  "lesson": 3,
  "unit": 1,
  "page": 24,
  "confidence": 98,
  "verified": false
}
```

---

# Rule Extraction

Extract

Rule Title

Explanation

Examples

Lesson

Unit

Page

Confidence

Verification

Never expand the explanation.

Never rewrite it.

---

# Exercise Extraction

Extract

Question

Answer

Lesson

Unit

Page

Exercise Type

Difficulty

Estimated Time

---

# Lesson Extraction

Extract

Lesson Title

Objectives

Vocabulary

Rules

Exercises

Review Questions

Related Lessons

---

# JSON Standards

Every object should include

id

sourceBook

sourcePage

createdAt

confidence

verified

version

Nothing should exist without a source.

---

# Confidence Rules

98–100

Excellent

95–97

Very High

90–94

Good

80–89

Needs Review

Below 80

Manual Verification Required

Never automatically publish low-confidence data.

---

# Verification Workflow

Unknown

↓

Needs Review

↓

Verified

↓

Approved

Only Approved data is visible to learners.

---

# Quran Text Rules

Never modify Quranic text.

Never remove harakat.

Never normalize.

Never auto-correct.

Store original exactly as printed.

---

# AI Safety Rules

Never invent

Lessons

Vocabulary

Rules

Exercises

Examples

Page numbers

If uncertain,

return null.

---

# Error Handling

If OCR fails

↓

Retry OCR

↓

Use another OCR engine (future)

↓

Manual Review

Never fabricate missing text.

---

# Search Priority

Before using AI

Search:

Lesson

↓

Vocabulary

↓

Rule

↓

Exercise

↓

Examples

↓

Teacher Notes

AI should only reason after searching.

---

# Future OCR Engines

The system should support

Google Vision

Azure OCR

Tesseract

OpenAI Vision

Claude Vision

without changing the extraction pipeline.

---

# Versioning

Every extraction stores

Version

Prompt Version

Extraction Date

OCR Engine

AI Model

Verification Status

Never lose previous versions.

---

# Performance

Extraction should be asynchronous.

Support resumable processing.

Support batch processing.

Support incremental updates.

---

# Folder Structure

knowledge-base/

original/

images/

ocr/

json/

verified/

exports/

logs/

---

# Success Criteria

Extraction is successful when:

✓ Every lesson is identified.

✓ Every vocabulary item has a source page.

✓ Every rule is traceable.

✓ OCR confidence is stored.

✓ AI confidence is stored.

✓ Manual verification is possible.

✓ Original PDFs remain untouched.

---

# Final Principle

The extraction pipeline exists to preserve the educational integrity of the
Muallim-ul-Quran curriculum.

The AI may assist with reading the books.

It must never rewrite the books.

Every extracted piece of knowledge should always be traceable back to the
original scanned page.