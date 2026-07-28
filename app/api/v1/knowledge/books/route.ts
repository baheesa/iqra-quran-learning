import { NextResponse } from "next/server";

import { requireStaffPermission } from "@/features/admin/http";
import { getAdminEngine } from "@/features/admin/server";

export async function GET(request: Request) {
  const gate = await requireStaffPermission(request, "books.browse");
  if (!gate.ok) return gate.response;

  const knowledge = getAdminEngine().knowledge;
  const [discovered, registered] = await Promise.all([
    knowledge.books.discover(),
    knowledge.books.list(),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      discovered: discovered.map((book) => ({
        fileName: book.fileName,
        title: book.title,
        unitNumber: book.unitNumber,
        checksum: book.checksum,
        sizeBytes: book.sizeBytes,
      })),
      registered,
    },
    message: "",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const gate = await requireStaffPermission(request, "books.import");
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => ({}))) as {
    fileName?: string;
    importAll?: boolean;
  };

  const knowledge = getAdminEngine().knowledge;

  if (body.importAll) {
    const result = await knowledge.import.importAll();
    await getAdminEngine().audit.record({
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

  const manifest = await knowledge.import.importOne(body.fileName);
  await getAdminEngine().audit.record({
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
