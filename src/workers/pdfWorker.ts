/**
 * PDF Generation Web Worker
 * Offloads PDF generation to a separate thread to prevent UI blocking
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFGenerationMessage {
  type: 'generate';
  payload: {
    html: string;
    filename: string;
    options?: {
      format?: 'a4' | 'letter';
      orientation?: 'portrait' | 'landscape';
      margin?: number;
    };
  };
}

export interface PDFProgressMessage {
  type: 'progress';
  payload: {
    stage: 'rendering' | 'converting' | 'finalizing';
    percentage: number;
  };
}

export interface PDFSuccessMessage {
  type: 'success';
  payload: {
    blob: Blob;
    filename: string;
  };
}

export interface PDFErrorMessage {
  type: 'error';
  payload: {
    message: string;
    error?: string;
  };
}

type PDFWorkerMessage = PDFProgressMessage | PDFSuccessMessage | PDFErrorMessage;

// Web Worker message handler
self.onmessage = async (event: MessageEvent<PDFGenerationMessage>) => {
  const { type, payload } = event.data;

  if (type !== 'generate') {
    postMessage({
      type: 'error',
      payload: { message: 'Invalid message type' },
    } as PDFErrorMessage);
    return;
  }

  try {
    const { html, filename, options = {} } = payload;

    // Stage 1: Rendering HTML to canvas
    postMessage({
      type: 'progress',
      payload: { stage: 'rendering', percentage: 10 },
    } as PDFProgressMessage);

    // Create temporary div for rendering
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    document.body.appendChild(tempDiv);

    postMessage({
      type: 'progress',
      payload: { stage: 'rendering', percentage: 30 },
    } as PDFProgressMessage);

    // Convert to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Remove temp div
    document.body.removeChild(tempDiv);

    postMessage({
      type: 'progress',
      payload: { stage: 'converting', percentage: 60 },
    } as PDFProgressMessage);

    // Stage 2: Converting canvas to PDF
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = options.format === 'letter' ? 215.9 : 210; // mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: options.format || 'a4',
    });

    const margin = options.margin || 10;
    const pageHeight = options.format === 'letter' ? 279.4 : 297; // mm
    const pageWidth = imgWidth;

    let heightLeft = imgHeight;
    let position = margin;

    // Add first page
    pdf.addImage(imgData, 'PNG', margin, position, pageWidth - 2 * margin, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, pageWidth - 2 * margin, imgHeight);
      heightLeft -= pageHeight;
    }

    postMessage({
      type: 'progress',
      payload: { stage: 'finalizing', percentage: 90 },
    } as PDFProgressMessage);

    // Stage 3: Create blob
    const pdfBlob = pdf.output('blob');

    postMessage({
      type: 'success',
      payload: {
        blob: pdfBlob,
        filename,
      },
    } as PDFSuccessMessage);
  } catch (error) {
    postMessage({
      type: 'error',
      payload: {
        message: 'PDF generation failed',
        error: error instanceof Error ? error.message : String(error),
      },
    } as PDFErrorMessage);
  }
};

// Export type for TypeScript support
export type {};
