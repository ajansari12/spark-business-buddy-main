/**
 * PDF Worker Hook
 * Uses Web Worker for non-blocking PDF generation
 */

import { useState, useCallback, useRef } from 'react';
import type {
  PDFGenerationMessage,
  PDFProgressMessage,
  PDFSuccessMessage,
  PDFErrorMessage,
} from '@/workers/pdfWorker';

interface PDFGenerationOptions {
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  margin?: number;
}

interface PDFGenerationState {
  isGenerating: boolean;
  progress: number;
  stage: 'idle' | 'rendering' | 'converting' | 'finalizing';
  error: string | null;
}

interface UsePDFWorkerReturn {
  generatePDF: (html: string, filename: string, options?: PDFGenerationOptions) => Promise<Blob>;
  state: PDFGenerationState;
  cancelGeneration: () => void;
}

/**
 * Hook for generating PDFs using Web Worker
 * Prevents UI blocking during PDF generation
 *
 * @example
 * const { generatePDF, state } = usePDFWorker();
 *
 * const handleExport = async () => {
 *   try {
 *     const blob = await generatePDF(htmlContent, 'report.pdf');
 *     // Download or upload blob
 *   } catch (error) {
 *     console.error('PDF generation failed:', error);
 *   }
 * };
 */
export function usePDFWorker(): UsePDFWorkerReturn {
  const [state, setState] = useState<PDFGenerationState>({
    isGenerating: false,
    progress: 0,
    stage: 'idle',
    error: null,
  });

  const workerRef = useRef<Worker | null>(null);
  const resolveRef = useRef<((blob: Blob) => void) | null>(null);
  const rejectRef = useRef<((error: Error) => void) | null>(null);

  const cancelGeneration = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    if (rejectRef.current) {
      rejectRef.current(new Error('PDF generation cancelled'));
    }

    setState({
      isGenerating: false,
      progress: 0,
      stage: 'idle',
      error: null,
    });
  }, []);

  const generatePDF = useCallback(
    (html: string, filename: string, options?: PDFGenerationOptions): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        // Clean up existing worker
        if (workerRef.current) {
          workerRef.current.terminate();
        }

        // Store resolve/reject for later use
        resolveRef.current = resolve;
        rejectRef.current = reject;

        // Reset state
        setState({
          isGenerating: true,
          progress: 0,
          stage: 'idle',
          error: null,
        });

        try {
          // Create new worker
          // Note: Vite handles worker imports differently
          const worker = new Worker(new URL('../workers/pdfWorker.ts', import.meta.url), {
            type: 'module',
          });

          workerRef.current = worker;

          // Handle messages from worker
          worker.onmessage = (
            event: MessageEvent<PDFProgressMessage | PDFSuccessMessage | PDFErrorMessage>
          ) => {
            const { type, payload } = event.data;

            switch (type) {
              case 'progress': {
                const progressPayload = payload as PDFProgressMessage['payload'];
                setState((prev) => ({
                  ...prev,
                  progress: progressPayload.percentage,
                  stage: progressPayload.stage,
                }));
                break;
              }

              case 'success': {
                const successPayload = payload as PDFSuccessMessage['payload'];
                setState({
                  isGenerating: false,
                  progress: 100,
                  stage: 'idle',
                  error: null,
                });

                if (resolveRef.current) {
                  resolveRef.current(successPayload.blob);
                }

                // Clean up worker
                worker.terminate();
                workerRef.current = null;
                break;
              }

              case 'error': {
                const errorPayload = payload as PDFErrorMessage['payload'];
                const errorMessage = errorPayload.error || errorPayload.message;

                setState({
                  isGenerating: false,
                  progress: 0,
                  stage: 'idle',
                  error: errorMessage,
                });

                if (rejectRef.current) {
                  rejectRef.current(new Error(errorMessage));
                }

                // Clean up worker
                worker.terminate();
                workerRef.current = null;
                break;
              }
            }
          };

          // Handle worker errors
          worker.onerror = (error) => {
            setState({
              isGenerating: false,
              progress: 0,
              stage: 'idle',
              error: error.message || 'Worker error occurred',
            });

            if (rejectRef.current) {
              rejectRef.current(new Error(error.message || 'Worker error occurred'));
            }

            worker.terminate();
            workerRef.current = null;
          };

          // Send generation request to worker
          const message: PDFGenerationMessage = {
            type: 'generate',
            payload: {
              html,
              filename,
              options,
            },
          };

          worker.postMessage(message);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create worker';

          setState({
            isGenerating: false,
            progress: 0,
            stage: 'idle',
            error: errorMessage,
          });

          reject(new Error(errorMessage));
        }
      });
    },
    []
  );

  return {
    generatePDF,
    state,
    cancelGeneration,
  };
}

/**
 * Helper function to download a PDF blob
 */
export function downloadPDFBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
