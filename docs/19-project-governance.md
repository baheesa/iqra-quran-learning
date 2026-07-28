# 19 - Project Governance

> "Technology will evolve. AI models will improve. Contributors will come and go. The educational mission must remain unchanged."

---

# Purpose

This document defines how the project is governed.

It ensures that every future change supports the original mission:

> Help learners gradually understand the Quran directly without relying on translation.

Governance protects the project from unnecessary complexity, feature creep, and educational inconsistency.

---

# Mission Statement

The application exists to help learners:

- Open the Quran.
- Read consistently.
- Recognize Quranic vocabulary.
- Understand gradually.
- Become less dependent on translation.
- Become less dependent on AI over time.

Every decision should strengthen this mission.

---

# Core Principles

The following principles are non-negotiable.

1. The Quran is the center of the application.

2. Muallim-ul-Quran is the primary curriculum.

3. AI is an assistant, never the curriculum.

4. Recognition comes before grammar.

5. Understanding comes before memorization.

6. Consistency is more important than adding features.

---

# Sources of Truth

Educational information must follow this priority.

1. Quran

2. Muallim-ul-Quran

3. Verified structured knowledge

4. AI reasoning (supplementary only)

If there is a conflict, higher-priority sources always win.

---

# Curriculum Governance

The lesson order must follow Muallim-ul-Quran.

Developers must not:

- Reorder lessons.
- Skip lessons.
- Merge lessons.
- Rewrite educational content.

If improvements are needed, they should be stored as annotations, not replacements.

---

# AI Governance

The AI must always:

- Teach within the current lesson.
- Encourage recognition.
- Admit uncertainty.
- Refer to the curriculum.

The AI must never:

- Create its own curriculum.
- Invent rules.
- Skip prerequisites.
- Override verified knowledge.

---

# Knowledge Base Governance

Every extracted lesson should remain traceable.

For every vocabulary item, rule, or exercise, the system should store:

- Source book
- Volume
- Unit
- Lesson
- Page number
- Extraction version
- Verification status

Nothing should become "source unknown."

---

# Educational Changes

Any educational change should answer:

- Why is this change needed?
- Which Muallim page supports it?
- Does it change learner understanding?
- Does it preserve the original curriculum?

If the answer is unclear, the change should not be merged.

---

# Code Governance

Every new feature should:

- Follow the coding standards.
- Include tests.
- Update documentation when necessary.
- Avoid unnecessary complexity.

Architecture should evolve carefully, not unpredictably.

---

# Review Process

Major changes should include:

- Technical review.
- Educational review.
- Manual testing.
- Documentation update.

Educational correctness is as important as code quality.

---

# Feature Approval

Before adding a new feature, ask:

1. Does it help learners understand the Quran?

2. Does it support the Muallim methodology?

3. Can it be explained simply?

4. Will it still make sense in five years?

If the answer to any question is "no," reconsider the feature.

---

# Feature Creep

Avoid features that distract from the mission.

Examples:

❌ Social feeds

❌ Competitive leaderboards

❌ Daily streak pressure

❌ AI chat home screen

❌ Unrelated productivity tools

The learner should always return to reading the Quran.

---

# Versioning Rules

Major versions may introduce:

- New capabilities
- Better AI models
- Improved extraction

Major versions must not:

- Break learner progress.
- Remove curriculum data.
- Lose review history.
- Change educational philosophy.

---

# Documentation

Every architectural change should update the relevant document.

Documentation is part of the codebase.

Outdated documentation is considered technical debt.

---

# Security Governance

Protect:

- Learner data
- Notes
- Uploaded books
- API keys
- Prompt templates

Respect learner privacy at all times.

---

# Performance Governance

Before optimizing:

Measure.

Avoid premature optimization.

Optimize only where it improves the learner experience.

---

# Accessibility

Every new feature should remain:

- Easy to read.
- Easy to navigate.
- Comfortable on mobile devices.
- Usable with larger text sizes.

Accessibility is a core requirement.

---

# Long-Term Vision

The application should continue to support:

- Better AI models.
- Additional Muallim editions.
- Offline capabilities.
- More educational resources.

Without changing the learner's daily workflow.

---

# Decision Framework

When making any decision, ask:

Does this help someone open the Quran and understand it more directly?

If yes, continue.

If not, reconsider.

---

# Success Metrics

The project succeeds when learners:

- Read more consistently.
- Recognize more Quranic words.
- Ask fewer AI questions over time.
- Feel increasingly confident reading independently.

Not when the application has the most features.

---

# Roles

## Product Vision

Protects the educational mission.

## Technical Lead

Protects architecture and code quality.

## Curriculum Reviewer

Protects educational accuracy.

## AI Maintainer

Maintains prompts, model integrations, and AI behavior.

A single person may fulfill all roles in the early stages of the project.

---

# Final Principle

Every decision should preserve one simple promise:

> The application exists to quietly accompany the learner on their journey toward understanding the Quran directly.

If a change strengthens that promise, it belongs in the project.

If it weakens that promise, it should not be implemented.