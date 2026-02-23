import client from './client'
import type { BlogPost } from '../../components/blog/types'

export type BlogCategory = {
  id: string
  name: string
  slug?: string
}

export type FetchBlogPostsParams = {
  page: number
  pageSize: number
  categoryId?: string | null
}

export type FetchBlogPostsResult = {
  items: BlogPost[]
  total: number
}

const BLOG_CATEGORIES_ENDPOINT =
  import.meta.env.VITE_BLOG_CATEGORIES_ENDPOINT ?? '/admin/blog_categories'

const BLOG_POSTS_ENDPOINT =
  import.meta.env.VITE_BLOG_POSTS_ENDPOINT ?? '/api/admin/blog/posts'

const normaliseCategory = (raw: unknown, index: number): BlogCategory | null => {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const value = raw as Record<string, unknown>
  const idValue =
    value.value ?? value.id ?? value.category_id ?? value.slug ?? String(index + 1)
  const nameValue =
    value.name ?? value.title ?? value.slug ?? `Category ${index + 1}`

  const id = String(idValue)
  const name = String(nameValue)
  const slug =
    typeof value.slug === 'string'
      ? value.slug
      : typeof value.key === 'string'
        ? value.key
        : undefined

  return { id, name, slug }
}

const normaliseBlogPost = (raw: unknown, fallbackId: string): BlogPost | null => {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const value = raw as Record<string, any>

  const idSource = value.id ?? value.post_id ?? fallbackId
  const id = String(idSource)
  const title = String(value.title ?? 'Untitled post')
  const slug = String(
    value.slug ??
      title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
  )
  const excerpt = String(
    value.excerpt ??
      value.summary ??
      (typeof value.content === 'string'
        ? value.content.slice(0, 180)
        : 'No summary available.'),
  )

  const coverImageUrl =
    typeof value.cover_image === 'string'
      ? value.cover_image
      : typeof value.coverImageUrl === 'string'
        ? value.coverImageUrl
        : typeof value.image === 'string'
          ? value.image
          : ''

  const authorName = String(value.author_name ?? value.authorName ?? 'Team 7D Design')
  const authorRole = String(value.author_role ?? value.authorRole ?? 'Content Team')

  const readTimeRaw =
    value.read_time_minutes ?? value.readTimeMinutes ?? value.read_time ?? value.readTime
  const readTimeNumber =
    typeof readTimeRaw === 'number'
      ? readTimeRaw
      : typeof readTimeRaw === 'string'
        ? Number.parseInt(readTimeRaw, 10)
        : 0

  const readTimeMinutes = Number.isFinite(readTimeNumber) && readTimeNumber > 0 ? readTimeNumber : 2

  let tags: string[] = []
  if (Array.isArray(value.tags)) {
    tags = value.tags
      .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
      .filter(Boolean)
  } else if (typeof value.tags === 'string') {
    tags = value.tags
      .split(',')
      .map((tag: string) => tag.trim())
      .filter(Boolean)
  }

  const createdAtValue = value.created_at ?? value.createdAt ?? new Date().toISOString()
  const updatedAtValue = value.updated_at ?? value.updatedAt ?? createdAtValue

  const sectionsRaw = Array.isArray(value.sections) ? (value.sections as unknown[]) : []

  const sections: BlogPost['sections'] =
    sectionsRaw.length && typeof sectionsRaw[0] === 'object'
      ? (sectionsRaw as BlogPost['sections'])
      : [
          {
            id: 'body-1',
            type: 'paragraph',
            text:
              typeof value.content === 'string'
                ? value.content
                : 'Content for this post will appear here.',
          },
        ]

  return {
    id,
    title,
    slug,
    excerpt,
    coverImageUrl,
    authorName,
    authorRole,
    readTimeMinutes,
    tags,
    sections,
    createdAt: String(createdAtValue),
    updatedAt: String(updatedAtValue),
  }
}

export const fetchBlogCategories = async (): Promise<BlogCategory[]> => {
  const response = await client.get(BLOG_CATEGORIES_ENDPOINT)
  const body = response.data

  const list: unknown[] = Array.isArray(body)
    ? body
    : Array.isArray((body as any)?.data)
      ? (body as any).data
      : Array.isArray((body as any)?.items)
        ? (body as any).items
        : []

  return list
    .map((item, index) => normaliseCategory(item, index))
    .filter((item): item is BlogCategory => Boolean(item))
}

export const fetchBlogPosts = async (
  params: FetchBlogPostsParams,
): Promise<FetchBlogPostsResult> => {
  const query: Record<string, unknown> = {
    page: params.page,
    per_page: params.pageSize,
  }

  if (params.categoryId && params.categoryId !== 'all') {
    query.category_id = params.categoryId
  }

  const response = await client.get(BLOG_POSTS_ENDPOINT, { params: query })
  const body = response.data

  const list: unknown[] = Array.isArray(body)
    ? body
    : Array.isArray((body as any)?.data)
      ? (body as any).data
      : Array.isArray((body as any)?.items)
        ? (body as any).items
        : []

  const totalRaw = (body as any)?.total ?? (body as any)?.meta?.total ?? list.length
  const total =
    typeof totalRaw === 'number'
      ? totalRaw
      : typeof totalRaw === 'string'
        ? Number.parseInt(totalRaw, 10) || list.length
        : list.length

  const items = list
    .map((item, index) => normaliseBlogPost(item, `blog-${params.page}-${index + 1}`))
    .filter((item): item is BlogPost => Boolean(item))

  return { items, total }
}
