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
