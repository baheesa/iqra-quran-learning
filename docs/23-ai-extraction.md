# 23 - AI Extraction & Verification

> AI-assisted curriculum extraction from **manually transcribed TXT** (primary). Vision OCR remains optional.

---

## Purpose

Extract structured knowledge while preserving:

- original TXT files untouched (immutable)
- extract-only behaviour (no invention)
- human verification before export

---

## Primary input

Sections ingested from `knowledge/books/original/*.txt` are stored as source text with `provider: "txt-source"`.

Extraction receives:

- raw section text
- book metadata

Images / Vision OCR are **not** required.

---

## Providers

| Provider | Implementation | Notes |
|----------|----------------|-------|
| Source text | `txt-source` | Default after TXT import |
| Extraction | `claude-extraction` | Text-first; optional image if present |
| Extraction | `openai-extraction` | Text-first; optional image if present |
| OCR (optional) | `claude-vision` / `openai-vision` | Only when `OCR_ENABLED=1` (Future OCR Import) |
| Fallback | stubs | When no live API key |

```bash
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
# OCR_ENABLED=1   # leave unset for normal TXT workflow
```

---

## Prompts

Loaded from `cursor/PROMPTS.md` via `PromptBuilder`:

- Prompt 8 — OCR Extraction
- Prompt 10 — Knowledge Extraction
- Prompt 17 — Hallucination Prevention

Never hardcode prompt bodies in services.

---

## Verification

Statuses:

`PENDING` → `NEEDS_REVIEW` → `VERIFIED` → `APPROVED`  
Also: `REJECTED` (can return to `PENDING` / `NEEDS_REVIEW`)

Only **APPROVED** pages are exported.

APIs:

- `POST /api/v1/knowledge/approve`
- `POST /api/v1/knowledge/reject`
- `POST /api/v1/knowledge/reprocess`

---

## Admin review

`/admin/knowledge` — book list  
`/admin/knowledge/[slug]?page=N` — OCR text, extracted JSON, approve/reject/reprocess, page image when available

---

## Services

- `PromptBuilder`
- `VisionProvider` (`createClaudeVisionOcrProvider` / `createOpenAiVisionOcrProvider`)
- `ExtractionProvider` (`createClaudeExtractionProvider` / `createOpenAiExtractionProvider`)
- `VerificationEngine`
- `KnowledgeImporter`
- `KnowledgeExporter`

---

## Traceability

Every extracted item includes:

`id`, `bookId`, `bookSlug`, `pageNumber`, `lesson`, `sourceImage`, `confidence`, `verificationStatus`, `createdAt`, `version`

---

## Limitation

OpenAI Vision OCR requires rendered page images. The current default PDF provider (`pdf-lib`) registers pages without rasterizing. Provide PNGs via a render-capable PDF provider (or place images under `knowledge/books/pages/{slug}/`) before running live OCR.
