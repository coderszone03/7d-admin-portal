import client from './client'
import { getCookie } from '../utils/cookies'
import { AUTH_COOKIE_KEY } from '../../features/auth/constants'
import type {
  BlogContentBlock,
  BlogContentBlockType,
  BlogPost,
} from '../../components/blog/types'

const getAuthHeader = (): Record<string, string> => {
  const raw = getCookie(AUTH_COOKIE_KEY)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as { token?: string }
    if (parsed.token) {
      return { Authorization: `Bearer ${parsed.token}` }
    }
  } catch {
    // ignore malformed cookie
  }
  return {}
}

export type BlogCategory = {
  id: string
  name: string
  slug?: string
  status?: '0' | '1'
  createdAt?: string
  updatedAt?: string
}

export type BlogCategoryMutationPayload = {
  name: string
  status: '0' | '1'
}

export type FetchBlogPostsParams = {
  page: number
  pageSize: number
  categoryId?: string | null
  search?: string
}

export type FetchBlogPostsResult = {
  items: BlogPost[]
  total: number
}

const BACKEND_ORIGIN = 'https://7ddesign-backend.maverickz.online'

const BLOG_CATEGORIES_ENDPOINT = '/api/admin/blog_categories'
const BLOG_CATEGORY_ITEM_ENDPOINT = '/api/admin/blog_category'
const BLOG_CATEGORY_CREATE_ENDPOINT = '/api/admin/blog_category/create'
const BLOG_CATEGORY_UPDATE_ENDPOINT = '/api/admin/blog_category/update'
const BLOG_CATEGORY_SEARCH_ENDPOINT = '/api/admin/blog_category/search'
const BLOGS_LIST_ENDPOINT = '/api/admin/blogs'
const BLOG_ITEM_ENDPOINT = '/api/admin/blog'
const BLOG_CREATE_ENDPOINT = '/api/admin/blog/create'
const BLOG_UPDATE_ENDPOINT = '/api/admin/blog/update'

// In dev, rewrite absolute backend URLs to relative paths so Vite's proxy handles them.
const toProxiedUrl = (url: string): string => {
  if (!url) return url
  if (import.meta.env.DEV && url.startsWith(BACKEND_ORIGIN)) {
    return url.slice(BACKEND_ORIGIN.length)
  }
  return url
}

const toStringOrEmpty = (v: unknown): string => (v === null || v === undefined ? '' : String(v))

const extractList = (body: unknown): unknown[] => {
  if (Array.isArray(body)) return body
  const b = body as any
  if (Array.isArray(b?.data)) return b.data
  if (Array.isArray(b?.items)) return b.items
  if (Array.isArray(b?.posts)) return b.posts
  if (Array.isArray(b?.blogs)) return b.blogs
  if (Array.isArray(b?.data?.items)) return b.data.items
  if (Array.isArray(b?.data?.blogs)) return b.data.blogs
  return []
}

const extractSingle = (body: unknown): unknown => {
  if (!body || typeof body !== 'object') return body
  const b = body as any
  if (b.data && typeof b.data === 'object' && !Array.isArray(b.data)) return b.data
  if (b.blog && typeof b.blog === 'object') return b.blog
  if (b.post && typeof b.post === 'object') return b.post
  return b
}

const extractTotal = (body: unknown, fallback: number): number => {
  const b = body as any
  const raw = b?.total ?? b?.total_page ?? b?.meta?.total ?? fallback
  if (typeof raw === 'number') return raw
  if (typeof raw === 'string') {
    const parsed = Number.parseInt(raw, 10)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

const coerceKeywords = (raw: unknown): string[] => {
  if (Array.isArray(raw)) {
    return raw.map((k) => String(k)).filter((k) => k.trim().length > 0)
  }
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
  }
  return []
}

const splitAuthor = (raw: string): { authorName: string; authorRole: string } => {
  const value = raw.trim()
  if (!value) return { authorName: '', authorRole: '' }
  const separators = ['—', ' - ', '|']
  for (const sep of separators) {
    const idx = value.indexOf(sep)
    if (idx > -1) {
      return {
        authorName: value.slice(0, idx).trim(),
        authorRole: value.slice(idx + sep.length).trim(),
      }
    }
  }
  return { authorName: value, authorRole: '' }
}

const joinAuthor = (name: string, role: string): string => {
  const trimmedName = name.trim()
  const trimmedRole = role.trim()
  if (!trimmedRole) return trimmedName
  return `${trimmedName} — ${trimmedRole}`
}

const apiTypeToUiType = (apiType: string): BlogContentBlockType => {
  if (apiType === 'heading') return 'heading'
  if (apiType === 'image') return 'image'
  // The API only knows `description`; we map it back to `paragraph` in the UI.
  // Lists saved from the UI come back as paragraphs with embedded list HTML — still renders correctly.
  return 'paragraph'
}

const normaliseBlock = (raw: unknown, fallbackIndex: number): BlogContentBlock | null => {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Record<string, any>
  const typeRaw = String(v.type ?? 'description')
  const type = apiTypeToUiType(typeRaw)
  const content = toStringOrEmpty(v.content)
  const id = String(v.id ?? `block-${fallbackIndex + 1}`)

  if (type === 'heading') {
    return { id, type, heading: content }
  }
  if (type === 'image') {
    return { id, type, imageUrl: content, alt: toStringOrEmpty(v.alt) }
  }
  // paragraph
  return { id, type, text: content }
}

const normaliseBlogPost = (raw: unknown, fallbackId: string): BlogPost | null => {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Record<string, any>

  const idSource = v.id ?? v.blog_id ?? v._id ?? fallbackId
  const id = String(idSource)

  const categoryIdRaw =
    v.blog_category_id ??
    v.categoryId ??
    v.category_id ??
    (v.blog_category && typeof v.blog_category === 'object'
      ? (v.blog_category as any).id
      : undefined)
  const categoryId = toStringOrEmpty(categoryIdRaw)
  const title = toStringOrEmpty(v.title)
  const slug =
    toStringOrEmpty(v.slug) ||
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

  const excerpt = toStringOrEmpty(v.short_description ?? v.shortDescription ?? v.excerpt)

  const coverImageUrl = toStringOrEmpty(
    v.thumbnail ??
      v.thumbnail_preview ??
      v.thumbnail_url ??
      v.thumbnail_file ??
      v.coverImageUrl ??
      v.cover_image,
  )

  const authorRaw = toStringOrEmpty(v.author ?? v.author_name ?? v.authorName)
  const { authorName, authorRole } = splitAuthor(authorRaw)

  const statusRaw = v.status
  const status: 0 | 1 = statusRaw === 1 || statusRaw === '1' || statusRaw === true ? 1 : 0

  const tags = coerceKeywords(v.keywords ?? v.tags)

  const inputsRaw = Array.isArray(v.blog_inputs)
    ? (v.blog_inputs as unknown[])
    : Array.isArray(v.inputs)
      ? (v.inputs as unknown[])
      : Array.isArray(v.sections)
        ? (v.sections as unknown[])
        : []
  const sections = inputsRaw
    .map((item, index) => normaliseBlock(item, index))
    .filter((block): block is BlogContentBlock => Boolean(block))

  const readTimeRaw = v.read_time_minutes ?? v.readTimeMinutes ?? v.read_time
  const readTimeNumber =
    typeof readTimeRaw === 'number'
      ? readTimeRaw
      : typeof readTimeRaw === 'string'
        ? Number.parseInt(readTimeRaw, 10)
        : 0
  const readTimeMinutes = Number.isFinite(readTimeNumber) && readTimeNumber > 0 ? readTimeNumber : 2

  const createdAt = toStringOrEmpty(v.created_at ?? v.createdAt) || new Date().toISOString()
  const updatedAt = toStringOrEmpty(v.updated_at ?? v.updatedAt) || createdAt

  return {
    id,
    categoryId,
    status,
    title,
    slug,
    excerpt,
    coverImageUrl,
    authorName,
    authorRole,
    readTimeMinutes,
    tags,
    sections,
    createdAt,
    updatedAt,
  }
}

const urlToBase64 = async (url: string): Promise<string | null> => {
  if (!url) return null
  try {
    const res = await fetch(toProxiedUrl(url))
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read blob'))
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// Converts a cover preview (data URL or http URL) to base64 data URL for API upload.
const coverToBase64 = async (preview: string): Promise<string> => {
  if (!preview) return ''
  if (preview.startsWith('data:')) return preview
  const base64 = await urlToBase64(preview)
  return base64 ?? ''
}

// Converts a block's image URL (for image-type blocks) to base64 if it's an http URL,
// otherwise returns it as-is.
const imageBlockToBase64 = async (imageUrl: string): Promise<string> => {
  if (!imageUrl) return ''
  if (imageUrl.startsWith('data:')) return imageUrl
  const base64 = await urlToBase64(imageUrl)
  return base64 ?? imageUrl
}

type ApiInputBlock = {
  type: 'heading' | 'description' | 'image'
  content: string
  order: number
}

const buildApiInputs = async (sections: BlogContentBlock[]): Promise<ApiInputBlock[]> => {
  const result: ApiInputBlock[] = []
  for (let i = 0; i < sections.length; i += 1) {
    const block = sections[i]
    const order = i + 1
    if (block.type === 'heading') {
      result.push({ type: 'heading', content: block.heading?.trim() ?? '', order })
    } else if (block.type === 'image') {
      const encoded = await imageBlockToBase64(block.imageUrl ?? '')
      result.push({ type: 'image', content: encoded, order })
    } else {
      // paragraph and list both → description (HTML content is preserved either way)
      result.push({ type: 'description', content: block.text ?? '', order })
    }
  }
  return result
}

type BlogMutationPayload = {
  blog_category_id: number
  title: string
  slug: string
  short_description: string
  thumbnail_file?: string
  inputs: ApiInputBlock[]
  keywords: string[]
  author: string
  status: 0 | 1
}

const buildPayload = async (
  post: BlogPost,
  includeThumbnailOnEmpty: boolean,
): Promise<BlogMutationPayload> => {
  const inputs = await buildApiInputs(post.sections)
  const thumbnail = await coverToBase64(post.coverImageUrl)
  const categoryIdNum = Number.parseInt(post.categoryId, 10)

  const payload: BlogMutationPayload = {
    blog_category_id: Number.isFinite(categoryIdNum) ? categoryIdNum : 0,
    title: post.title.trim(),
    slug: post.slug.trim(),
    short_description: post.excerpt.trim(),
    inputs,
    keywords: post.tags.map((t) => t.trim()).filter(Boolean),
    author: joinAuthor(post.authorName, post.authorRole),
    status: post.status,
  }
  if (thumbnail || includeThumbnailOnEmpty) {
    payload.thumbnail_file = thumbnail
  }
  return payload
}

const normaliseCategory = (raw: unknown, index: number): BlogCategory | null => {
  if (!raw || typeof raw !== 'object') return null
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

  const rawStatus = value.status
  const status: '0' | '1' | undefined =
    rawStatus === 1 || rawStatus === '1' || rawStatus === true
      ? '1'
      : rawStatus === 0 || rawStatus === '0' || rawStatus === false
        ? '0'
        : undefined

  const createdAt =
    typeof value.created_at === 'string'
      ? value.created_at
      : typeof value.createdAt === 'string'
        ? value.createdAt
        : undefined
  const updatedAt =
    typeof value.updated_at === 'string'
      ? value.updated_at
      : typeof value.updatedAt === 'string'
        ? value.updatedAt
        : undefined

  return { id, name, slug, status, createdAt, updatedAt }
}

export const fetchBlogCategories = async (perPage = 50): Promise<BlogCategory[]> => {
  const response = await client.get(BLOG_CATEGORIES_ENDPOINT, {
    params: { per_page: perPage },
    headers: { ...getAuthHeader() },
  })
  const list = extractList(response.data)
  return list
    .map((item, index) => normaliseCategory(item, index))
    .filter((item): item is BlogCategory => Boolean(item))
}

export const fetchBlogCategoryById = async (id: string): Promise<BlogCategory | null> => {
  const response = await client.get(
    `${BLOG_CATEGORY_ITEM_ENDPOINT}/${encodeURIComponent(id)}`,
    { headers: { ...getAuthHeader() } },
  )
  const raw = extractSingle(response.data)
  return normaliseCategory(raw, 0)
}

export const searchBlogCategories = async (search: string): Promise<BlogCategory[]> => {
  const response = await client.get(BLOG_CATEGORY_SEARCH_ENDPOINT, {
    params: { search },
    headers: { ...getAuthHeader() },
  })
  const list = extractList(response.data)
  return list
    .map((item, index) => normaliseCategory(item, index))
    .filter((item): item is BlogCategory => Boolean(item))
}

export const createBlogCategory = async (
  payload: BlogCategoryMutationPayload,
): Promise<void> => {
  await client.post(BLOG_CATEGORY_CREATE_ENDPOINT, payload, {
    headers: { ...getAuthHeader() },
  })
}

export const updateBlogCategory = async (
  id: string,
  payload: BlogCategoryMutationPayload,
): Promise<void> => {
  const body = { id: Number.parseInt(id, 10), ...payload }
  await client.post(BLOG_CATEGORY_UPDATE_ENDPOINT, body, {
    headers: { ...getAuthHeader() },
  })
}

export const deleteBlogCategory = async (id: string): Promise<void> => {
  await client.delete(`${BLOG_CATEGORY_ITEM_ENDPOINT}/${encodeURIComponent(id)}`, {
    headers: { ...getAuthHeader() },
  })
}

export const fetchBlogPosts = async (
  params: FetchBlogPostsParams,
): Promise<FetchBlogPostsResult> => {
  const query: Record<string, unknown> = {
    per_page: params.pageSize,
    page: params.page,
  }
  if (params.search && params.search.trim()) {
    query.search = params.search.trim()
  }

  const response = await client.get(BLOGS_LIST_ENDPOINT, {
    params: query,
    headers: { ...getAuthHeader() },
  })
  const body = response.data
  const list = extractList(body)

  let items = list
    .map((item, index) => normaliseBlogPost(item, `blog-${params.page}-${index + 1}`))
    .filter((item): item is BlogPost => Boolean(item))

  // API doesn't appear to support server-side category filtering — do it client-side.
  if (params.categoryId && params.categoryId !== 'all') {
    items = items.filter((post) => post.categoryId === params.categoryId)
  }

  const total = extractTotal(body, items.length)
  return { items, total }
}

export const fetchBlogPostById = async (id: string): Promise<BlogPost | null> => {
  const response = await client.get(`${BLOG_ITEM_ENDPOINT}/${encodeURIComponent(id)}`, {
    headers: { ...getAuthHeader() },
  })
  const raw = extractSingle(response.data)
  return normaliseBlogPost(raw, id)
}

export const createBlogPost = async (post: BlogPost): Promise<BlogPost | null> => {
  const body = await buildPayload(post, false)
  const response = await client.post(BLOG_CREATE_ENDPOINT, body, {
    headers: { ...getAuthHeader() },
  })
  const raw = extractSingle(response.data)
  return normaliseBlogPost(raw, `blog-${Date.now()}`)
}

export const updateBlogPost = async (id: string, post: BlogPost): Promise<BlogPost | null> => {
  const body = { id: Number.parseInt(id, 10), ...(await buildPayload(post, false)) }
  const response = await client.post(BLOG_UPDATE_ENDPOINT, body, {
    headers: { ...getAuthHeader() },
  })
  const raw = extractSingle(response.data)
  return normaliseBlogPost(raw, id)
}

export const deleteBlogPost = async (id: string): Promise<void> => {
  await client.delete(`${BLOG_ITEM_ENDPOINT}/${encodeURIComponent(id)}`, {
    headers: { ...getAuthHeader() },
  })
}
