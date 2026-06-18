// Cover image must use a 502×303 landscape orientation to match the public blog
// detail hero. validateImageDimensions enforces this aspect ratio (±3%) and a
// minimum size of 502×303. Inline content images are unconstrained.
export const BLOG_COVER_IMAGE_SPEC = {
  label: 'Cover image',
  width: 502,
  height: 303,
}

export type BlogContentBlockType = 'heading' | 'paragraph' | 'list' | 'image'

export type BlogContentBlock = {
  id: string
  type: BlogContentBlockType
  /**
   * For list blocks, controls whether the list is rendered as
   * an ordered list (numbered) or an unordered list (bulleted).
   * Ignored for other block types.
   */
  ordered?: boolean
  heading?: string
  text?: string
  imageUrl?: string
  alt?: string
}

export type BlogPost = {
  id: string
  categoryId: string
  status: 0 | 1
  isPopular: boolean
  title: string
  slug: string
  excerpt: string
  coverImageUrl: string
  authorName: string
  authorRole: string
  readTimeMinutes: number
  tags: string[]
  sections: BlogContentBlock[]
  createdAt: string
  updatedAt: string
}
