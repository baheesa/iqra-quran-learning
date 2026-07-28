# 14 - Frontend Architecture

> "The interface should disappear, leaving only the learner and the Quran."

---

# Purpose

The frontend presents the learning experience.

It should be:

- Calm
- Minimal
- Fast
- Accessible
- Urdu-first
- Mobile-first

The learner should spend their time reading the Quran, not learning how to use the application.

---

# Core Philosophy

The frontend should answer only three questions:

1. Where am I?
2. What should I do now?
3. What should I review next?

Everything else is secondary.

---

# Design Principles

## Simple

Every screen has one primary purpose.

---

## Consistent

Buttons, layouts and interactions should remain familiar throughout the app.

---

## Respectful

The Quran should always be the visual focus.

---

## Progressive

Show only what is needed at the current moment.

Do not overwhelm the learner.

---

# Application Structure

```
Application

↓

Authentication

↓

Onboarding

↓

Dashboard

↓

Today's Lesson

↓

Quran Reading

↓

Review

↓

Reflection

↓

Dashboard
```

The learner always knows the next step.

---

# Main Navigation

Only five sections should exist.

```
🏠 Home

📖 Quran

📚 Lessons

📝 Review

👤 Profile
```

No complex navigation.

---

# Home Screen

Purpose:

Resume learning immediately.

Display:

- Continue Reading
- Today's Lesson
- Today's Review
- Current Juz
- Current Lesson
- Daily Progress

The learner should begin studying with one tap.

---

# Quran Screen

This is the heart of the application.

Display:

- Quran page
- Selected ayah
- Reading progress
- Bookmark
- Word selection

Do not clutter the screen.

---

# Word Interaction

When a learner taps a word:

Show a bottom sheet.

Display:

Arabic word

Recognition status

Confidence

Lesson introduced

Related rule

Need help?

Avoid full-screen popups.

---

# AI Teacher Panel

The AI should appear only when requested.

Display:

- Hint
- Explanation
- Related lesson
- Related rule
- Suggested review

Close the panel and return immediately to reading.

---

# Lesson Screen

Each lesson includes:

Objectives

Vocabulary

Rules

Examples

Exercises

Progress

Notes

Lessons should follow the order of Muallim-ul-Quran.

---

# Review Screen

Show only today's review.

Sections:

Vocabulary

Rules

Exercises

Recently mastered

No complicated statistics.

---

# Reflection Screen

At the end of each session:

Ask one or two simple questions.

Example:

"What was the easiest word today?"

"What do you want to remember tomorrow?"

Reflection should take less than one minute.

---

# Profile Screen

Display:

Current unit

Current lesson

Reading streak (optional)

Vocabulary learned

Rules learned

Reading time

Settings

Avoid gamification.

---

# Search

Search should support:

Vocabulary

Lessons

Rules

Surahs

Juz

Search is a utility, not the main navigation.

---

# Notifications

Gentle reminders only.

Examples:

"It's time for today's 15-minute session."

"Your review is ready."

Never create guilt.

---

# Urdu Interface

The interface language is Urdu.

Everything except Quranic Arabic should appear in Urdu.

Examples:

Buttons

Menus

Settings

Progress

Hints

AI responses

Help text

---

# Fonts

## Quran

Use the official Indo-Pak Quran script.

Never replace it with a generic Arabic font.

---

## Urdu

Use:

Jameel Noori Nastaleeq Regular

Maintain proper Nastaleeq rendering throughout the UI.

---

# Color Palette

Use soft, calm colors.

Examples:

Background

Warm white

Primary

Deep green

Accent

Muted blue

Warning

Soft amber

Avoid bright or distracting colors.

---

# Icons

Use simple outline icons.

Icons should support the text, not replace it.

---

# Responsive Design

Primary target:

Mobile phones.

Secondary:

Tablets.

Desktop:

Useful for administration and extended study.

---

# State Management

Separate state into:

UI State

Navigation

Drawer

Bottom sheets

Theme

---

Learning State

Current lesson

Current reading

Review queue

Progress

---

Knowledge State

Lessons

Vocabulary

Rules

Mostly read-only.

---

# Offline Support

Available offline:

Quran

Lessons

Vocabulary

Rules

Bookmarks

Reading history

Reviews

Unavailable offline:

AI explanations

Vision processing

Cloud synchronization

---

# Loading States

Avoid blank screens.

Use:

Skeleton loaders

Progress indicators

Cached content

The learner should always feel the app is responsive.

---

# Error Handling

If an error occurs:

Explain it simply.

Offer one action.

Never display technical messages.

Example:

"Unable to connect. You can continue reading offline."

---

# Accessibility

Support:

Large font sizes

High contrast mode

Screen readers (future)

Keyboard navigation (desktop)

Comfortable touch targets

---

# Performance Goals

App launch:

< 2 seconds

Navigation:

Instant

Word selection:

< 100 ms

Lesson opening:

< 300 ms

Reading should always feel smooth.

---

# Technology Recommendations

Framework:

Next.js

Language:

TypeScript

Styling:

Tailwind CSS

State:

Zustand

Forms:

React Hook Form

Data Fetching:

TanStack Query

Icons:

Lucide

Animation:

Framer Motion (minimal use)

---

# Folder Structure

```
app/
components/
features/
hooks/
lib/
services/
stores/
types/
styles/
```

Organize code by feature rather than by file type where appropriate.

---

# UI Components

Create reusable components.

Examples:

QuranPage

AyahCard

WordChip

VocabularyCard

RuleCard

LessonCard

ReviewCard

TeacherPanel

ReflectionDialog

BookmarkButton

ProgressIndicator

---

# Design Rules

Every screen should have:

One primary action.

Minimal distractions.

Clear typography.

Fast navigation.

Respect for the Quran.

---

# Success Criteria

The frontend succeeds when:

The learner opens the app.

Resumes immediately.

Reads comfortably.

Receives help only when needed.

Leaves after a focused 15–20 minute session.

Returns tomorrow without friction.

---

# Final Principle

The learner should never feel like they are using a complex educational platform.

They should feel like they are sitting with the Quran, accompanied quietly by a patient teacher who helps only when needed.