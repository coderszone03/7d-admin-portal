// Testimonial categories are free-form, admin-defined strings — not a fixed enum.
// Admins can pick from the defaults below or add their own in the builder.
export type TestimonialCategory = string

export type Testimonial = {
  id: string
  name: string
  role: string
  category: TestimonialCategory
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
  category: TestimonialCategory
  quote: string
  photoFile: File | null
  photoPreview: string | null
  status: 0 | 1
  displayOrder: number
}

export type TestimonialFormPayload = {
  name: string
  role: string
  category: TestimonialCategory
  quote: string
  photoDataUrl: string
  status: 0 | 1
  displayOrder: number
}

export const MAX_QUOTE_LENGTH = 1000
export const MAX_NAME_LENGTH = 100
export const MAX_ROLE_LENGTH = 120
export const MAX_CATEGORY_LENGTH = 40
export const MAX_PHOTO_SIZE = 2 * 1024 * 1024
export const PHOTO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']

// Suggested categories shown by default in the builder. This list is just a starting
// point — admins can add new categories as needed, so it is not exhaustive.
export const DEFAULT_TESTIMONIAL_CATEGORIES = [
  'Branding',
  'Influencer Marketing',
  'Video Production',
  'UI/UX',
  'Performance Marketing',
]

// Merge the defaults with any categories already used by existing testimonials,
// de-duplicated case-insensitively while preserving the first-seen label/order.
export const mergeTestimonialCategories = (
  ...groups: Array<Iterable<string>>
): string[] => {
  const seen = new Map<string, string>()
  for (const group of groups) {
    for (const raw of group) {
      const label = raw.trim()
      if (!label) continue
      const key = label.toLowerCase()
      if (!seen.has(key)) seen.set(key, label)
    }
  }
  return [...seen.values()]
}

// Square photo, recommended 600x600 — matches the homepage deck circular profile slot.
export const TESTIMONIAL_PHOTO_SPEC = {
  label: 'Testimonial photo',
  width: 600,
  height: 600,
}
