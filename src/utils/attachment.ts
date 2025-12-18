import type {
  DocumentAttachmentPayload,
  ImageAttachmentPayload,
  PreparedAttachment,
} from '@/types/chat'

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_IMAGE_DIMENSION = 1200
const TARGET_IMAGE_QUALITY = 0.8
const MAX_COMPRESSED_IMAGE_SIZE = 2 * 1024 * 1024 // 2MB

const IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
])

export type AttachmentKind = 'image' | 'document'

export type AttachmentErrorCode =
  | 'size-limit'
  | 'unsupported-type'
  | 'processing-error'
  | 'empty-text'
  | 'unknown'

export class AttachmentError extends Error {
  readonly code: AttachmentErrorCode

  constructor(message: string, code: AttachmentErrorCode) {
    super(message)
    this.name = 'AttachmentError'
    this.code = code
  }
}

async function detectMimeType(file: File): Promise<string | undefined> {
  if (file.type) {
    return file.type
  }

  try {
    const arrayBuffer = await file.slice(0, 4100).arrayBuffer()
    const { fileTypeFromBuffer } = await import('file-type')
    const detected = await fileTypeFromBuffer(arrayBuffer)
    return detected?.mime
  } catch (error) {
    console.warn('Unable to detect MIME type from file buffer', error)
    return undefined
  }
}

async function compressImageIfNeeded(file: File, mimeType: string): Promise<Blob> {
  const shouldCompress =
    file.size > MAX_COMPRESSED_IMAGE_SIZE ||
    file.type === 'image/png' ||
    file.type === 'image/heic' ||
    file.type === 'image/heif'

  if (!shouldCompress) {
    return file
  }

  const Compressor = (await import('compressorjs')).default

  return new Promise<Blob>((resolve, reject) => {
    // eslint-disable-next-line no-new
    new Compressor(file, {
      quality: TARGET_IMAGE_QUALITY,
      maxWidth: MAX_IMAGE_DIMENSION,
      maxHeight: MAX_IMAGE_DIMENSION,
      convertTypes: ['image/png'],
      convertSize: 0,
      mimeType: mimeType === 'image/png' ? 'image/png' : 'image/jpeg',
      success(result) {
        resolve(result)
      },
      error(error) {
        reject(error)
      },
    })
  })
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '')
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function extractPdfText(arrayBuffer: ArrayBuffer): Promise<string> {
  const pdfjsLib = await import(/* @vite-ignore */ 'pdfjs-dist/legacy/build/pdf.js')
  if (typeof pdfjsLib.GlobalWorkerOptions !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      pdfjsLib.GlobalWorkerOptions.workerSrc ||
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  }

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const doc = await loadingTask.promise
  let fullText = ''

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .filter(Boolean)
      .join(' ')
    if (pageText.trim().length) {
      fullText += `${pageText}\n\n`
    }
  }

  await doc.cleanup()
  return fullText.trim()
}

async function extractDocxText(arrayBuffer: ArrayBuffer): Promise<string> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value.trim()
}

function buildSnippet(text: string): string {
  if (!text.length) {
    return ''
  }
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= 180) {
    return normalized
  }
  return `${normalized.slice(0, 177).trim()}…`
}

export async function prepareImageAttachment(file: File): Promise<ImageAttachmentPayload> {
  const mimeType = (await detectMimeType(file)) ?? file.type
  if (!mimeType || !IMAGE_MIME_TYPES.has(mimeType)) {
    throw new AttachmentError('Unsupported image format.', 'unsupported-type')
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new AttachmentError('File exceeds 10MB size limit.', 'size-limit')
  }

  const compressedBlob = await compressImageIfNeeded(file, mimeType)
  const dataUrl = await blobToDataUrl(compressedBlob)

  const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
    const image = new Image()
    image.onload = () => {
      resolve({ width: image.width, height: image.height })
    }
    image.src = dataUrl
  })

  return {
    type: 'image',
    name: file.name,
    mimeType,
    size: compressedBlob.size,
    dataUrl,
    width: dimensions.width,
    height: dimensions.height,
  }
}

export async function prepareDocumentAttachment(file: File): Promise<DocumentAttachmentPayload> {
  const mimeType = (await detectMimeType(file)) ?? file.type
  if (!mimeType || !DOCUMENT_MIME_TYPES.has(mimeType)) {
    throw new AttachmentError('Unsupported document type.', 'unsupported-type')
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new AttachmentError('File exceeds 10MB size limit.', 'size-limit')
  }

  const arrayBuffer = await file.arrayBuffer()

  let extractedText = ''

  try {
    if (mimeType === 'application/pdf') {
      extractedText = await extractPdfText(arrayBuffer)
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      extractedText = await extractDocxText(arrayBuffer)
    } else if (mimeType === 'text/plain') {
      extractedText = new TextDecoder('utf-8').decode(arrayBuffer).trim()
    } else {
      throw new AttachmentError('Unsupported document type.', 'unsupported-type')
    }
  } catch (error) {
    console.error('Failed to extract document text', error)
    throw new AttachmentError('Could not extract text from the document.', 'processing-error')
  }

  const normalized = extractedText.replace(/\s+/g, ' ').trim()
  if (!normalized.length) {
    throw new AttachmentError('Extracted document text was empty.', 'empty-text')
  }

  return {
    type: 'document',
    name: file.name,
    mimeType,
    size: file.size,
    extractedText: normalized,
    snippet: buildSnippet(normalized),
  }
}

export async function prepareAttachment(file: File): Promise<PreparedAttachment> {
  const mimeType = (await detectMimeType(file)) ?? file.type
  if (!mimeType) {
    throw new AttachmentError('Unknown file type.', 'unsupported-type')
  }

  if (IMAGE_MIME_TYPES.has(mimeType)) {
    return prepareImageAttachment(file)
  }

  if (DOCUMENT_MIME_TYPES.has(mimeType)) {
    return prepareDocumentAttachment(file)
  }

  throw new AttachmentError('Unsupported file type.', 'unsupported-type')
}
