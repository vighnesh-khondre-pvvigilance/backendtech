// src/utils/generateReportPdf.ts
// Generates a PDF entirely in the browser from the rendered ReportTemplate.
// Drop-in replacement for the Puppeteer-based server PDF generation.

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface PdfGenerationOptions {
  /** DOM element id that wraps all .report-page divs. Default: 'report-content' */
  elementId?: string;
  /** JPEG quality 0–1. Default: 0.92 */
  quality?: number;
  /** Canvas scale factor for resolution. Default: 2 (retina-quality) */
  scale?: number;
  /** Whether to trigger a file download in the browser. Default: false */
  download?: boolean;
  /** Filename used when download: true. Default: 'report.pdf' */
  filename?: string;
  /** Called with (completedPages, totalPages) after each page is rendered */
  onProgress?: (done: number, total: number) => void;
}

/**
 * Renders every `.report-page` element inside `elementId` to an A4 PDF.
 *
 * Returns the finished PDF as a Blob so the caller can upload it to S3
 * (or anywhere else) without any server-side browser.
 *
 * Usage:
 *   const blob = await generateReportPdf({ download: true, filename: 'audit.pdf' });
 *   // then POST the blob to your API
 */
export async function generateReportPdf({
  elementId = 'report-content',
  quality = 0.92,
  scale = 2,
  download = false,
  filename = 'report.pdf',
  onProgress,
}: PdfGenerationOptions = {}): Promise<Blob> {
  // ── 1. Wait for fonts so text is crisp ────────────────────────────────────
  await document.fonts.ready;

  // ── 2. Locate pages ───────────────────────────────────────────────────────
  const root = document.getElementById(elementId);
  if (!root) throw new Error(`Element #${elementId} not found in DOM`);

  const pages = Array.from(root.querySelectorAll<HTMLElement>('.report-page'));
  if (pages.length === 0) throw new Error('No .report-page elements found inside #' + elementId);

  // ── 3. Create A4 PDF ──────────────────────────────────────────────────────
  const PDF_W_MM = 210;
  const PDF_H_MM = 297;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // ── 4. Render each page to canvas → add to PDF ───────────────────────────
  for (let i = 0; i < pages.length; i++) {
    const pageEl = pages[i];

    // Temporarily force the element to its natural A4 pixel width so
    // html2canvas doesn't capture a zoomed-out or cropped version.
    const originalOverflow = pageEl.style.overflow;
    pageEl.style.overflow = 'visible';

    const canvas = await html2canvas(pageEl, {
      scale,
      useCORS: true,       // required for S3 presigned photo URLs
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      // Capture the full element even if it overflows the viewport
      scrollX: 0,
      scrollY: 0,
      windowWidth: pageEl.scrollWidth,
      windowHeight: pageEl.scrollHeight,
    });

    pageEl.style.overflow = originalOverflow;

    const imgData = canvas.toDataURL('image/jpeg', quality);

    // Scale image to fill the full A4 width; height is proportional.
    const imgW = PDF_W_MM;
    const imgH = (canvas.height / canvas.width) * PDF_W_MM;

    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH, undefined, 'FAST');

    onProgress?.(i + 1, pages.length);
  }

  // ── 5. Return blob (and optionally trigger download) ──────────────────────
  if (download) {
    pdf.save(filename);
  }

  return pdf.output('blob');
}