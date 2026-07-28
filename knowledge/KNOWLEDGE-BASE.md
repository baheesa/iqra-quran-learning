# knowledge-base/KNOWLEDGE-BASE.md

# =============================================================================
# Muallim-ul-Quran Knowledge Base
# Quran Learning System
# =============================================================================

Version: 1.0

Purpose:

This document defines how the Muallim-ul-Quran books are stored, processed,
verified, and transformed into the educational knowledge used by the application.

The Muallim books are the primary educational source.

The AI is only a teacher.

The books remain the source of truth.

---

# 1. Educational Philosophy

The knowledge base exists for one purpose:

Help the learner gradually understand the Quran directly without relying on translation.

Everything extracted from the books must support this mission.

Never add educational content that conflicts with Muallim-ul-Quran.

---

# 2. Source Material

Current Source

Muallim-ul-Quran

Format

Scanned Image PDFs

Language

Urdu

Characteristics

• Image-only PDFs
• No selectable text
• May contain OCR errors
• High-quality scanned pages
• Lesson-based curriculum

Original books are NEVER modified.

---

# 3. Source of Truth

Priority Order

1. Original Muallim PDF

↓

2. Manual Verification

↓

3. OCR Extraction

↓

4. AI Interpretation

If information conflicts,

the higher priority source always wins.

---

# 4. Knowledge Pipeline

Original PDF

↓

Image Processing

↓

OCR

↓

Arabic Detection

↓

Urdu Detection

↓

AI Extraction

↓

Structured JSON

↓

Manual Verification

↓

Database

↓

Application

No step should overwrite the previous one.

---

# 5. Original Files

Store all original books.

Example

knowledge-base/

original/

book-1.pdf

book-2.pdf

book-3.pdf

Never modify these files.

---

# 6. Image Processing

Each PDF page becomes an image.

Store:

Book Number

Page Number

Resolution

Image Path

Checksum

Processing Date

Never resize destructively.

Preserve quality.

---

# 7. OCR

OCR extracts:

Arabic

Urdu

Numbers

Tables

Headings

Never trust OCR completely.

Every OCR result stores:

Confidence Score

Language

Bounding Boxes

Original Image

Timestamp

---

# 8. AI Extraction

The AI extracts only educational content.

Extract:

Volumes

Units

Lessons

Vocabulary

Rules

Examples

Exercises

Review Questions

Headings

Page Numbers

Nothing else.

---

# 9. Structured Data

Every extracted item becomes structured JSON.

Example

Vocabulary

{
  id,

  arabic,

  meaning,

  lesson,

  unit,

  page,

  confidence,

  verified
}

Rules

{
  id,

  title,

  explanation,

  examples,

  lesson,

  page,

  confidence,

  verified
}

Lessons

{
  id,

  title,

  objectives,

  vocabulary,

  rules,

  exercises
}

---

# 10. Verification

Every extracted item has:

Verification Status

Unknown

↓

Needs Review

↓

Verified

↓

Approved

Only Approved data is used for teaching.

---

# 11. Confidence Scores

Every extraction stores confidence.

95–100%

Excellent

90–95%

Very Good

80–90%

Needs Review

Below 80%

Manual Verification Required

Never silently accept uncertain results.

---

# 12. Quran Text

Never modify Quranic text.

Never remove diacritics.

Never rewrite verses.

Never auto-correct Quranic words.

If normalization is required,

store it separately.

Original Quran text is immutable.

---

# 13. Vocabulary

Every vocabulary item stores:

Arabic

Simple Urdu meaning

Lesson

Unit

Page

Related words

Examples

Confidence

Verification

Difficulty

Frequency

Future Root (optional)

---

# 14. Rules

Every rule stores:

Title

Explanation

Examples

Lesson

Page

Difficulty

Verification

Rules must remain simple.

Do not convert them into academic grammar.

---

# 15. Exercises

Each exercise stores:

Lesson

Question

Type

Correct Answer

Difficulty

Related Vocabulary

Related Rule

Estimated Time

---

# 16. Search

Search priority

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

Search should never generate information.

Always search before asking AI.

---

# 17. AI Usage

AI should be used only for:

OCR correction

Content extraction

Summarization

Teacher responses

Search assistance

Never use AI to invent curriculum.

---

# 18. Versioning

Every change stores:

Version

Date

Author

Reason

Affected Pages

Nothing should be lost.

---

# 19. Manual Review

Human verification is required for:

Low confidence OCR

Arabic words

Rules

Lesson boundaries

Exercises

Page numbers

AI suggestions

---

# 20. Future Expansion

The knowledge base should support:

Additional Muallim editions

More languages

Children's curriculum

Teacher annotations

Multiple OCR engines

Multiple AI providers

Offline knowledge packs

Without changing the database design.

---

# 21. Data Relationships

Book

↓

Volume

↓

Unit

↓

Lesson

↓

Vocabulary

↓

Rules

↓

Exercises

↓

Review

Everything must remain connected.

---

# 22. Educational Integrity

Never change the meaning of a lesson.

Never simplify beyond recognition.

Never invent examples.

Never add personal interpretations.

When uncertain,

refer back to the original Muallim page.

---

# 23. Backup Strategy

Maintain three copies:

Original PDFs

Processed Images

Structured Database

Backups should be automatic.

Never overwrite originals.

---

# 24. Success Criteria

The knowledge base is successful when:

✓ Every lesson is traceable to its original page.

✓ Every vocabulary item has a verified source.

✓ Every rule has been reviewed.

✓ AI never teaches unsupported content.

✓ The learner receives consistent guidance.

---

# 25. Final Principle

The Muallim-ul-Quran books are the foundation of this application.

The AI may evolve.

The database may evolve.

The interface may evolve.

The educational source remains constant.

Every feature, prompt, and response must ultimately be traceable back to the verified knowledge extracted from these books.

The knowledge base exists to preserve that trust.