import { execFile } from "child_process";
import { mkdtemp, readFile, rm } from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";

import { PDFDocument } from "pdf-lib";

import type {
  PdfMetadata,
  PdfProvider,
  RenderedPage,
} from "@/features/knowledge/providers/types";

const execFileAsync = promisify(execFile);

/**
 * Ghostscript-backed PDF rasterizer for Muallim scanned books.
 * Falls back to metadata-only pages when `gs` is unavailable.
 */
export function createGhostscriptPdfProvider(): PdfProvider {
  return {
    name: "ghostscript",

    async getMetadata(pdfAbsolutePath: string): Promise<PdfMetadata> {
      const bytes = await readFile(pdfAbsolutePath);
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      return {
        pageCount: doc.getPageCount(),
        title: doc.getTitle() ?? null,
      };
    },

    async renderPages(
      pdfAbsolutePath: string,
      options?: { maxPages?: number },
    ): Promise<RenderedPage[]> {
      const metadata = await this.getMetadata(pdfAbsolutePath);
      const limit = options?.maxPages
        ? Math.min(options.maxPages, metadata.pageCount)
        : metadata.pageCount;

      const tempDir = await mkdtemp(path.join(os.tmpdir(), "qls-gs-"));
      const outputPattern = path.join(tempDir, "page-%03d.png");

      try {
        await execFileAsync(
          "gs",
          [
            "-dSAFER",
            "-dBATCH",
            "-dNOPAUSE",
            "-sDEVICE=png16m",
            "-r150",
            `-dLastPage=${limit}`,
            `-sOutputFile=${outputPattern}`,
            pdfAbsolutePath,
          ],
          { maxBuffer: 20 * 1024 * 1024 },
        );

        const pages: RenderedPage[] = [];
        for (let pageNumber = 1; pageNumber <= limit; pageNumber += 1) {
          const file = path.join(
            tempDir,
            `page-${String(pageNumber).padStart(3, "0")}.png`,
          );
          try {
            const imageBytes = await readFile(file);
            pages.push({
              pageNumber,
              imageBytes: new Uint8Array(imageBytes),
              width: null,
              height: null,
            });
          } catch {
            pages.push({
              pageNumber,
              imageBytes: null,
              width: null,
              height: null,
            });
          }
        }
        return pages;
      } catch {
        // Ghostscript missing or failed — return placeholders
        const pages: RenderedPage[] = [];
        for (let pageNumber = 1; pageNumber <= limit; pageNumber += 1) {
          pages.push({
            pageNumber,
            imageBytes: null,
            width: null,
            height: null,
          });
        }
        return pages;
      } finally {
        await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
      }
    },
  };
}
