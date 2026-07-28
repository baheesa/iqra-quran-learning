import { NextResponse } from "next/server";

import { requireStaffPermission } from "@/features/admin/http";
import { getAdminEngine } from "@/features/admin/server";

export async function GET(request: Request) {
  const gate = await requireStaffPermission(request, "books.browse");
  if (!gate.ok) return gate.response;

  const knowledge = getAdminEngine().knowledge;
  const [discovered, registered, overview] = await Promise.all([
    knowledge.books.discover(),
    knowledge.books.list(),
    knowledge.knowledgeBase.listBooksOverview(),
  ]);

  return NextResponse.json({
    success: true,
    data: { discovered, registered, overview },
    message: "",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    fileName?: string;
    importAll?: boolean;
    action?: "archive" | "version" | "import";
    bookSlug?: string;
  };

  const permission =
    body.action === "archive"
      ? "books.archive"
      : body.action === "version"
        ? "books.import"
        : "books.import";

  const gate = await requireStaffPermission(request, permission);
  if (!gate.ok) return gate.response;

  const admin = getAdminEngine();

  if (body.action === "archive" && body.bookSlug) {
    const manifest = await admin.admin.archiveBook(body.bookSlug, gate.actor);
    return NextResponse.json({
      success: true,
      data: manifest,
      message: "Book archived",
      timestamp: new Date().toISOString(),
    });
  }

  if (body.action === "version" && body.bookSlug) {
    const manifest = await admin.admin.versionBook(body.bookSlug, gate.actor);
    return NextResponse.json({
      success: true,
      data: manifest,
      message: "Book versioned",
      timestamp: new Date().toISOString(),
    });
  }

  if (body.importAll) {
    const result = await admin.knowledge.import.importAll();
    await admin.audit.record({
      actor: gate.actor,
      action: "BOOK_IMPORTED",
      objectType: "BOOK",
      meta: { importAll: true, count: result.imported },
    });
    return NextResponse.json({
      success: true,
      data: result,
      message: "Books imported",
      timestamp: new Date().toISOString(),
    });
  }

  if (!body.fileName) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_FILE_NAME",
          message: "fileName is required unless importAll=true",
        },
      },
      { status: 400 },
    );
  }

  const manifest = await admin.knowledge.import.importOne(body.fileName);
  await admin.audit.record({
    actor: gate.actor,
    action: "BOOK_IMPORTED",
    bookSlug: manifest.slug,
    objectType: "BOOK",
    objectId: manifest.id,
    meta: { fileName: body.fileName },
  });

  return NextResponse.json({
    success: true,
    data: manifest,
    message: "Book imported",
    timestamp: new Date().toISOString(),
  });
}
