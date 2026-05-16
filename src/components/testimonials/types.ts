import type { ProjectCategoryValue } from '../portfolio/projects/types'

export type Testimonial = {
  id: string
  name: string
  role: string
  category: ProjectCategoryValue
  quote: string
  photoUrl: string
  status: 0 | 1
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export type TestimonialFormValues = {
  name: string
  role: string
  category: ProjectCategoryValue | ''
  quote: string
  photoFile: File | null
  photoPreview: string | null
  status: 0 | 1
  displayOrder: number
}

export type TestimonialFormPayload = {
  name: string
  role: string
  category: ProjectCategoryValue
  quote: string
  photoDataUrl: string
  status: 0 | 1
  displayOrder: number
}

export const MAX_QUOTE_LENGTH = 1000
export const MAX_NAME_LENGTH = 100
export const MAX_ROLE_LENGTH = 120
export const MAX_PHOTO_SIZE = 2 * 1024 * 1024
export const PHOTO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']

// Square photo, recommended 600x600 — matches the homepage deck circular profile slot.
export const TESTIMONIAL_PHOTO_SPEC = {
  label: 'Testimonial photo',
  width: 600,
  height: 600,
}
