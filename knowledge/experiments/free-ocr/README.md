# Free OCR Experiment (PaddleOCR)

> **Experimental only.** Does not modify the Knowledge Engine, admin UI,
> Claude/OpenAI OCR providers, extraction, verification, or publishing.

## Goal

Compare **free** OCR (PaddleOCR) against the production Vision OCR pipeline,
using **only** `knowledge/books/original/Unit 2.pdf`.

## Layout

```
knowledge/experiments/free-ocr/unit-2/
  pages/page001.png …
  ocr/page001.txt
  ocr/page001.json
  report.md
```

## Mac install (Homebrew)

```bash
bash scripts/install-free-ocr.sh
```

This will:

1. `brew install poppler` (provides `pdftoppm`) and `imagemagick` (fallback)
2. Create `.venv-free-ocr/`
3. Install `paddlepaddle` + `paddleocr`
4. Verify imports

Manual tools if needed:

```bash
brew install poppler imagemagick python
```

## Run

```bash
pnpm free-ocr:unit2
```

Smoke test (first 2 pages only — recommended first):

```bash
FREE_OCR_MAX_PAGES=2 pnpm free-ocr:unit2
```

**Performance note (CPU Mac):** PaddleOCR mobile models take roughly 30–60s per page after the first model load. Full Unit 2 can take a long time; start with `FREE_OCR_MAX_PAGES=2`.

Ghostscript (`gs`) is an automatic last-resort rasterizer if `pdftoppm` / ImageMagick are not installed yet.

## Compare OCR with the PDF

1. Open `knowledge/books/original/Unit 2.pdf` in Preview.
2. Open the matching PNG: `knowledge/experiments/free-ocr/unit-2/pages/page014.png`
3. Open the OCR text: `knowledge/experiments/free-ocr/unit-2/ocr/page014.txt`
4. Check `report.md` for average confidence and weak pages.
5. Optionally compare the same page against production OCR under
   `knowledge/books/ocr/` (Unit 1 / other books) — Unit 2 production OCR is
   separate and unchanged by this experiment.

## Notes

- No OpenAI / Claude calls.
- No lesson extraction.
- Production `pnpm knowledge:ocr-live` remains unchanged.
