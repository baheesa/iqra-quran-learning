import { NextResponse } from "next/server";

import { knowledgeEngine } from "@/features/knowledge/server";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const status = await knowledgeEngine.knowledgeBase.getBookStatus(slug);

  if (!status) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "BOOK_NOT_FOUND", message: "Book not found" },
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    data: status,
    message: "",
    timestamp: new Date().toISOString(),
  });
}
