export type Service = {
  id: string
  title: string
  slug: string
  description: string
  longDescription: string
  imageUrl: string
  status: 0 | 1
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export type ServiceFormValues = {
  title: string
  slug: string
  description: string
  longDescription: string
  imageFile: File | null
  imagePreview: string | null
  status: 0 | 1
  displayOrder: number
}

export type ServiceFormPayload = {
  title: string
  slug: string
  description: string
  longDescription: string
  imageDataUrl: string
  status: 0 | 1
  displayOrder: number
}

export const MAX_TITLE_LENGTH = 80
export const MAX_DESCRIPTION_LENGTH = 200
export const MAX_LONG_DESCRIPTION_LENGTH = 5000
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024
export const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']

// Square image, recommended 600x600 — matches the existing public site grid card.
export const SERVICE_IMAGE_SPEC = {
  label: 'Service image',
  width: 600,
  height: 600,
}

export const slugify = (input: string): string =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
