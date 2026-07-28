# 18 - Testing Strategy

> "A bug in an educational application is more than a technical issue—it can interrupt a learner's journey. Testing exists to protect both the software and the learning experience."

---

# Purpose

This document defines how the Quran Learning application should be tested.

Testing is not only about finding bugs.

It is about ensuring that:

- The learner's progress is never lost.
- The curriculum remains correct.
- AI behaves consistently.
- The application remains trustworthy.

---

# Testing Philosophy

Every feature should answer two questions:

1. Does it work correctly?
2. Does it improve the learner's experience?

Passing tests is not enough if the educational experience becomes worse.

---

# Testing Pyramid

The project should follow this testing hierarchy.

```
          End-to-End Tests
                 ▲
         Integration Tests
                 ▲
            Unit Tests
```

Most tests should be unit tests.

End-to-end tests should focus on complete learning journeys.

---

# Types of Tests

The application should include:

✓ Unit Tests

✓ Integration Tests

✓ End-to-End Tests

✓ Educational Tests

✓ AI Behavior Tests

✓ Performance Tests

✓ Security Tests

---

# Unit Tests

Purpose

Verify individual functions.

Examples

- Confidence calculations
- Review scheduling
- Vocabulary lookup
- Lesson progression
- Progress updates

Unit tests should not require a database or an AI model.

---

# Integration Tests

Purpose

Verify modules working together.

Examples

Reading Engine

↓

Teacher Engine

↓

Knowledge Engine

Or

Lesson Completion

↓

Progress Update

↓

Review Queue

---

# End-to-End Tests

Simulate real learner journeys.

Example

Login

↓

Resume Lesson

↓

Read Quran

↓

Tap Unknown Word

↓

Receive Explanation

↓

Finish Reading

↓

Complete Review

↓

Logout

The entire flow should succeed.

---

# Educational Tests

These are unique to this project.

Verify that:

Lessons appear in the correct order.

Vocabulary belongs to the correct lesson.

Rules match Muallim-ul-Quran.

Exercises are linked correctly.

Reviews appear at the correct time.

The educational structure must never drift.

---

# AI Behavior Tests

The AI should always:

✓ Stay within the curriculum.

✓ Encourage recognition.

✓ Avoid unnecessary grammar.

✓ Remain respectful.

✓ Admit uncertainty.

The AI should never:

✗ Invent lessons.

✗ Skip curriculum.

✗ Contradict verified knowledge.

---

# Regression Tests

Whenever a bug is fixed,

write a test to ensure it never returns.

---

# Database Tests

Verify:

Migrations

Relationships

Constraints

Indexes

Cascade behavior

Progress preservation

No migration should erase learner progress.

---

# Vision Pipeline Tests

For every imported Muallim page:

Verify:

Correct lesson extraction

Correct vocabulary extraction

Correct rule extraction

Correct exercise extraction

Original page preserved

Confidence score assigned

Low-confidence pages flagged

---

# API Tests

Every endpoint should test:

Authentication

Authorization

Validation

Correct response format

Error responses

Rate limiting

---

# UI Tests

Verify:

Navigation

Buttons

Forms

Dialogs

Word selection

Lesson progression

Review interactions

The learner should never become stuck.

---

# Accessibility Tests

Verify:

Keyboard navigation

Large fonts

Touch targets

Contrast

Screen reader compatibility (future)

---

# Performance Tests

Target values

App Launch

< 2 seconds

Lesson Load

< 300 ms

Word Lookup

< 200 ms

AI Response

2–5 seconds

Review Generation

< 1 second

Performance should be measured regularly.

---

# Offline Tests

Verify:

Reading

Lessons

Reviews

Bookmarks

Progress

All continue working without internet.

AI features should fail gracefully.

---

# AI Prompt Tests

Every prompt should be tested using fixed inputs.

Expected outputs should verify:

Tone

Length

Curriculum adherence

Recognition-first approach

No hallucinations

---

# Manual Educational Review

Not every test can be automated.

Before major releases:

Review lessons manually.

Read extracted pages.

Verify vocabulary.

Check rule explanations.

Confirm Quran references.

Educational quality requires human oversight.

---

# Test Data

Create realistic test data.

Include:

Multiple learners

Different progress levels

Completed lessons

Incomplete lessons

Weak vocabulary

Strong vocabulary

Large reading histories

---

# Continuous Integration

Every pull request should automatically run:

Linting

Type checking

Unit tests

Integration tests

Build verification

Do not merge failing code.

---

# Release Checklist

Before every release:

✓ Tests pass

✓ Database migration verified

✓ AI prompts reviewed

✓ Vision pipeline verified

✓ Manual learning session completed

✓ Performance checked

---

# Monitoring After Release

Track:

Application crashes

Slow endpoints

AI failures

Vision extraction failures

Review completion rates

Unexpected learner errors

Use monitoring to guide improvements.

---

# Bug Priorities

Critical

Data loss

Incorrect learner progress

Corrupted curriculum

Broken Quran display

High

Review failures

Lesson progression bugs

Incorrect AI context

Medium

UI issues

Minor display bugs

Low

Visual polish

Small layout improvements

Fix educational issues before cosmetic issues.

---

# Success Criteria

The testing strategy succeeds when:

The learner trusts the application.

Progress is never lost.

Curriculum remains accurate.

AI remains helpful.

Every update improves reliability.

---

# Final Principle

Testing protects the learner.

Every successful test is another step toward making the Quran easier to understand without relying on translation.