# 22 - Knowledge Engine

> Transforms Muallim-ul-Quran **manually transcribed TXT** into verified, structured knowledge.

---

## Purpose

Build the educational foundation used later by the AI Teacher and Learning Engine.

This milestone does **not** teach learners. It prepares trustworthy curriculum data.

---

## Primary source

**TXT files** in `knowledge/books/original/` (e.g. `Unit 1.txt` … `Unit 7.txt`).

These files are **immutable**. The importer never overwrites them.

OCR / PDF raster remain in the codebase as **Future OCR Import** (`OCR_ENABLED=1`) and are **not** used in the normal workflow.

---

## Pipeline

```
original/*.txt  (immutable, primary)
    ↓
Import + TXT parser (sections)
    ↓
processed/ (book manifests)
    ↓
pages/ (section records; usually no PNGs)
    ↓
ocr/ (source text JSON per section, provider=txt-source)
    ↓
extracted/ (structured extraction drafts)
    ↓
verified/ (verification records)
    ↓
exports/ (approved lessons/vocabulary/rules/exercises JSON)
```

Logs: `knowledge/books/logs/`

---

## Architecture

```
createKnowledgeEngine()
  ├─ BookService
  ├─ ImportService (+ TxtIngestService)
  ├─ PdfService / ImageService   ← optional / Future OCR
  ├─ OcrService                  ← optional / Future OCR
  ├─ ExtractionService           ← reads txt-source text
  ├─ VerificationService
  ├─ ExportService
  └─ KnowledgeBaseService
```

Providers (swappable):

- `PdfProvider` — retained for Future OCR Import
- `OcrProvider` — stub by default; Claude/OpenAI Vision only if `OCR_ENABLED=1`
- `ExtractionProvider` — Claude / OpenAI / stub (text-first; no image required)

Repository: file-system first (`FileKnowledgeRepository`). Prisma models mirror the pipeline for future DB sync.

---

## CLI

```bash
pnpm knowledge:discover
pnpm knowledge:import          # register TXT + ingest sections
pnpm knowledge:extract -- --slug=unit-1
pnpm knowledge:status -- --slug=unit-1
```

Optional Future OCR (not normal workflow):

```bash
OCR_ENABLED=1 pnpm knowledge:pages -- --slug=unit-1
OCR_ENABLED=1 pnpm knowledge:ocr -- --slug=unit-1
```

---

## Verification

Statuses: `PENDING` → `NEEDS_REVIEW` → `VERIFIED` → `APPROVED`

Only **APPROVED** pages are included in exports.

On export/publish, the engine rebuilds:

- `exports/vocabulary-index.json`
- `exports/rules-index.json`
- `exports/lessons-index.json`
- `exports/references-index.json`

Quran word clicks use `GET /api/v1/knowledge/lookup` against the vocabulary index only — never raw TXT. AI enrichment is separate and opt-in.

### TXT structure extraction (canonical)

Default extraction provider is **`txt-structure`**: a deterministic parser over manually transcribed TXT. It never invents meanings. AI extraction (`EXTRACTION_PROVIDER=claude|openai`) is optional/experimental only and must not replace TXT as the curriculum source.

### Development auto-approval

When `KNOWLEDGE_AUTO_APPROVE=1` (or `NODE_ENV=development` with the flag unset), import/extract also auto-approve → export → rebuild indexes. Records `approvedBy=development-auto`. **Production always ignores this flag** — manual Admin verification remains required. Set `KNOWLEDGE_AUTO_APPROVE=0` to disable locally.

---

## APIs

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/v1/knowledge/books` | Discover / import TXT |
| GET | `/api/v1/knowledge/books/[slug]` | Book status |
| GET/POST | `/api/v1/knowledge/pages` | List sections / PDF raster (OCR_ENABLED only) |
| GET/POST | `/api/v1/knowledge/ocr` | List source text / Vision OCR (OCR_ENABLED only) |
| GET/POST | `/api/v1/knowledge/extraction` | List / extract |
| GET/POST | `/api/v1/knowledge/verification` | List / update status |
| GET/POST | `/api/v1/knowledge/exports` | Read / export approved |
| GET | `/api/v1/knowledge/lookup?word=` | O(1) verified vocabulary lookup (normalized Arabic) |

---

## Docs

See also `docs/23-ai-extraction.md` and `docs/28-admin-knowledge-management.md`.
