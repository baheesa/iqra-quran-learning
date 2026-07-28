#!/usr/bin/env bash
# =============================================================================
# Free OCR POC — Mac installation (Homebrew + Python venv + PaddleOCR)
# Does NOT affect the production Knowledge Engine.
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Free OCR install (experimental)"
echo "    Project: $ROOT"

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 not found. Install with: brew install python"
  exit 1
fi

# PDF tools: prefer pdftoppm; ImageMagick fallback; Ghostscript last (often already present)
if command -v brew >/dev/null 2>&1; then
  echo "==> Homebrew PDF tools (optional if Ghostscript already works)"
  if ! command -v pdftoppm >/dev/null 2>&1; then
    echo "    Installing poppler (pdftoppm)…"
    brew install poppler || echo "WARN: poppler install skipped — Ghostscript/ImageMagick may still work"
  else
    echo "    pdftoppm: already available"
  fi
  if ! command -v magick >/dev/null 2>&1 && ! command -v convert >/dev/null 2>&1; then
    echo "    Installing imagemagick (fallback)…"
    brew install imagemagick || echo "WARN: imagemagick install skipped"
  else
    echo "    ImageMagick: already available"
  fi
else
  echo "WARN: Homebrew not found — relying on Ghostscript if present"
fi

if ! command -v pdftoppm >/dev/null 2>&1 && ! command -v magick >/dev/null 2>&1 && ! command -v convert >/dev/null 2>&1 && ! command -v gs >/dev/null 2>&1; then
  echo "ERROR: Need pdftoppm, ImageMagick, or Ghostscript (gs) to rasterize PDFs."
  exit 1
fi

VENV="$ROOT/.venv-free-ocr"
echo "==> Creating venv at $VENV"
if [[ ! -d "$VENV" ]]; then
  python3 -m venv "$VENV"
fi

# shellcheck disable=SC1091
source "$VENV/bin/activate"
python -m pip install --upgrade pip wheel setuptools

echo "==> Installing PaddlePaddle + PaddleOCR (CPU)"
if ! python -m pip install "paddlepaddle>=2.6.0" "paddleocr>=2.7.0"; then
  echo "Direct install failed; trying pinned paddlepaddle…"
  python -m pip install "paddlepaddle==2.6.2" || true
  python -m pip install "paddleocr>=2.7.0"
fi

echo "==> Verifying Python packages"
python - <<'PY'
import sys
print("python", sys.version)
import paddle
print("paddle", getattr(paddle, "__version__", "?"))
from paddleocr import PaddleOCR
print("paddleocr: OK")
PY

echo "==> PDF tools on PATH"
command -v pdftoppm && echo "pdftoppm OK" || echo "pdftoppm: missing (ok if gs works)"
command -v magick >/dev/null && echo "magick OK" || true
command -v convert >/dev/null && echo "convert OK" || true
command -v gs && echo "gs OK" || true

echo ""
echo "Install complete."
echo "Run the experiment:"
echo "  pnpm free-ocr:unit2"
echo ""
echo "Optional smoke (first 2 pages only):"
echo "  FREE_OCR_MAX_PAGES=2 pnpm free-ocr:unit2"
