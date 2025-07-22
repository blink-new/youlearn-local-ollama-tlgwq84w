import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker with multiple fallback options
const initializePDFWorker = () => {
  try {
    // Try to use the local worker from node_modules first (most reliable)
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.js',
      import.meta.url
    ).toString()
  } catch (error) {
    console.warn('Failed to load local PDF worker, trying CDN fallbacks...')
    
    // Fallback to CDN options
    const cdnOptions = [
      `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`,
      `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`,
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
    ]
    
    // Use the first CDN option as fallback
    pdfjsLib.GlobalWorkerOptions.workerSrc = cdnOptions[0]
  }
}

// Initialize the worker
initializePDFWorker()

export interface PDFProcessingOptions {
  onProgress?: (progress: number) => void
  maxPages?: number
  timeout?: number
}

export interface PDFProcessingResult {
  text: string
  pageCount: number
  title?: string
  metadata?: any
}

export class PDFProcessingError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'PDFProcessingError'
  }
}

export const isPDFProcessingAvailable = (): boolean => {
  try {
    // Check if PDF.js is available and worker is configured
    return !!(pdfjsLib && pdfjsLib.GlobalWorkerOptions.workerSrc)
  } catch (error) {
    return false
  }
}

export const processPDFFile = async (
  file: File,
  options: PDFProcessingOptions = {}
): Promise<PDFProcessingResult> => {
  const { onProgress, maxPages = 100, timeout = 60000 } = options

  if (!isPDFProcessingAvailable()) {
    throw new PDFProcessingError('PDF processing is not available', 'UNAVAILABLE')
  }

  if (file.type !== 'application/pdf') {
    throw new PDFProcessingError('File is not a PDF', 'INVALID_TYPE')
  }

  if (file.size > 50 * 1024 * 1024) { // 50MB limit
    throw new PDFProcessingError('PDF file is too large (max 50MB)', 'FILE_TOO_LARGE')
  }

  onProgress?.(5)

  try {
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new PDFProcessingError('PDF processing timed out', 'TIMEOUT')), timeout)
    })

    // Process the PDF
    const processingPromise = (async () => {
      const arrayBuffer = await file.arrayBuffer()
      onProgress?.(15)

      let pdf: pdfjsLib.PDFDocumentProxy
      try {
        pdf = await pdfjsLib.getDocument({
          data: arrayBuffer,
          useSystemFonts: true,
          disableFontFace: false,
          verbosity: 0 // Reduce console output
        }).promise
      } catch (error: any) {
        if (error.name === 'PasswordException') {
          throw new PDFProcessingError('PDF is password protected', 'PASSWORD_PROTECTED')
        } else if (error.name === 'InvalidPDFException') {
          throw new PDFProcessingError('Invalid or corrupted PDF file', 'INVALID_PDF')
        } else {
          throw new PDFProcessingError(`Failed to load PDF: ${error.message}`, 'LOAD_ERROR')
        }
      }

      onProgress?.(25)

      const numPages = Math.min(pdf.numPages, maxPages)
      let fullText = ''
      const metadata = await pdf.getMetadata().catch(() => null)

      onProgress?.(30)

      // Extract text from each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum)
          const textContent = await page.getTextContent({
            includeMarkedContent: false,
            disableCombineTextItems: false
          })

          // Combine text items with proper spacing
          const pageText = textContent.items
            .filter((item: any) => item.str && item.str.trim())
            .map((item: any) => item.str)
            .join(' ')
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim()

          if (pageText) {
            fullText += pageText + '\n\n'
          }

          // Update progress
          const progress = 30 + ((pageNum / numPages) * 60)
          onProgress?.(progress)

          // Clean up page resources
          page.cleanup()
        } catch (pageError) {
          console.warn(`Failed to process page ${pageNum}:`, pageError)
          // Continue with other pages
        }
      }

      onProgress?.(95)

      // Clean up PDF resources
      pdf.destroy()

      if (!fullText.trim()) {
        throw new PDFProcessingError('No text content found in PDF', 'NO_TEXT')
      }

      onProgress?.(100)

      return {
        text: fullText.trim(),
        pageCount: pdf.numPages,
        title: metadata?.info?.Title || file.name.replace('.pdf', ''),
        metadata: metadata?.info
      }
    })()

    // Race between processing and timeout
    return await Promise.race([processingPromise, timeoutPromise])

  } catch (error) {
    if (error instanceof PDFProcessingError) {
      throw error
    } else if (error instanceof Error) {
      throw new PDFProcessingError(`PDF processing failed: ${error.message}`, 'PROCESSING_ERROR')
    } else {
      throw new PDFProcessingError('Unknown error occurred during PDF processing', 'UNKNOWN_ERROR')
    }
  }
}

export const processPDFFromArrayBuffer = async (
  arrayBuffer: ArrayBuffer,
  filename: string,
  options: PDFProcessingOptions = {}
): Promise<PDFProcessingResult> => {
  // Create a File-like object from ArrayBuffer
  const file = new File([arrayBuffer], filename, { type: 'application/pdf' })
  return processPDFFile(file, options)
}

export const getErrorMessage = (error: PDFProcessingError): string => {
  switch (error.code) {
    case 'UNAVAILABLE':
      return 'PDF processing is currently unavailable. Please try refreshing the page.'
    case 'INVALID_TYPE':
      return 'Please select a valid PDF file.'
    case 'FILE_TOO_LARGE':
      return 'PDF file is too large. Please use a file smaller than 50MB.'
    case 'PASSWORD_PROTECTED':
      return 'This PDF is password protected. Please use an unprotected PDF.'
    case 'INVALID_PDF':
      return 'This PDF file appears to be corrupted or invalid.'
    case 'NO_TEXT':
      return 'No text content was found in this PDF. It might be an image-only PDF.'
    case 'TIMEOUT':
      return 'PDF processing timed out. Please try with a smaller file.'
    case 'LOAD_ERROR':
    case 'PROCESSING_ERROR':
      return `PDF processing failed: ${error.message}`
    default:
      return 'An unexpected error occurred while processing the PDF.'
  }
}

// Utility function to validate PDF file before processing
export const validatePDFFile = (file: File): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: 'No file provided' }
  }

  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'File must be a PDF' }
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' }
  }

  if (file.size > 50 * 1024 * 1024) {
    return { valid: false, error: 'File is too large (max 50MB)' }
  }

  return { valid: true }
}