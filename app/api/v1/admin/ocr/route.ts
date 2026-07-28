import { NextResponse } from "next/server";

import { requireStaffPermission } from "@/features/admin/http";
import { getAdminEngine } from "@/features/admin/server";
import type { OcrReviewStatus } from "@/features/admin/types";
import {
  liveAiKeyHintUrdu,
  resolveLiveAiBackend,
} from "@/features/knowledge/providers/ai-provider-config";
import { isOcrEnabled } from "@/features/knowledge/providers/ocr-enabled";

export async function GET(request: Request) {
  const gate = await requireStaffPermission(request, "ocr.view");
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const bookSlug = url.searchParams.get("bookSlug");
  const pageNumber = Number(url.searchParams.get("page") ?? "");

  if (!bookSlug || Number.isNaN(pageNumber)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_QUERY",
          message: "bookSlug and page are required",
        },
      },
      { status: 400 },
    );
  }

  const ocr = await getAdminEngine().knowledge.repo.getOcrResult(
    bookSlug,
    pageNumber,
  );
  return NextResponse.json({
    success: true,
    data: ocr,
    message: "",
    timestamp: new Date().toISOString(),
  });
}

export async function PATCH(request: Request) {
  const gate = await requireStaffPermission(request, "ocr.accept");
  if (!gate.ok) return gate.response;

  const body = (await request.json()) as {
    bookSlug?: string;
    pageNumber?: number;
    status?: OcrReviewStatus;
  };

  if (!body.bookSlug || typeof body.pageNumber !== "number" || !body.status) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_BODY",
          message: "bookSlug, pageNumber, and status are required",
        },
      },
      { status: 400 },
    );
  }

  const result = await getAdminEngine().admin.setOcrReview({
    bookSlug: body.bookSlug,
    pageNumber: body.pageNumber,
    status: body.status,
    actor: gate.actor,
  });

  return NextResponse.json({
    success: true,
    data: result,
    message: "OCR review updated",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const gate = await requireStaffPermission(request, "ocr.rerun");
  if (!gate.ok) return gate.response;

  if (!isOcrEnabled()) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "OCR_DISABLED",
          message:
            "Future OCR Import is inactive. Primary source is TXT. Set OCR_ENABLED=1 to enable Vision OCR.",
        },
      },
      { status: 400 },
    );
  }

  const body = (await request.json()) as {
    bookSlug?: string;
    pageNumber?: number;
  };

  if (!body.bookSlug || typeof body.pageNumber !== "number") {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_BODY",
          message: "bookSlug and pageNumber are required",
        },
      },
      { status: 400 },
    );
  }

  if (resolveLiveAiBackend() === "none") {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "OCR_KEY_MISSING",
          message: liveAiKeyHintUrdu(),
        },
      },
      { status: 400 },
    );
  }

  try {
    const result = await getAdminEngine().knowledge.ocr.runPage(
      body.bookSlug,
      body.pageNumber,
    );
    await getAdminEngine().audit.record({
      actor: gate.actor,
      action: "OCR_RUN",
      bookSlug: body.bookSlug,
      objectType: "OCR",
      objectId: `${body.bookSlug}:p${body.pageNumber}`,
    });

    if (result.provider === "stub-ocr" || !result.rawText) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "OCR_STUB",
            message:
              "OCR still stub/empty. Restart pnpm dev after setting ANTHROPIC_API_KEY or OPENAI_API_KEY (see AI_PROVIDER).",
          },
          data: result,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `OCR complete (${result.rawText.length} chars)`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "OCR_FAILED",
          message: error instanceof Error ? error.message : "OCR failed",
        },
      },
      { status: 400 },
    );
  }
}
