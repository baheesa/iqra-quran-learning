# .cursor/RULES.md

# =============================================================================
# Cursor Development Rules
# Quran Learning System
# =============================================================================

Version: 1.0

Purpose:

These rules define how Cursor should think before writing code.

The goal is to produce consistent, maintainable, production-quality software that follows the Muallim-ul-Quran methodology.

These rules override default AI coding behavior.

---

# 1. Mission

The application exists for ONE purpose:

Help learners gradually understand the Quran directly without relying on translation.

Every feature should support this mission.

If a feature does not improve learning, it should not be implemented.

---

# 2. Development Philosophy

Always choose:

Simple > Clever

Readable > Short

Maintainable > Fancy

Explicit > Magic

Small Components > Large Components

---

# 3. Before Writing Code

Always perform these steps.

1. Read AGENTS.md

2. Read the relevant documentation.

3. Understand the task.

4. Explain the implementation plan.

5. Wait if requirements are unclear.

Never immediately start generating code.

---

# 4. Educational Rules

Remember:

The curriculum comes first.

AI comes second.

Technology comes third.

Never change the educational philosophy.

---

Always follow:

Recognition before explanation.

Understanding before grammar.

Reading before exercises.

Practice before memorization.

Consistency before speed.

---

Never:

Teach advanced Arabic grammar.

Overwhelm the learner.

Skip curriculum steps.

Invent educational content.

Contradict Muallim-ul-Quran.

---

# 5. UI Rules

The interface must remain calm.

Minimal.

Clean.

No clutter.

No unnecessary animations.

No distractions.

The Quran should always be the visual focus.

---

Language:

Urdu

---

Fonts

UI

Jameel Noori Nastaleeq Regular

Quran

Pakistani Indo-Pak Quran Script

Never replace these fonts.

---

Always support:

Desktop

Tablet

Mobile

---

The app should feel like:

A quiet Quran teacher.

Not a social media app.

---

# 6. AI Rules

AI is a teacher.

Not the curriculum.

Not the database.

Not the source of truth.

---

Always:

Encourage recognition.

Ask questions.

Give hints.

Encourage reflection.

Be patient.

---

Never:

Guess.

Invent lessons.

Invent rules.

Invent page numbers.

Invent references.

If uncertain,

say so.

---

Keep responses:

Short

Friendly

Respectful

Educational

---

# 7. Muallim Knowledge Base Rules

Books exist as:

Scanned image PDFs.

The originals are sacred.

Never modify them.

Never overwrite them.

Always preserve them.

---

Extraction must produce:

Vocabulary

Rules

Exercises

Examples

Lesson Titles

Page Numbers

Confidence Score

Verification Status

---

Every extracted item must know:

Book

Volume

Unit

Lesson

Page

Source Image

---

# 8. OCR Rules

OCR is never trusted completely.

Every extraction must include:

Confidence

Verification status

Original image reference

Never silently correct uncertain text.

---

# 9. Quran Text Rules

Never modify Quran text.

Never normalize Quran text.

Never rewrite verses.

Never remove diacritics from stored Quran text.

If normalized text is needed,

store separately.

---

# 10. Database Rules

Use PostgreSQL.

Use Prisma.

Every table must:

Have IDs.

CreatedAt.

UpdatedAt.

Indexes.

Relationships.

Never duplicate data.

Normalize where appropriate.

---

Always create migrations.

Never manually modify production tables.

---

# 11. API Rules

REST APIs.

Clear endpoints.

Input validation.

Meaningful error messages.

Proper HTTP status codes.

Never expose internal errors.

---

# 12. Authentication

Protect:

Progress

Bookmarks

Notes

Teacher conversations

Settings

Never trust client input.

Always validate server-side.

---

# 13. Performance

Optimize for:

Fast startup.

Fast reading.

Fast word lookup.

Fast search.

Smooth scrolling.

Offline readiness.

Measure before optimizing.

---

# 14. Accessibility

Support:

Keyboard navigation.

Large fonts.

Good contrast.

Screen readers (future).

Comfortable touch targets.

---

# 15. Coding Style

Language

TypeScript

Strict Mode

No "any"

No disabled lint rules.

No commented-out code.

No dead code.

No duplicated logic.

---

Prefer:

Pure functions.

Reusable components.

Feature-based folders.

Composition over inheritance.

---

Names should be:

Descriptive.

Readable.

Consistent.

---

# 16. React Rules

Prefer:

Server Components.

Client Components only when necessary.

Small components.

Reusable hooks.

Avoid prop drilling.

Avoid giant pages.

---

# 17. State Management

Local state first.

Global state only when necessary.

Use Zustand.

Use TanStack Query for server state.

Never store duplicated state.

---

# 18. File Organization

One responsibility per file.

Small modules.

Meaningful names.

No "utils.ts" dumping ground.

---

# 19. Error Handling

Never crash.

Always recover gracefully.

Show understandable errors.

Log useful debugging information.

Preserve learner progress.

---

# 20. Logging

Useful.

Minimal.

No console spam.

No secrets.

No API keys.

---

# 21. Security

Never expose:

API keys.

Database credentials.

JWT secrets.

Prompt templates.

Environment variables.

Always use .env.

---

# 22. Testing

Every feature should include:

Unit tests.

Integration tests.

Manual verification.

Educational validation.

Never mark a feature complete without testing.

---

# 23. Git

Small commits.

Meaningful commit messages.

One feature per commit.

No unrelated changes.

---

# 24. Documentation

If architecture changes,

update documentation.

If database changes,

update schema documentation.

If prompts change,

update PROMPTS.md.

Documentation is part of the project.

---

# 25. AI Cost Optimization

Do not call AI unnecessarily.

Prefer cached knowledge.

Prefer database lookups.

Use AI only when reasoning is required.

---

# 26. Future Compatibility

Design for:

Offline mode.

Mobile app.

Desktop app.

Multiple AI providers.

Multiple Muallim editions.

Multiple languages.

---

# 27. Definition of Done

A feature is complete only if:

✓ Builds successfully

✓ Passes lint

✓ Passes TypeScript

✓ Tests pass

✓ Documentation updated

✓ No regressions

✓ Educational philosophy preserved

✓ Architecture preserved

---

# 28. Final Rule

Before writing any code, ask:

Does this help the learner understand the Quran more directly?

If YES,

build it.

If NO,

do not implement it.

Everything in this repository serves that one purpose.