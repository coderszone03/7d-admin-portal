import client from './client'
import { getCookie } from '../utils/cookies'
import { AUTH_COOKIE_KEY } from '../../features/auth/constants'
import type { CaseStudyHighlight } from '../../components/blog/caseStudy/types'

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

const HIGHLIGHT_GET_ENDPOINT = '/api/admin/blog/case-study'
const HIGHLIGHT_UPDATE_ENDPOINT = '/api/admin/blog/case-study/update'

const toStringOrEmpty = (v: unknown): string => (v === null || v === undefined ? '' : String(v))

const extractSingle = (body: unknown): Record<string, unknown> => {
  if (!body || typeof body !== 'object') return {}
  const b = body as Record<string, unknown>
  if (b.data && typeof b.data === 'object' && !Array.isArray(b.data)) {
    return b.data as Record<string, unknown>
  }
  return b
}

const normaliseHighlight = (raw: unknown): CaseStudyHighlight => {
  const v = extractSingle(raw)
  return {
    imageUrl: toStringOrEmpty(v.image ?? v.image_url ?? v.imageUrl ?? v.thumbnail),
    description: toStringOrEmpty(v.description),
    updatedAt: toStringOrEmpty(v.updated_at ?? v.updatedAt),
  }
}

export const fetchCaseStudyHighlight = async (): Promise<CaseStudyHighlight> => {
  const response = await client.get(HIGHLIGHT_GET_ENDPOINT, {
    headers: { ...getAuthHeader() },
  })
  return normaliseHighlight(response.data)
}

export type CaseStudyHighlightPayload = {
  imageUrl: string
  description: string
}

export const saveCaseStudyHighlight = async (
  payload: CaseStudyHighlightPayload,
): Promise<CaseStudyHighlight> => {
  // Only a freshly uploaded image arrives as a data: URL; a hosted URL means the image
  // is unchanged, so we omit image_file to tell the backend to keep the existing one.
  const body: { description: string; image_file?: string } = {
    description: payload.description,
  }
  if (payload.imageUrl.startsWith('data:')) {
    body.image_file = payload.imageUrl
  }
  const response = await client.post(HIGHLIGHT_UPDATE_ENDPOINT, body, {
    headers: { ...getAuthHeader() },
  })
  return normaliseHighlight(response.data)
}
