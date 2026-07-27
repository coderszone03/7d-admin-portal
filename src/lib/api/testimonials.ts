import client from './client'
import { getCookie } from '../utils/cookies'
import { AUTH_COOKIE_KEY } from '../../features/auth/constants'
import type {
  Testimonial,
  TestimonialFormPayload,
} from '../../components/testimonials/types'
import {
  DEFAULT_TESTIMONIAL_CATEGORIES,
  mergeTestimonialCategories,
} from '../../components/testimonials/types'

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

const TESTIMONIALS_LIST_ENDPOINT = '/api/admin/testimonials'
const TESTIMONIAL_ITEM_ENDPOINT = '/api/admin/testimonial'
const TESTIMONIAL_CREATE_ENDPOINT = '/api/admin/testimonial/create'
const TESTIMONIAL_UPDATE_ENDPOINT = '/api/admin/testimonial/update'

export type FetchTestimonialsParams = {
  page: number
  pageSize: number
  search?: string
  category?: 'all' | Testimonial['category']
  status?: 'all' | 0 | 1
}

export type FetchTestimonialsResult = {
  items: Testimonial[]
  total: number
}

const toStringOrEmpty = (v: unknown): string => (v === null || v === undefined ? '' : String(v))

/* eslint-disable @typescript-eslint/no-explicit-any */
const extractList = (body: unknown): unknown[] => {
  if (Array.isArray(body)) return body
  const b = body as any
  if (Array.isArray(b?.data)) return b.data
  if (Array.isArray(b?.items)) return b.items
  if (Array.isArray(b?.testimonials)) return b.testimonials
  if (Array.isArray(b?.data?.items)) return b.data.items
  return []
}

const extractSingle = (body: unknown): unknown => {
  if (!body || typeof body !== 'object') return body
  const b = body as any
  if (b.data && typeof b.data === 'object' && !Array.isArray(b.data)) return b.data
  if (b.testimonial && typeof b.testimonial === 'object') return b.testimonial
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

const normaliseTestimonial = (raw: unknown, fallbackId: string): Testimonial | null => {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Record<string, any>

  const id = String(v.id ?? v.testimonial_id ?? v._id ?? fallbackId)
  const name = toStringOrEmpty(v.name ?? v.client_name)
  const role = toStringOrEmpty(v.role ?? v.designation)
  const category = toStringOrEmpty(v.category)
  const quote = toStringOrEmpty(v.quote ?? v.feedback ?? v.message)
  const photoUrl = toStringOrEmpty(
    v.photo ?? v.photo_url ?? v.photoUrl ?? v.image ?? v.image_url ?? v.photo_file,
  )

  const statusRaw = v.status
  const status: 0 | 1 = statusRaw === 1 || statusRaw === '1' || statusRaw === true ? 1 : 0

  const orderRaw = v.display_order ?? v.displayOrder ?? v.order
  const orderNum =
    typeof orderRaw === 'number'
      ? orderRaw
      : typeof orderRaw === 'string'
        ? Number.parseInt(orderRaw, 10)
        : 0
  const displayOrder = Number.isFinite(orderNum) ? orderNum : 0

  const createdAt = toStringOrEmpty(v.created_at ?? v.createdAt) || new Date().toISOString()
  const updatedAt = toStringOrEmpty(v.updated_at ?? v.updatedAt) || createdAt

  return {
    id,
    name,
    role,
    category,
    quote,
    photoUrl,
    status,
    displayOrder,
    createdAt,
    updatedAt,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

type TestimonialMutationPayload = {
  name: string
  role: string
  category: string
  quote: string
  status: 0 | 1
  display_order: number
  photo_file?: string
}

const buildTestimonialPayload = (
  payload: TestimonialFormPayload,
): TestimonialMutationPayload => {
  const body: TestimonialMutationPayload = {
    name: payload.name.trim(),
    role: payload.role.trim(),
    category: payload.category.trim(),
    quote: payload.quote.trim(),
    status: payload.status,
    display_order: payload.displayOrder,
  }
  // Only send the photo when it's a fresh upload (data: URL). Empty/hosted means unchanged.
  if (payload.photoDataUrl.startsWith('data:')) {
    body.photo_file = payload.photoDataUrl
  }
  return body
}

export const fetchTestimonials = async (
  params: FetchTestimonialsParams,
): Promise<FetchTestimonialsResult> => {
  const query: Record<string, unknown> = {
    per_page: params.pageSize,
    page: params.page,
  }
  if (params.search && params.search.trim()) query.search = params.search.trim()
  if (params.status !== undefined && params.status !== 'all') query.status = params.status
  if (params.category && params.category !== 'all') query.category = params.category

  const response = await client.get(TESTIMONIALS_LIST_ENDPOINT, {
    params: query,
    headers: { ...getAuthHeader() },
  })
  const body = response.data
  const list = extractList(body)
  const items = list
    .map((item, index) => normaliseTestimonial(item, `testimonial-${params.page}-${index + 1}`))
    .filter((item): item is Testimonial => Boolean(item))
  const total = extractTotal(body, items.length)
  return { items, total }
}

export const fetchTestimonialById = async (id: string): Promise<Testimonial | null> => {
  const response = await client.get(
    `${TESTIMONIAL_ITEM_ENDPOINT}/${encodeURIComponent(id)}`,
    { headers: { ...getAuthHeader() } },
  )
  const raw = extractSingle(response.data)
  return normaliseTestimonial(raw, id)
}

// Categories are free-form. Derive the live set from the first page of testimonials
// merged with the suggested defaults, so the filter bar and builder chips stay in sync.
export const fetchTestimonialCategories = async (): Promise<string[]> => {
  try {
    const response = await client.get(TESTIMONIALS_LIST_ENDPOINT, {
      params: { per_page: 200, page: 1 },
      headers: { ...getAuthHeader() },
    })
    const list = extractList(response.data)
    const categories = list
      .map((item) => normaliseTestimonial(item, ''))
      .filter((item): item is Testimonial => Boolean(item))
      .map((t) => t.category)
    return mergeTestimonialCategories(DEFAULT_TESTIMONIAL_CATEGORIES, categories)
  } catch {
    return mergeTestimonialCategories(DEFAULT_TESTIMONIAL_CATEGORIES, [])
  }
}

export const createTestimonial = async (
  payload: TestimonialFormPayload,
): Promise<Testimonial> => {
  const response = await client.post(
    TESTIMONIAL_CREATE_ENDPOINT,
    buildTestimonialPayload(payload),
    { headers: { ...getAuthHeader() } },
  )
  const created = normaliseTestimonial(extractSingle(response.data), `testimonial-${Date.now()}`)
  if (!created) throw new Error('Testimonial was created but the response could not be read.')
  return created
}

export const updateTestimonial = async (
  id: string,
  payload: TestimonialFormPayload,
): Promise<Testimonial | null> => {
  const body = { id: Number.parseInt(id, 10), ...buildTestimonialPayload(payload) }
  const response = await client.post(TESTIMONIAL_UPDATE_ENDPOINT, body, {
    headers: { ...getAuthHeader() },
  })
  return normaliseTestimonial(extractSingle(response.data), id)
}

export const deleteTestimonial = async (id: string): Promise<boolean> => {
  await client.delete(`${TESTIMONIAL_ITEM_ENDPOINT}/${encodeURIComponent(id)}`, {
    headers: { ...getAuthHeader() },
  })
  return true
}
