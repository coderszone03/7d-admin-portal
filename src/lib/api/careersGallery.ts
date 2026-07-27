import client from './client'
import { getCookie } from '../utils/cookies'
import { AUTH_COOKIE_KEY } from '../../features/auth/constants'
import type {
  CareersGalleryFormPayload,
  CareersGalleryImage,
} from '../../components/careers/galleryTypes'
import { MAX_GALLERY_IMAGES } from '../../components/careers/galleryTypes'

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

const GALLERY_LIST_ENDPOINT = '/api/admin/careers_gallery'
const GALLERY_ITEM_ENDPOINT = '/api/admin/careers_gallery'
const GALLERY_CREATE_ENDPOINT = '/api/admin/careers_gallery/create'
const GALLERY_UPDATE_ENDPOINT = '/api/admin/careers_gallery/update'
const GALLERY_REORDER_ENDPOINT = '/api/admin/careers_gallery/reorder'

const toStringOrEmpty = (v: unknown): string => (v === null || v === undefined ? '' : String(v))

export type FetchCareersGalleryParams = {
  status?: 'all' | 0 | 1
}

export type FetchCareersGalleryResult = {
  items: CareersGalleryImage[]
  total: number
  max: number
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const extractList = (body: unknown): unknown[] => {
  if (Array.isArray(body)) return body
  const b = body as any
  if (Array.isArray(b?.data)) return b.data
  if (Array.isArray(b?.items)) return b.items
  if (Array.isArray(b?.images)) return b.images
  if (Array.isArray(b?.gallery)) return b.gallery
  if (Array.isArray(b?.data?.items)) return b.data.items
  return []
}

const extractSingle = (body: unknown): unknown => {
  if (!body || typeof body !== 'object') return body
  const b = body as any
  if (b.data && typeof b.data === 'object' && !Array.isArray(b.data)) return b.data
  if (b.image && typeof b.image === 'object') return b.image
  return b
}

const normaliseGalleryImage = (raw: unknown, fallbackId: string): CareersGalleryImage | null => {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Record<string, any>

  const id = String(v.id ?? v.gallery_id ?? v._id ?? fallbackId)
  const imageUrl = toStringOrEmpty(
    v.image ?? v.image_url ?? v.imageUrl ?? v.thumbnail ?? v.image_file,
  )
  const alt = toStringOrEmpty(v.alt ?? v.alt_text ?? v.caption)

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

  return { id, imageUrl, alt, status, displayOrder, createdAt, updatedAt }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const sortByDisplayOrder = (a: CareersGalleryImage, b: CareersGalleryImage) =>
  a.displayOrder - b.displayOrder

type GalleryMutationPayload = {
  alt: string
  status: 0 | 1
  display_order: number
  image_file?: string
}

const buildGalleryPayload = (payload: CareersGalleryFormPayload): GalleryMutationPayload => {
  const body: GalleryMutationPayload = {
    alt: payload.alt.trim(),
    status: payload.status,
    display_order: payload.displayOrder,
  }
  // Only send the image on a fresh upload (data: URL). Empty/hosted means unchanged.
  if (payload.imageDataUrl.startsWith('data:')) {
    body.image_file = payload.imageDataUrl
  }
  return body
}

export const fetchCareersGallery = async (
  params: FetchCareersGalleryParams = {},
): Promise<FetchCareersGalleryResult> => {
  const query: Record<string, unknown> = { per_page: MAX_GALLERY_IMAGES }
  if (params.status !== undefined && params.status !== 'all') query.status = params.status

  const response = await client.get(GALLERY_LIST_ENDPOINT, {
    params: query,
    headers: { ...getAuthHeader() },
  })
  const list = extractList(response.data)
  const items = list
    .map((item, index) => normaliseGalleryImage(item, `gallery-${index + 1}`))
    .filter((item): item is CareersGalleryImage => Boolean(item))
    .sort(sortByDisplayOrder)
  return { items, total: items.length, max: MAX_GALLERY_IMAGES }
}

export const createCareersGalleryImage = async (
  payload: CareersGalleryFormPayload,
): Promise<CareersGalleryImage> => {
  if (!payload.imageDataUrl) {
    throw new Error('Image is required.')
  }
  const response = await client.post(GALLERY_CREATE_ENDPOINT, buildGalleryPayload(payload), {
    headers: { ...getAuthHeader() },
  })
  const created = normaliseGalleryImage(extractSingle(response.data), `gallery-${Date.now()}`)
  if (!created) throw new Error('Gallery image was created but the response could not be read.')
  return created
}

export const updateCareersGalleryImage = async (
  id: string,
  payload: CareersGalleryFormPayload,
): Promise<CareersGalleryImage | null> => {
  const body = { id: Number.parseInt(id, 10), ...buildGalleryPayload(payload) }
  const response = await client.post(GALLERY_UPDATE_ENDPOINT, body, {
    headers: { ...getAuthHeader() },
  })
  return normaliseGalleryImage(extractSingle(response.data), id)
}

export const reorderCareersGallery = async (
  pairs: Array<{ id: string; displayOrder: number }>,
): Promise<CareersGalleryImage[]> => {
  const body = {
    items: pairs.map((p) => ({
      id: Number.parseInt(p.id, 10),
      display_order: p.displayOrder,
    })),
  }
  const response = await client.post(GALLERY_REORDER_ENDPOINT, body, {
    headers: { ...getAuthHeader() },
  })
  const list = extractList(response.data)
  // Some reorder endpoints return the updated list; if not, fall back to a fresh fetch.
  if (list.length) {
    return list
      .map((item, index) => normaliseGalleryImage(item, `gallery-${index + 1}`))
      .filter((item): item is CareersGalleryImage => Boolean(item))
      .sort(sortByDisplayOrder)
  }
  const refreshed = await fetchCareersGallery()
  return refreshed.items
}

export const deleteCareersGalleryImage = async (id: string): Promise<boolean> => {
  await client.delete(`${GALLERY_ITEM_ENDPOINT}/${encodeURIComponent(id)}`, {
    headers: { ...getAuthHeader() },
  })
  return true
}
