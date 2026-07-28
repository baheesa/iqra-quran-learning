"use client";

import { useLayoutEffect, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  wordId: string;
  arabic: string;
  anchorEl: HTMLElement | null;
  prevId?: string | null;
  prevArabic?: string | null;
  nextId?: string | null;
  nextArabic?: string | null;
  /** No ayah context — use form consensus (qawaid / unscoped lists). */
  standalone?: boolean;
  onResolved: (meaning: string | null) => void;
};

type MeaningPayload = {
  found?: boolean;
  meaning?: string | null;
  message?: string | null;
};

type TipPlace = "above" | "below";

type TipPos = {
  top: number;
  left: number;
  place: TipPlace;
  arrowX: number;
  maxWidth: number;
};

/**
 * Fixed Urdu-only tip, clamped inside the viewport (same behavior as Iqra APK).
 * Portaled to document.body so overflow/clipping on cards cannot break it.
 */
export function WordMeaningTooltip({
  wordId,
  arabic,
  anchorEl,
  prevId,
  prevArabic,
  nextId,
  nextArabic,
  standalone = false,
  onResolved,
}: Props) {
  const [text, setText] = useState("…");
  const [mounted, setMounted] = useState(false);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<TipPos | null>(null);
  const onResolvedRef = useRef(onResolved);
  onResolvedRef.current = onResolved;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setText("…");

    void (async () => {
      try {
        const params = new URLSearchParams({
          id: wordId,
          word: arabic,
        });
        if (standalone) params.set("standalone", "1");
        if (prevId) params.set("prevId", prevId);
        if (prevArabic) params.set("prevWord", prevArabic);
        if (nextId) params.set("nextId", nextId);
        if (nextArabic) params.set("nextWord", nextArabic);

        const response = await fetch(
          `/api/v1/reading/word-meaning?${params.toString()}`,
        );
        if (!response.ok) throw new Error("lookup failed");
        const payload = (await response.json()) as {
          data?: MeaningPayload;
        };
        if (cancelled) return;
        const result = payload.data;
        if (result?.found && result.meaning) {
          setText(result.meaning);
          onResolvedRef.current(result.meaning);
        } else {
          const message =
            result?.message ?? "اس لفظ کی وضاحت ابھی دستیاب نہیں۔";
          setText(message);
          onResolvedRef.current(null);
        }
      } catch {
        if (!cancelled) {
          setText("اس لفظ کی وضاحت ابھی دستیاب نہیں۔");
          onResolvedRef.current(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [wordId, arabic, prevId, prevArabic, nextId, nextArabic, standalone]);

  useLayoutEffect(() => {
    if (!anchorEl || !tipRef.current) {
      setPos(null);
      return;
    }

    const place = () => {
      const el = tipRef.current;
      if (!el || !anchorEl) return;
      const tipAnchor = anchorEl.getBoundingClientRect();
      const pad = 12;
      const topBar = 64;
      const vv = window.visualViewport;
      const vw = vv?.width ?? window.innerWidth;
      const vh = vv?.height ?? window.innerHeight;
      const ox = vv?.offsetLeft ?? 0;
      const oy = vv?.offsetTop ?? 0;

      const maxWidth = Math.max(120, Math.min(vw - pad * 2, 22 * 16));
      el.style.maxWidth = `${maxWidth}px`;

      const tipW = el.offsetWidth;
      const tipH = el.offsetHeight;
      const anchorCenterX = tipAnchor.left + tipAnchor.width / 2;

      let left = anchorCenterX - tipW / 2;
      const minLeft = ox + pad;
      const maxLeft = ox + vw - tipW - pad;
      left = Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft));

      const above = tipAnchor.top - tipH - 12;
      const placeBelow = above < oy + topBar + pad;
      let top = placeBelow ? tipAnchor.bottom + 12 : above;
      top = Math.min(Math.max(top, oy + pad), oy + vh - tipH - pad);

      const arrowX = Math.min(
        Math.max(anchorCenterX - left, 14),
        Math.max(14, tipW - 14),
      );

      const next: TipPos = {
        top,
        left,
        place: placeBelow ? "below" : "above",
        arrowX,
        maxWidth,
      };
      setPos((prev) => {
        if (
          prev &&
          prev.top === next.top &&
          prev.left === next.left &&
          prev.place === next.place &&
          prev.arrowX === next.arrowX &&
          prev.maxWidth === next.maxWidth
        ) {
          return prev;
        }
        return next;
      });
    };

    place();
    const raf = window.requestAnimationFrame(place);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [anchorEl, text]);

  if (!mounted) return null;

  return createPortal(
    <div
      ref={tipRef}
      role="tooltip"
      className={[
        "border-border bg-surface pointer-events-none fixed z-[80] rounded-2xl border px-3 py-2 text-center shadow-[0_12px_32px_-12px_rgba(0,0,0,0.4)]",
        pos?.place === "below" ? "tip-below" : "",
      ].join(" ")}
      style={
        pos
          ? {
              top: pos.top,
              left: pos.left,
              maxWidth: pos.maxWidth,
              visibility: "visible",
              ["--tip-arrow-x" as string]: `${pos.arrowX}px`,
            }
          : {
              top: 0,
              left: 0,
              visibility: "hidden",
              maxWidth: "min(92vw, 22rem)",
            }
      }
    >
      <div
        className="border-border bg-surface absolute h-2.5 w-2.5 rotate-45 border-r border-b"
        style={
          pos?.place === "below"
            ? {
                left: "var(--tip-arrow-x, 50%)",
                marginLeft: -5,
                bottom: "100%",
                marginBottom: -5,
                borderRight: "none",
                borderBottom: "none",
                borderTop: "1px solid var(--border, currentColor)",
                borderLeft: "1px solid var(--border, currentColor)",
              }
            : {
                left: "var(--tip-arrow-x, 50%)",
                marginLeft: -5,
                top: "100%",
                marginTop: -5,
              }
        }
      />
      <p className="font-urdu text-foreground m-0 text-[0.95rem] leading-[2.1]">
        {text}
      </p>
    </div>,
    document.body,
  );
}
