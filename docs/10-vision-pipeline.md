# 10 - Vision Pipeline

> "The Vision Pipeline transforms scanned Muallim-ul-Quran books into a structured curriculum while preserving every page exactly as it appears in the original books."

---

# Purpose

The Muallim-ul-Quran books are available only as scanned image PDFs.

The application must understand these books automatically.

The goal is NOT to create editable PDFs.

The goal is to understand the educational content.

---

# Philosophy

The original books are sacred.

The Vision Pipeline never replaces them.

It only extracts structured knowledge.

The original pages always remain available.

---

# Input

Supported inputs:

✓ Image PDFs

✓ Scanned books

✓ Mobile scans

✓ High-resolution page images

Future:

✓ Camera photos

✓ Handwritten notes

✓ Teacher annotations

---

# Output

The Vision Pipeline produces structured educational data.

Example

Original Page

↓

Lesson

↓

Vocabulary

↓

Rules

↓

Examples

↓

Exercises

↓

Relationships

↓

Database

---

# Complete Pipeline

                Image PDF
                    │
                    ▼
          Page Extraction
                    │
                    ▼
         Image Preprocessing
                    │
                    ▼
           Vision AI Analysis
                    │
                    ▼
         Layout Understanding
                    │
                    ▼
        Educational Extraction
                    │
                    ▼
         Relationship Building
                    │
                    ▼
          Human Verification
                    │
                    ▼
           Structured Database

---

# Step 1

## Import PDF

Store:

Original PDF

File Size

Checksum

Upload Date

Edition

Volume

Never modify the uploaded file.

---

# Step 2

## Split into Pages

Every page becomes an independent object.

Each page stores:

Book ID

Page Number

Image

Thumbnail

Resolution

Orientation

---

# Step 3

## Image Enhancement

Improve readability without changing content.

Possible operations:

Deskew

Noise Reduction

Contrast Enhancement

Border Removal

Rotation

Do NOT modify text.

---

# Step 4

## Vision Analysis

Use a vision-capable AI model.

The model should understand:

Page layout

Tables

Boxes

Headings

Arabic

Urdu

Exercises

Examples

Mixed layouts

The model understands the page.

It does not simply perform OCR.

---

# Step 5

## Layout Detection

Identify regions.

Example

Title

Objectives

Vocabulary

Rule

Examples

Exercises

Notes

Footer

Page Number

Each region receives coordinates.

Future versions may use these coordinates for highlighting.

---

# Step 6

## Educational Extraction

Extract structured information.

Lesson

Vocabulary

Rules

Exercises

Teacher Notes

Examples

Revision Questions

Nothing should remain hidden inside paragraphs.

---

# Step 7

## Quran Detection

Identify Quranic text.

Store:

Surah

Ayah

Word

Page Region

Related Lesson

Never alter Quranic text.

---

# Step 8

## Vocabulary Extraction

For every word:

Arabic

Urdu Meaning

Lesson

Unit

Page

Examples

Related Rule

Difficulty

Verification Status

---

# Step 9

## Rule Extraction

Store:

Rule Number

Title

Explanation

Examples

Exercises

Difficulty

Page

Related Vocabulary

---

# Step 10

## Relationship Building

Automatically connect:

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

Everything becomes connected.

---

# Step 11

## Confidence Score

Every extracted item receives confidence.

Example

98%

Verified automatically.

84%

Needs review.

52%

Human verification required.

Low confidence never enters production automatically.

---

# Step 12

## Human Verification

The developer can verify:

Vocabulary

Rules

Exercises

Lesson Titles

Examples

Corrections are stored separately.

The original extraction is never lost.

---

# OCR Strategy

OCR is optional.

It improves:

Search

Indexing

Filtering

OCR never replaces vision understanding.

If OCR disagrees with Vision AI,

the original page decides.

---

# AI Models

Preferred models:

GPT-4.1 Vision / GPT-5 Vision (when available)

Claude Vision

Gemini Vision

The architecture should support multiple providers.

The application should not depend on one vendor.

---

# Extraction Format

Every page should become structured JSON.

Example

{
  lesson,
  vocabulary[],
  rules[],
  exercises[],
  examples[],
  page_reference
}

Avoid storing large blocks of unstructured text.

---

# Error Handling

If extraction fails:

Store page

↓

Mark as Pending

↓

Retry

↓

Manual Review

Never silently discard content.

---

# Versioning

Every extraction stores:

Extraction Version

Vision Model

Date

Developer Corrections

History

Nothing is overwritten permanently.

---

# Storage

Keep:

Original PDF

Original Page Image

Thumbnail

Vision Output

OCR Output

Structured JSON

Corrections

Everything should remain reproducible.

---

# Search

The extracted knowledge should support searches by:

Lesson

Word

Rule

Exercise

Page

Surah

Ayah

Urdu Meaning

Arabic Word

Search should never require AI.

---

# Performance

The Vision Pipeline runs only when:

A new book is uploaded.

A page is corrected.

A re-extraction is requested.

Never during normal study sessions.

The learner should never wait for Vision AI.

---

# Future Improvements

Future versions may add:

Automatic table detection

Better Nastaleeq recognition

Handwritten note detection

Audio alignment

Interactive page overlays

Teacher annotations

All without changing the database schema.

---

# Success Criteria

The Vision Pipeline succeeds when:

Every page is preserved.

Every lesson is extracted.

Every vocabulary item is structured.

Every rule is searchable.

Every exercise is linked.

Every explanation remains traceable to the original page.

---

# Final Principle

The Vision Pipeline does not replace Muallim-ul-Quran.

It simply makes the curriculum understandable by software while preserving the integrity of every original page.