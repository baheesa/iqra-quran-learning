import type {
  PdfMetadata,
  PdfProvider,
  RenderedPage,
} from "@/features/knowledge/providers/types";

/** Deterministic provider for unit tests — never touches real PDFs. */
export function createStubPdfProvider(options?: {
  pageCount?: number;
  title?: string;
}): PdfProvider {
  const pageCount = options?.pageCount ?? 3;
  const title = options?.title ?? "Stub Book";

  return {
    name: "stub-pdf",

    async getMetadata(): Promise<PdfMetadata> {
      return { pageCount, title };
    },

    async renderPages(
      _pdfAbsolutePath: string,
      renderOptions?: { maxPages?: number },
    ): Promise<RenderedPage[]> {
      const limit = renderOptions?.maxPages
        ? Math.min(renderOptions.maxPages, pageCount)
        : pageCount;

      return Array.from({ length: limit }, (_, index) => ({
        pageNumber: index + 1,
        imageBytes: null,
        width: 1200,
        height: 1600,
      }));
    },
  };
}
