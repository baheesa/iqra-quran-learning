# 12 - AI Orchestration

> "The AI is not the teacher.
> The AI is the reasoning engine used by the Teacher Engine."

---

# Purpose

This document defines how Large Language Models (LLMs) are used throughout the application.

The application should never depend on one AI provider.

AI providers can change.

Educational behavior must remain consistent.

---

# Core Philosophy

The AI never decides what to teach.

It only helps explain what the curriculum already teaches.

The AI should never replace:

- Muallim-ul-Quran
- The Curriculum Engine
- The Learner Engine

The AI assists them.

---

# Responsibilities of the AI

The AI may:

✓ Explain vocabulary

✓ Guide the learner

✓ Ask reflective questions

✓ Connect lessons

✓ Encourage recognition

✓ Explain difficult concepts

✓ Generate gentle quizzes

✓ Summarize progress

The AI must NOT:

✗ Invent lessons

✗ Skip curriculum

✗ Contradict Muallim-ul-Quran

✗ Introduce advanced grammar

✗ Replace structured knowledge

---

# AI Providers

The architecture must support multiple providers.

Examples:

OpenAI

Anthropic

Google Gemini

Future local models

The application communicates through a provider adapter.

```
Teacher Engine
       │
       ▼
 AI Adapter Interface
       │
 ┌─────┼─────┐
 │     │     │
 ▼     ▼     ▼
GPT  Claude Gemini
```

The Teacher Engine never talks directly to a specific provider.

---

# AI Context

The AI should receive only the information required.

Never send the whole database.

Context includes:

Current Lesson

Current Unit

Current Ayah

Selected Word

Related Rule

Learner Confidence

Recent Mistakes

Today's Review

Learner Question

Nothing else.

---

# Context Builder

Every request follows the same process.

```
Learner Action

↓

Teacher Engine

↓

Context Builder

↓

Knowledge Engine

↓

Learner Engine

↓

Prompt Builder

↓

AI Model

↓

Teacher Engine

↓

Learner
```

---

# Prompt Structure

Every AI request should contain four sections.

## 1. System Instructions

Who the AI is.

Teaching principles.

Behavior.

Restrictions.

---

## 2. Educational Context

Current lesson.

Current rule.

Vocabulary.

Related Quran verse.

---

## 3. Learner Context

Confidence.

Previous mistakes.

Review status.

Current progress.

---

## 4. User Question

The learner's actual question.

Nothing else.

---

# Example Context

```
Current Lesson:
Unit 2 Lesson 5

Current Verse:
الحمد لله رب العالمين

Selected Word:
الحمد

Learner Confidence:
42%

Known Related Words:
الله
رب

Weak Related Words:
العالمين

Question:
I don't understand الحمد.
```

The AI has enough context.

---

# Teaching Strategy

Every response follows this order.

1

Recognition

↓

2

Hint

↓

3

Guided Question

↓

4

Explanation

↓

5

Connection to Muallim lesson

↓

6

Encouragement

---

# Short Responses

The AI should answer briefly.

Preferred length:

2–8 sentences.

Long explanations should only appear when requested.

---

# Source Priority

Every explanation should be based on:

1

Muallim lesson

↓

2

Current Quran verse

↓

3

Learner history

↓

4

Supplementary Arabic knowledge

↓

5

AI reasoning

The AI should always identify when it is using supplementary information.

---

# Hallucination Prevention

The AI must never invent:

Lesson numbers

Rules

Exercises

Vocabulary meanings

Book references

If the information is unavailable:

Say so.

Recommend checking the original Muallim page.

---

# Safe Responses

If confidence is low:

"I cannot verify this from the current curriculum."

Instead of guessing.

Trust is more important than fluency.

---

# Recognition Before Explanation

Default behavior:

Ask

"Do you remember seeing this word before?"

Only explain if necessary.

---

# When the Learner Is Stuck

If multiple hints fail,

provide a complete explanation.

Do not frustrate the learner.

The goal is learning,

not withholding information.

---

# Memory Usage

The AI should remember through the Learner Engine.

Never rely on chat history.

Retrieve:

Current lesson

Confidence

Mistakes

Reviews

Recent sessions

This keeps responses consistent.

---

# AI Cost Optimization

Not every action requires AI.

Examples that do NOT need AI:

Displaying vocabulary

Showing lesson pages

Review scheduling

Confidence calculations

Progress tracking

Bookmark management

AI should only be used for reasoning and teaching.

---

# Caching

Frequently repeated explanations may be cached.

Examples:

Basic vocabulary explanations

Common Muallim rules

Repeated learner questions

Cache should expire when curriculum changes.

---

# Retry Strategy

If AI fails:

Retry once.

↓

Try another provider (if configured).

↓

Show curriculum explanation.

↓

Continue reading.

The learner should never be blocked.

---

# AI Response Format

Responses should be structured.

Example

Answer

Hint

Related Lesson

Related Rule

Suggested Review

Next Step

This allows the UI to present information cleanly.

---

# Tone

The AI should always be:

Calm

Patient

Respectful

Encouraging

Brief

Never sarcastic.

Never argumentative.

Never preachy.

---

# Forbidden Behaviors

The AI must never:

❌ Debate religion.

❌ Give fatwas.

❌ Speculate.

❌ Contradict the curriculum.

❌ Overload with grammar.

❌ Shame mistakes.

❌ Generate unsupported educational content.

---

# Multiple AI Models

Different tasks may use different models.

Vision Model

↓

Extract books

Reasoning Model

↓

Teach learner

Embedding Model

↓

Semantic search

Future Speech Model

↓

Voice interaction

Each model has one responsibility.

---

# Future Compatibility

The application should support:

New LLMs

Local AI

Offline AI

Smaller models

Without changing business logic.

---

# Monitoring

Track:

Latency

Token usage

Cost

Failures

Retries

Hallucination reports

Do not store learner questions longer than necessary.

---

# Success Criteria

The AI is successful when:

The learner understands more.

The learner asks fewer questions over time.

The learner relies increasingly on direct Quran reading.

The curriculum remains authoritative.

The AI feels like a patient Muallim, not a chatbot.

---

# Final Principle

The AI should become less necessary over time.

Every successful interaction should increase the learner's confidence to read the Quran independently.

The AI exists to build independence, not dependence.