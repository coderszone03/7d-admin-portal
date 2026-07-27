import client from './client'
import { getCookie } from '../utils/cookies'
import { AUTH_COOKIE_KEY } from '../../features/auth/constants'
import type {
  BlogContentBlock,
  BlogContentBlockType,
} from '../../components/blog/types'
import type { CaseStudy } from '../../components/caseStudies/types'

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

export type FetchCaseStudiesParams = {
  page: number
  pageSize: number
  search?: string
}

export type FetchCaseStudiesResult = {
  items: CaseStudy[]
  total: number
}

const CASE_STUDIES_LIST_ENDPOINT = '/api/admin/case_studies'
const CASE_STUDY_ITEM_ENDPOINT = '/api/admin/case_study'
const CASE_STUDY_CREATE_ENDPOINT = '/api/admin/case_study/create'
const CASE_STUDY_UPDATE_ENDPOINT = '/api/admin/case_study/update'

const toStringOrEmpty = (v: unknown): string => (v === null || v === undefined ? '' : String(v))

const extractList = (body: unknown): unknown[] => {
  if (Array.isArray(body)) return body
  const b = body as any
  if (Array.isArray(b?.data)) return b.data
  if (Array.isArray(b?.items)) return b.items
  if (Array.isArray(b?.case_studies)) return b.case_studies
  if (Array.isArray(b?.data?.items)) return b.data.items
  if (Array.isArray(b?.data?.case_studies)) return b.data.case_studies
  return []
}

const extractSingle = (body: unknown): unknown => {
  if (!body || typeof body !== 'object') return body
  const b = body as any
  if (b.data && typeof b.data === 'object' && !Array.isArray(b.data)) return b.data
  if (b.case_study && typeof b.case_study === 'object') return b.case_study
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
  return { id, type, text: content }
}

const normaliseCaseStudy = (raw: unknown, fallbackId: string): CaseStudy | null => {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Record<string, any>

  const idSource = v.id ?? v.case_study_id ?? v._id ?? fallbackId
  const id = String(idSource)

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

  const thumbnailTopic = toStringOrEmpty(v.thumbnail_topic ?? v.thumbnailTopic)
  const thumbnailDescription = toStringOrEmpty(
    v.thumbnail_description ?? v.thumbnailDescription,
  )
  const thumbnailContent = coerceKeywords(v.thumbnail_content ?? v.thumbnailContent)

  const authorRaw = toStringOrEmpty(v.author ?? v.author_name ?? v.authorName)
  const { authorName, authorRole } = splitAuthor(authorRaw)

  const statusRaw = v.status
  const status: 0 | 1 = statusRaw === 1 || statusRaw === '1' || statusRaw === true ? 1 : 0

  const popularRaw = v.is_popular ?? v.isPopular
  const isPopular = popularRaw === 1 || popularRaw === '1' || popularRaw === true

  const tags = coerceKeywords(v.keywords ?? v.tags)

  const inputsRaw = Array.isArray(v.case_study_inputs)
    ? (v.case_study_inputs as unknown[])
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
    status,
    isPopular,
    title,
    slug,
    excerpt,
    coverImageUrl,
    thumbnailTopic,
    thumbnailDescription,
    thumbnailContent,
    authorName,
    authorRole,
    readTimeMinutes,
    tags,
    sections,
    createdAt,
    updatedAt,
  }
}

// Only freshly uploaded images arrive as `data:` URLs and must be sent as base64.
// Already-hosted URLs are sent unchanged so we never re-inline large images into
// the payload on edit (which previously bloated the body and caused 500s).

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
      // Hosted URLs are sent as-is; only freshly uploaded data: URLs go as base64.
      result.push({ type: 'image', content: block.imageUrl ?? '', order })
    } else {
      result.push({ type: 'description', content: block.text ?? '', order })
    }
  }
  return result
}

type CaseStudyMutationPayload = {
  title: string
  slug: string
  short_description: string
  thumbnail_file?: string
  thumbnail_topic: string
  thumbnail_description: string
  thumbnail_content: string[]
  inputs: ApiInputBlock[]
  keywords: string[]
  author: string
  status: 0 | 1
  is_popular: 0 | 1
}

const buildPayload = async (
  caseStudy: CaseStudy,
  includeThumbnailOnEmpty: boolean,
): Promise<CaseStudyMutationPayload> => {
  const inputs = await buildApiInputs(caseStudy.sections)
  const cover = caseStudy.coverImageUrl ?? ''
  // Send the thumbnail only when it's a new upload (data: URL). A hosted URL means
  // the cover is unchanged, so we omit the field to keep the payload small.
  const thumbnail = cover.startsWith('data:') ? cover : ''

  const payload: CaseStudyMutationPayload = {
    title: caseStudy.title.trim(),
    slug: caseStudy.slug.trim(),
    short_description: caseStudy.excerpt.trim(),
    thumbnail_topic: caseStudy.thumbnailTopic.trim(),
    thumbnail_description: caseStudy.thumbnailDescription.trim(),
    thumbnail_content: caseStudy.thumbnailContent.map((c) => c.trim()).filter(Boolean),
    inputs,
    keywords: caseStudy.tags.map((t) => t.trim()).filter(Boolean),
    author: joinAuthor(caseStudy.authorName, caseStudy.authorRole),
    status: caseStudy.status,
    is_popular: caseStudy.isPopular ? 1 : 0,
  }
  if (thumbnail || includeThumbnailOnEmpty) {
    payload.thumbnail_file = thumbnail
  }
  return payload
}

export const fetchCaseStudies = async (
  params: FetchCaseStudiesParams,
): Promise<FetchCaseStudiesResult> => {
  const query: Record<string, unknown> = {
    per_page: params.pageSize,
    page: params.page,
  }
  if (params.search && params.search.trim()) {
    query.search = params.search.trim()
  }

  const response = await client.get(CASE_STUDIES_LIST_ENDPOINT, {
    params: query,
    headers: { ...getAuthHeader() },
  })
  const body = response.data
  const list = extractList(body)

  const items = list
    .map((item, index) => normaliseCaseStudy(item, `case-study-${params.page}-${index + 1}`))
    .filter((item): item is CaseStudy => Boolean(item))

  const total = extractTotal(body, items.length)
  return { items, total }
}

export const fetchCaseStudyById = async (id: string): Promise<CaseStudy | null> => {
  const response = await client.get(`${CASE_STUDY_ITEM_ENDPOINT}/${encodeURIComponent(id)}`, {
    headers: { ...getAuthHeader() },
  })
  const raw = extractSingle(response.data)
  return normaliseCaseStudy(raw, id)
}

export const createCaseStudy = async (caseStudy: CaseStudy): Promise<CaseStudy | null> => {
  const body = await buildPayload(caseStudy, false)
  const response = await client.post(CASE_STUDY_CREATE_ENDPOINT, body, {
    headers: { ...getAuthHeader() },
  })
  const raw = extractSingle(response.data)
  return normaliseCaseStudy(raw, `case-study-${Date.now()}`)
}

export const updateCaseStudy = async (
  id: string,
  caseStudy: CaseStudy,
): Promise<CaseStudy | null> => {
  const body = { id: Number.parseInt(id, 10), ...(await buildPayload(caseStudy, false)) }
  const response = await client.post(CASE_STUDY_UPDATE_ENDPOINT, body, {
    headers: { ...getAuthHeader() },
  })
  const raw = extractSingle(response.data)
  return normaliseCaseStudy(raw, id)
}

export const deleteCaseStudy = async (id: string): Promise<void> => {
  await client.delete(`${CASE_STUDY_ITEM_ENDPOINT}/${encodeURIComponent(id)}`, {
    headers: { ...getAuthHeader() },
  })
}
