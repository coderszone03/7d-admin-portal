// The "Case Study highlight" is a singleton block shown on the public blog listing
// page, just above the "Case Studies" button: one image plus a short description.
export type CaseStudyHighlight = {
  imageUrl: string
  description: string
  updatedAt: string
}

export const MAX_CASE_STUDY_DESCRIPTION_LENGTH = 600
export const CASE_STUDY_IMAGE_MAX_SIZE = 2 * 1024 * 1024
export const CASE_STUDY_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]

// Matches the 502×303 landscape orientation used by the blog hero/case-study slot.
// validateImageDimensions enforces this aspect ratio (±3%) and a 502×303 minimum.
export const CASE_STUDY_IMAGE_SPEC = {
  label: 'Case study image',
  width: 502,
  height: 303,
}
