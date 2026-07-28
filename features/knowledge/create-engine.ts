import { resolveLiveAiBackend } from "@/features/knowledge/providers/ai-provider-config";
import { isOcrEnabled } from "@/features/knowledge/providers/ocr-enabled";
import { createClaudeExtractionProvider } from "@/features/knowledge/providers/claude-extraction";
import { createClaudeVisionOcrProvider } from "@/features/knowledge/providers/claude-vision-ocr";
import { createGhostscriptPdfProvider } from "@/features/knowledge/providers/ghostscript-pdf-provider";
import { createPdfLibProvider } from "@/features/knowledge/providers/pdf-lib-provider";
import { createOpenAiExtractionProvider } from "@/features/knowledge/providers/openai-extraction";
import { createOpenAiVisionOcrProvider } from "@/features/knowledge/providers/openai-vision-ocr";
import { createStubExtractionProvider } from "@/features/knowledge/providers/stub-extraction-provider";
import { createStubOcrProvider } from "@/features/knowledge/providers/stub-ocr-provider";
import { createStubPdfProvider } from "@/features/knowledge/providers/stub-pdf-provider";
import { createTxtStructureExtractionProvider } from "@/features/knowledge/providers/txt-structure-extraction-provider";
import type {
  ExtractionProvider,
  OcrProvider,
  PdfProvider,
} from "@/features/knowledge/providers/types";
import {
  createFileKnowledgeRepository,
  type FileKnowledgeRepository,
} from "@/features/knowledge/repository/file-repository";
import { createBookService } from "@/features/knowledge/services/book-service";
import { createDevAutoPublishService } from "@/features/knowledge/services/dev-auto-publish-service";
import { createExportService } from "@/features/knowledge/services/export-service";
import { createExtractionService } from "@/features/knowledge/services/extraction-service";
import { createImportService } from "@/features/knowledge/services/import-service";
import { createKnowledgeBaseService } from "@/features/knowledge/services/knowledge-base-service";
import { createKnowledgeExporter } from "@/features/knowledge/services/knowledge-exporter";
import { createKnowledgeImporter } from "@/features/knowledge/services/knowledge-importer";
import { createOcrService } from "@/features/knowledge/services/ocr-service";
import {
  createImageService,
  createPdfService,
} from "@/features/knowledge/services/pdf-image-service";
import { createTxtIngestService } from "@/features/knowledge/services/txt-ingest-service";
import { createVerificationEngine } from "@/features/knowledge/services/verification-service";
import { isKnowledgeAutoApproveEnabled } from "@/features/knowledge/providers/auto-approve-enabled";

export type KnowledgeEngineDeps = {
  repo?: FileKnowledgeRepository;
  pdf?: PdfProvider;
  ocr?: OcrProvider;
  extraction?: ExtractionProvider;
  /** Use stub PDF provider (tests / offline). Default: ghostscript. */
  useStubPdf?: boolean;
  /** Force stub AI providers even if a live API key is set. */
  useStubAi?: boolean;
  /**
   * Force-enable Vision OCR providers even when OCR_ENABLED is unset.
   * Prefer OCR_ENABLED=1 in real environments.
   */
  enableOcr?: boolean;
};

function resolvePdfProvider(deps: KnowledgeEngineDeps): PdfProvider {
  if (deps.pdf) {
    return deps.pdf;
  }
  if (deps.useStubPdf) {
    return createStubPdfProvider();
  }
  if (process.env.PDF_PROVIDER === "pdf-lib") {
    return createPdfLibProvider();
  }
  return createGhostscriptPdfProvider();
}

function resolveOcrProvider(deps: KnowledgeEngineDeps): OcrProvider {
  if (deps.ocr) {
    return deps.ocr;
  }
  // Default workflow: OCR inactive (TXT is primary). Keep providers available.
  const ocrOn = deps.enableOcr === true || isOcrEnabled();
  if (!ocrOn || deps.useStubAi) {
    return createStubOcrProvider();
  }
  const backend = resolveLiveAiBackend();
  if (backend === "claude") {
    return createClaudeVisionOcrProvider();
  }
  if (backend === "openai") {
    return createOpenAiVisionOcrProvider();
  }
  return createStubOcrProvider();
}

function resolveExtractionProvider(
  deps: KnowledgeEngineDeps,
): ExtractionProvider {
  if (deps.extraction) {
    return deps.extraction;
  }
  // Tests may force empty stub; curriculum never comes from AI by default.
  if (deps.useStubAi) {
    return createStubExtractionProvider();
  }
  // Optional experiment only — core knowledge must come from TXT structure.
  if (process.env.EXTRACTION_PROVIDER === "claude") {
    return createClaudeExtractionProvider();
  }
  if (process.env.EXTRACTION_PROVIDER === "openai") {
    return createOpenAiExtractionProvider();
  }
  return createTxtStructureExtractionProvider();
}

export function createKnowledgeEngine(deps: KnowledgeEngineDeps = {}) {
  const repo = deps.repo ?? createFileKnowledgeRepository();
  const pdf = resolvePdfProvider(deps);
  const ocr = resolveOcrProvider(deps);
  const extractionProvider = resolveExtractionProvider(deps);
  const txtIngest = createTxtIngestService(repo);

  const books = createBookService(repo);
  const pdfService = createPdfService({ repo, pdf });
  const images = createImageService({ repo, pdf });
  const importService = createImportService({ books, repo, pdf, txtIngest });
  const ocrService = createOcrService({ repo, ocr });
  const extractionService = createExtractionService({
    repo,
    extraction: extractionProvider,
  });
  const verification = createVerificationEngine(repo);
  const exportService = createExportService(repo);
  const knowledgeBase = createKnowledgeBaseService(repo);
  const devAutoPublish = createDevAutoPublishService({
    repo,
    verification,
    export: exportService,
  });

  const extraction = {
    list: extractionService.list.bind(extractionService),
    async extractBook(
      bookSlug: string,
      options?: { maxPages?: number },
    ) {
      const results = await extractionService.extractBook(bookSlug, options);
      const auto = await devAutoPublish.maybeRun(bookSlug);
      if (auto.enabled && !auto.skipped) {
        return extractionService.list(bookSlug);
      }
      return results;
    },
    async extractPage(bookSlug: string, pageNumber: number) {
      await extractionService.extractPage(bookSlug, pageNumber);
      await devAutoPublish.maybeRun(bookSlug);
      const refreshed = await repo.getExtraction(bookSlug, pageNumber);
      if (!refreshed) {
        throw new Error(`Missing extraction after auto-publish: ${bookSlug} p${pageNumber}`);
      }
      return refreshed;
    },
  };

  const importWrapped = {
    reimportTxt: importService.reimportTxt.bind(importService),
    async importAll(options?: { forceReimport?: boolean }) {
      const result = await importService.importAll(options);
      if (isKnowledgeAutoApproveEnabled()) {
        for (const slug of result.books) {
          await extraction.extractBook(slug);
        }
      }
      return result;
    },
    async importOne(fileName: string, options?: { forceReimport?: boolean }) {
      const manifest = await importService.importOne(fileName, options);
      if (isKnowledgeAutoApproveEnabled()) {
        await extraction.extractBook(manifest.slug);
      }
      return manifest;
    },
  };

  const engineCore = {
    repo,
    books,
    import: importWrapped,
    txtIngest,
    pdf: pdfService,
    images,
    ocr: ocrService,
    extraction,
    verification,
    export: exportService,
    knowledgeBase,
    devAutoPublish,
  };

  const importer = createKnowledgeImporter(engineCore);
  const exporter = createKnowledgeExporter(repo);

  return {
    ...engineCore,
    importer,
    exporter,
    providers: {
      pdf: pdf.name,
      ocr: ocr.name,
      extraction: extractionProvider.name,
      source: "txt-primary",
      ocrEnabled: deps.enableOcr === true || isOcrEnabled(),
      knowledgeAutoApprove: isKnowledgeAutoApproveEnabled(),
    },
  };
}

export type KnowledgeEngine = ReturnType<typeof createKnowledgeEngine>;
