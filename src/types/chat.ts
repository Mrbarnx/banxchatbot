export interface ImageAttachmentPayload {
  type: 'image'
  name: string
  mimeType: string
  size: number
  dataUrl: string
  width?: number
  height?: number
}

export interface DocumentAttachmentPayload {
  type: 'document'
  name: string
  mimeType: string
  size: number
  extractedText: string
  snippet: string
}

export type PreparedAttachment = ImageAttachmentPayload | DocumentAttachmentPayload

export interface UserMessagePayload {
  content: string
  attachment?: PreparedAttachment
}
