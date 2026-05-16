export type CareersGalleryImage = {
  id: string
  imageUrl: string
  alt: string
  status: 0 | 1
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export type CareersGalleryFormPayload = {
  alt: string
  status: 0 | 1
  displayOrder: number
  imageDataUrl: string // empty on update means "keep existing"
}

export const MAX_GALLERY_IMAGES = 20
export const MAX_ALT_LENGTH = 200
export const MAX_GALLERY_IMAGE_SIZE = 3 * 1024 * 1024
export const GALLERY_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]

// Recommended landscape 1200x800 (3:2) — matches the marquee proportions on the public site.
export const GALLERY_IMAGE_SPEC = {
  label: 'Gallery image',
  width: 1200,
  height: 800,
}
