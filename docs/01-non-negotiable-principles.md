# 01 - Non-Negotiable Principles

> **These principles define the identity of the project.**
>
> Every architectural decision, feature request, UI improvement, AI response, and code change must comply with these principles.
>
> If a proposed feature violates one or more principles, the feature must be redesigned or rejected.

---

# Principle 1
## The Quran is Always the Center

The Quran is the heart of this application.

Everything else exists to help the learner understand the Quran.

The application must never become the focus.

The learner should spend more time reading the Quran than interacting with the AI.

---

# Principle 2
## Muallim-ul-Quran Defines the Methodology

Muallim-ul-Quran is the official curriculum.

It defines:

- lesson sequence
- vocabulary progression
- teaching style
- explanations
- exercises
- revision methodology

The AI follows the curriculum.

The AI never replaces it.

---

# Principle 3
## The AI Is a Teacher, Not a Replacement

The AI behaves like an experienced Quran teacher.

Its role is to:

guide

encourage

question

correct

revise

motivate

The AI must never become a shortcut.

---

# Principle 4
## Teach Before Answering

Whenever possible:

Ask first.

Explain later.

Example:

Incorrect:

"What does الحمد mean?"

↓

"It means praise."

Correct:

"Have you seen this word before?"

"Can you remember where?"

"Try to explain it first."

Only then provide the explanation.

---

# Principle 5
## Recognition Before Translation

Recognition is the first objective.

Translation is the final option.

Learning order:

Recognize

↓

Understand

↓

Reflect

↓

Translate (if necessary)

---

# Principle 6
## Simplicity Wins

Every screen should have one purpose.

Avoid clutter.

Avoid unnecessary menus.

Avoid information overload.

The application should feel peaceful.

---

# Principle 7
## Consistency Over Intensity

The learner studies approximately:

15–20 minutes daily.

The application should encourage daily consistency.

Never encourage marathon study sessions.

---

# Principle 8
## Respect the Learner's Pace

Never force progress.

Never lock learning behind artificial systems.

Never punish missed days.

The learner always controls the pace.

---

# Principle 9
## Every Learner Is Different

The learner model continuously evolves.

The application adapts to:

known vocabulary

weak vocabulary

reading history

lesson progress

confidence

mistakes

review history

The learner model is unique for every user.

---

# Principle 10
## Never Teach Future Lessons Prematurely

The AI should not introduce concepts from future Muallim lessons unless:

the learner explicitly asks,

or understanding the current Quran passage requires a brief explanation.

Learning should remain sequential.

---

# Principle 11
## The Original Books Are Sacred

Muallim-ul-Quran books are the source of truth.

The books exist as scanned image PDFs.

The original pages must always be preserved.

Never discard them.

---

# Principle 12
## Image Pages Are the Source of Truth

OCR is helpful.

OCR is not authoritative.

Whenever OCR differs from the scanned page,

the scanned page wins.

---

# Principle 13
## Vision First

The application must be designed assuming image PDFs.

The AI should understand pages directly through vision.

OCR exists only to improve search performance.

---

# Principle 14
## Never Hallucinate Educational Content

If information cannot be verified from:

Muallim-ul-Quran

or

authentic Quranic sources,

the AI should say:

"I don't know."

Inventing explanations is unacceptable.

---

# Principle 15
## Quranic Text Is Immutable

Never modify Quranic text.

Never simplify it.

Never paraphrase it.

Never rewrite it.

Only explain it.

---

# Principle 16
## The AI Must Remember the Learner

The AI should continuously remember:

completed lessons

known words

weak words

mistakes

questions

review history

confidence

This memory should improve teaching quality.

---

# Principle 17
## Understanding Is More Important Than Completion

Finishing Juz 30 quickly is not success.

Understanding what is read is success.

Quality over speed.

Always.

---

# Principle 18
## Every Feature Must Reduce Dependency

The application should gradually become unnecessary.

The learner should become increasingly independent.

Success means:

less AI

more Quran.

---

# Principle 19
## No Artificial Gamification

Avoid:

XP

coins

levels

loot boxes

daily rewards

artificial streak pressure

Learning the Quran is not a game.

---

# Principle 20
## Revision Is Continuous

Revision is never finished.

Vocabulary

Rules

Lessons

Exercises

All remain available forever.

---

# Principle 21
## Every Rule Remains Searchable

Every Muallim rule should have:

its own page

its own explanation

its own examples

its own exercises

its own revision history

The learner should be able to revisit any rule at any time.

---

# Principle 22
## Every Word Has a Story

Every Quranic word should remember:

first lesson

first encounter

times seen

times recognized

mistakes

confidence

related lessons

related verses

review schedule

Words are not dictionary entries.

They are part of the learner's journey.

---

# Principle 23
## AI Responses Must Be Concise

Long essays are discouraged.

Teach in small steps.

One idea at a time.

One question at a time.

---

# Principle 24
## Urdu Is the Primary Interface Language

The interface language is Urdu.

All navigation,

settings,

buttons,

menus,

and explanations

should be in Urdu unless another language is explicitly selected.

---

# Principle 25
## Preserve Quranic Typography

Use the Indo-Pak Quran script.

Arabic text must render beautifully.

Never compromise readability.

---

# Principle 26
## Preserve Urdu Typography

The application should use:

Jameel Noori Nastaleeq Regular

as the primary Urdu font.

Typography is part of the learning experience.

---

# Principle 27
## Build for Longevity

Every module should be:

replaceable

maintainable

well documented

loosely coupled

Future AI models should be easy to integrate.

---

# Principle 28
## Offline First Where Possible

The following should work without internet whenever feasible:

Quran

Vocabulary

Lessons

Rules

Review

Progress

Only AI reasoning requires an online model.

---

# Principle 29
## The AI Should Be Honest

If uncertain,

say so.

Never pretend confidence.

Never fabricate.

Never guess educational content.

---

# Principle 30
## Every Decision Must Answer One Question

Before implementing any feature, ask:

"Will this help the learner understand the Quran more effectively?"

If the answer is "No",

do not build it.

---

# Final Principle

The application is not the destination.

The Quran is.

The AI should quietly disappear into the background,

while the learner develops a direct relationship with the Quran through the methodology of Muallim-ul-Quran.

If the learner eventually reads without needing the AI,

the project has succeeded.