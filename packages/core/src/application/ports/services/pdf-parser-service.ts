/**
 * PDFParserService interface (port)
 * Defines the contract for PDF text extraction
 */
export interface PDFParserService {
  /**
   * Extract text content from a PDF file
   */
  extractText(file: File | Blob | ArrayBuffer): Promise<PDFParseResult>
}

export interface PDFParseResult {
  text?: string
  pageCount?: number
  error?: string
}
