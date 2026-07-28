#!/usr/bin/env python3
"""
EXPERIMENTAL — PaddleOCR batch runner for free-ocr POC.

Usage:
  .venv-free-ocr/bin/python scripts/free-ocr-paddle.py page001.png [page002.png ...]

Prints one JSON object per line to stdout.
"""

from __future__ import annotations

import json
import os
import sys
import warnings
from typing import Any, List, Optional, Tuple

os.environ.setdefault("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK", "True")
os.environ.setdefault("FLAGS_minloglevel", "2")
os.environ.setdefault("GLOG_minloglevel", "2")
warnings.filterwarnings("ignore")


def _extract_from_legacy(result: Any) -> Tuple[str, Optional[float]]:
    if not result:
        return "", None
    lines: List[str] = []
    confs: List[float] = []
    pages = result if isinstance(result, list) else [result]
    for page in pages:
        if not page:
            continue
        for item in page:
            try:
                text = item[1][0]
                conf = float(item[1][1])
                if text:
                    lines.append(str(text))
                    confs.append(conf)
            except (IndexError, TypeError, ValueError):
                continue
    avg = sum(confs) / len(confs) if confs else None
    return "\n".join(lines), avg


def _as_mapping(item: Any) -> Any:
    if isinstance(item, dict):
        return item
    if hasattr(item, "json") and callable(getattr(item, "json", None)):
        try:
            payload = item.json
            if callable(payload):
                payload = payload()
            if isinstance(payload, dict):
                return payload
        except Exception:  # noqa: BLE001
            pass
    if hasattr(item, "res"):
        return item.res
    return item


def _extract_from_predict(result: Any) -> Tuple[str, Optional[float]]:
    if result is None:
        return "", None
    items = result if isinstance(result, list) else [result]
    lines: List[str] = []
    confs: List[float] = []
    for raw in items:
        item = _as_mapping(raw)
        texts = None
        scores = None
        if isinstance(item, dict):
            texts = item.get("rec_texts") or item.get("texts")
            scores = item.get("rec_scores") or item.get("scores")
        else:
            texts = getattr(item, "rec_texts", None) or getattr(item, "texts", None)
            scores = getattr(item, "rec_scores", None) or getattr(
                item, "scores", None
            )
        if texts:
            for i, t in enumerate(texts):
                if not t:
                    continue
                lines.append(str(t))
                if scores is not None and i < len(scores):
                    try:
                        confs.append(float(scores[i]))
                    except (TypeError, ValueError):
                        pass
    if lines:
        avg = sum(confs) / len(confs) if confs else None
        return "\n".join(lines), avg
    return _extract_from_legacy(result)


def _create_ocr():
    from paddleocr import PaddleOCR  # type: ignore

    # Prefer mobile models on CPU Macs (server_det can take 10+ min/page).
    try:
        return PaddleOCR(
            lang="ar",
            text_detection_model_name="PP-OCRv5_mobile_det",
            text_recognition_model_name="arabic_PP-OCRv5_mobile_rec",
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
        )
    except TypeError:
        try:
            return PaddleOCR(
                lang="ar",
                use_doc_orientation_classify=False,
                use_doc_unwarping=False,
                use_textline_orientation=False,
            )
        except TypeError:
            try:
                return PaddleOCR(lang="ar")
            except TypeError:
                return PaddleOCR()


def _recognize(ocr: Any, image_path: str) -> Tuple[str, Optional[float]]:
    if hasattr(ocr, "predict"):
        raw = ocr.predict(image_path)
        text, confidence = _extract_from_predict(raw)
        if text:
            return text, confidence
    if hasattr(ocr, "ocr"):
        try:
            raw = ocr.ocr(image_path)
        except TypeError:
            raw = ocr.ocr(image_path, cls=False)
        return _extract_from_legacy(raw)
    raise RuntimeError("Unsupported PaddleOCR API (no ocr/predict)")


def main() -> int:
    if len(sys.argv) < 2:
        print(
            json.dumps(
                {"error": "Usage: free-ocr-paddle.py <image.png> [more.png…]", "text": ""}
            ),
            flush=True,
        )
        return 1

    paths = sys.argv[1:]

    try:
        ocr = _create_ocr()
    except ImportError as exc:
        print(
            json.dumps(
                {
                    "error": f"PaddleOCR not installed: {exc}. Run scripts/install-free-ocr.sh",
                    "text": "",
                    "confidence": None,
                    "pageIndex": 0,
                }
            ),
            flush=True,
        )
        return 1

    exit_code = 0
    for index, image_path in enumerate(paths):
        try:
            text, confidence = _recognize(ocr, image_path)
            print(
                json.dumps(
                    {
                        "pageIndex": index,
                        "path": image_path,
                        "text": text,
                        "confidence": confidence,
                        "provider": "PaddleOCR",
                    },
                    ensure_ascii=False,
                ),
                flush=True,
            )
        except Exception as exc:  # noqa: BLE001
            exit_code = 1
            print(
                json.dumps(
                    {
                        "pageIndex": index,
                        "path": image_path,
                        "error": str(exc),
                        "text": "",
                        "confidence": None,
                        "provider": "PaddleOCR",
                    },
                    ensure_ascii=False,
                ),
                flush=True,
            )

    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
