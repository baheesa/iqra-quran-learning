/**
 * Whether Vision/PDF OCR may run in the normal knowledge workflow.
 * Default: disabled. Set OCR_ENABLED=1 to re-enable the optional OCR path.
 */
export function isOcrEnabled(): boolean {
  return process.env.OCR_ENABLED === "1";
}

export function isPdfRasterEnabled(): boolean {
  return process.env.PDF_RASTER_ENABLED === "1" || isOcrEnabled();
}
