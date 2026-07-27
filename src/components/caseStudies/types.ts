import type { BlogContentBlock } from '../blog/types'

// Cover image must use a 502×303 landscape orientation to match the public case
// study hero, mirroring the blog cover spec. validateImageDimensions enforces this
// aspect ratio (±3%) and a minimum size of 502×303. Inline content images are unconstrained.
export const CASE_STUDY_COVER_IMAGE_SPEC = {
  label: 'Cover image',
  width: 502,
  height: 303,
}

export type CaseStudy = {
  id: string
  status: 0 | 1
  isPopular: boolean
  title: string
  slug: string
  excerpt: string
  coverImageUrl: string
  thumbnailTopic: string
  thumbnailDescription: string
  thumbnailContent: string[]
  authorName: string
  authorRole: string
  readTimeMinutes: number
  tags: string[]
  sections: BlogContentBlock[]
  createdAt: string
  updatedAt: string
}
