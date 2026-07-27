import client from './client'
import { getCookie } from '../utils/cookies'
import { AUTH_COOKIE_KEY } from '../../features/auth/constants'
import type {
  Service,
  ServiceFormPayload,
} from '../../components/services/types'

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

const SERVICES_LIST_ENDPOINT = '/api/admin/services'
const SERVICE_ITEM_ENDPOINT = '/api/admin/service'
const SERVICE_CREATE_ENDPOINT = '/api/admin/service/create'
const SERVICE_UPDATE_ENDPOINT = '/api/admin/service/update'

export type FetchServicesParams = {
  page: number
  pageSize: number
  search?: string
  status?: 'all' | 0 | 1
}

export type FetchServicesResult = {
  items: Service[]
  total: number
}

const toStringOrEmpty = (v: unknown): string => (v === null || v === undefined ? '' : String(v))

/* eslint-disable @typescript-eslint/no-explicit-any */
const extractList = (body: unknown): unknown[] => {
  if (Array.isArray(body)) return body
  const b = body as any
  if (Array.isArray(b?.data)) return b.data
  if (Array.isArray(b?.items)) return b.items
  if (Array.isArray(b?.services)) return b.services
  if (Array.isArray(b?.data?.items)) return b.data.items
  return []
}

const extractSingle = (body: unknown): unknown => {
  if (!body || typeof body !== 'object') return body
  const b = body as any
  if (b.data && typeof b.data === 'object' && !Array.isArray(b.data)) return b.data
  if (b.service && typeof b.service === 'object') return b.service
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

const slugFromTitle = (title: string): string =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const normaliseService = (raw: unknown, fallbackId: string): Service | null => {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Record<string, any>

  const id = String(v.id ?? v.service_id ?? v._id ?? fallbackId)
  const title = toStringOrEmpty(v.title ?? v.name)
  const slug = toStringOrEmpty(v.slug) || slugFromTitle(title)
  const description = toStringOrEmpty(v.description ?? v.short_description)
  const longDescription = toStringOrEmpty(
    v.long_description ?? v.longDescription ?? v.content,
  )
  const imageUrl = toStringOrEmpty(
    v.image ?? v.image_url ?? v.imageUrl ?? v.thumbnail ?? v.image_file,
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
    title,
    slug,
    description,
    longDescription,
    imageUrl,
    status,
    displayOrder,
    createdAt,
    updatedAt,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

type ServiceMutationPayload = {
  title: string
  slug: string
  description: string
  long_description: string
  status: 0 | 1
  display_order: number
  image_file?: string
}

const buildServicePayload = (payload: ServiceFormPayload): ServiceMutationPayload => {
  const body: ServiceMutationPayload = {
    title: payload.title.trim(),
    slug: payload.slug.trim(),
    description: payload.description.trim(),
    long_description: payload.longDescription.trim(),
    status: payload.status,
    display_order: payload.displayOrder,
  }
  // Only send the image when it's a fresh upload (data: URL). An empty or hosted URL
  // means "keep the existing image", so we omit the field.
  if (payload.imageDataUrl.startsWith('data:')) {
    body.image_file = payload.imageDataUrl
  }
  return body
}

export const fetchServices = async (
  params: FetchServicesParams,
): Promise<FetchServicesResult> => {
  const query: Record<string, unknown> = {
    per_page: params.pageSize,
    page: params.page,
  }
  if (params.search && params.search.trim()) query.search = params.search.trim()
  if (params.status !== undefined && params.status !== 'all') query.status = params.status

  const response = await client.get(SERVICES_LIST_ENDPOINT, {
    params: query,
    headers: { ...getAuthHeader() },
  })
  const body = response.data
  const list = extractList(body)
  const items = list
    .map((item, index) => normaliseService(item, `service-${params.page}-${index + 1}`))
    .filter((item): item is Service => Boolean(item))
  const total = extractTotal(body, items.length)
  return { items, total }
}

export const fetchServiceById = async (id: string): Promise<Service | null> => {
  const response = await client.get(`${SERVICE_ITEM_ENDPOINT}/${encodeURIComponent(id)}`, {
    headers: { ...getAuthHeader() },
  })
  const raw = extractSingle(response.data)
  return normaliseService(raw, id)
}

export const createService = async (payload: ServiceFormPayload): Promise<Service> => {
  const response = await client.post(SERVICE_CREATE_ENDPOINT, buildServicePayload(payload), {
    headers: { ...getAuthHeader() },
  })
  const created = normaliseService(extractSingle(response.data), `service-${Date.now()}`)
  if (!created) throw new Error('Service was created but the response could not be read.')
  return created
}

export const updateService = async (
  id: string,
  payload: ServiceFormPayload,
): Promise<Service | null> => {
  const body = { id: Number.parseInt(id, 10), ...buildServicePayload(payload) }
  const response = await client.post(SERVICE_UPDATE_ENDPOINT, body, {
    headers: { ...getAuthHeader() },
  })
  return normaliseService(extractSingle(response.data), id)
}

export const deleteService = async (id: string): Promise<boolean> => {
  await client.delete(`${SERVICE_ITEM_ENDPOINT}/${encodeURIComponent(id)}`, {
    headers: { ...getAuthHeader() },
  })
  return true
}
