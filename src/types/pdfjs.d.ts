declare module 'pdfjs-dist/legacy/build/pdf.js' {
  import type { PDFDocumentProxy, PDFPageProxy, TextContent } from 'pdfjs-dist'

  export interface PDFJSWorkerOptions {
    workerSrc?: string
  }

  export const GlobalWorkerOptions: PDFJSWorkerOptions

  export function getDocument(data: unknown): {
    promise: Promise<PDFDocumentProxy>
  }

  export type { PDFDocumentProxy, PDFPageProxy, TextContent }
}
