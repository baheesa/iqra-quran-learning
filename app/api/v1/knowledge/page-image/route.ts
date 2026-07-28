import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

import { knowledgeEngine } from "@/features/knowledge/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookSlug = searchParams.get("bookSlug");
  const page = Number(searchParams.get("page"));

  if (!bookSlug || !Number.isInteger(page)) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INVALID_QUERY", message: "bookSlug and page required" },
      },
      { status: 400 },
    );
  }

  const pages = await knowledgeEngine.repo.listPages(bookSlug);
  const record = pages.find((item) => item.pageNumber === page);
  if (!record?.imageRelativePath) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "IMAGE_NOT_FOUND", message: "Page image not found" },
      },
      { status: 404 },
    );
  }

  const absolute = path.join(
    knowledgeEngine.repo.dirs.root,
    record.imageRelativePath,
  );
  const bytes = await readFile(absolute);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=60",
    },
  });
}
