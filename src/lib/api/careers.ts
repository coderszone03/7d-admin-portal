import client from './client'
import { getCookie } from '../utils/cookies'
import { AUTH_COOKIE_KEY } from '../../features/auth/constants'
import type { JobPost, JobStatus } from '../../assets/constants/jobPosts'

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

const CAREERS_LIST_ENDPOINT = '/api/admin/careers'
const CAREER_ITEM_ENDPOINT = '/api/admin/career'
const CAREER_CREATE_ENDPOINT = '/api/admin/career/create'
const CAREER_UPDATE_ENDPOINT = '/api/admin/career/update'

export type FetchCareersParams = {
  page?: number
  pageSize?: number
  search?: string
}

export type FetchCareersResult = {
  items: JobPost[]
  total: number
}

export type CareerMutationPayload = {
  title: string
  employment_type: string
  department: string
  location: string
  status: 0 | 1 | 2
  about_description: string
  what_you_do_subtitle?: string | null
  what_you_do_description?: string | null
  what_you_do_items?: string[] | null
  what_you_bring_items: string[]
  why_7d_items: string[]
  ready_to_join_description: string
}

const toStringOrEmpty = (v: unknown): string => (v === null || v === undefined ? '' : String(v))

const extractList = (body: unknown): unknown[] => {
  if (Array.isArray(body)) return body
  const b = body as any
  if (Array.isArray(b?.data)) return b.data
  if (Array.isArray(b?.items)) return b.items
  if (Array.isArray(b?.careers)) return b.careers
  return []
}

const extractSingle = (body: unknown): unknown => {
  if (!body || typeof body !== 'object') return body
  const b = body as any
  if (b.data && typeof b.data === 'object' && !Array.isArray(b.data)) return b.data
  if (b.career && typeof b.career === 'object') return b.career
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

const coerceStringArray = (raw: unknown): string[] => {
  if (Array.isArray(raw)) {
    return raw.map((v) => String(v)).filter((v) => v.trim().length > 0)
  }
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
  }
  return []
}

// API employment_type is a free-form string. Normalise common backend strings
// back into our UI enum values so the form's dropdown pre-fills correctly.
const normaliseEmploymentType = (raw: unknown): JobPost['employmentType'] => {
  const v = String(raw ?? '').trim().toLowerCase().replace(/[_\s-]+/g, '')
  if (v === 'parttime') return 'part-time'
  if (v === 'contract') return 'contract'
  if (v === 'internship' || v === 'intern') return 'internship'
  return 'full-time'
}

const statusToApi = (status: JobStatus): 0 | 1 | 2 => {
  if (status === 'open') return 1
  if (status === 'filled') return 2
  return 0
}

const statusFromApi = (raw: unknown): JobStatus => {
  if (raw === 1 || raw === '1' || raw === true) return 'open'
  if (raw === 2 || raw === '2') return 'filled'
  return 'draft'
}

const normaliseCareer = (raw: unknown, fallbackId: string): JobPost | null => {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Record<string, any>

  const idSource = v.id ?? v.career_id ?? v._id ?? fallbackId
  const id = String(idSource)

  const title = toStringOrEmpty(v.title) || 'Untitled role'
  const department = toStringOrEmpty(v.department)
  const location = toStringOrEmpty(v.location)
  const employmentType = normaliseEmploymentType(v.employment_type ?? v.employmentType)

  const aboutCompany = toStringOrEmpty(v.about_description ?? v.aboutDescription)
  const whatYoullDoSubtitle = toStringOrEmpty(
    v.what_you_do_subtitle ?? v.whatYouDoSubtitle,
  )
  const whatYoullDoIntro = toStringOrEmpty(
    v.what_you_do_description ?? v.whatYouDoDescription,
  )
  const whatYoullDoItems = coerceStringArray(v.what_you_do_items ?? v.whatYouDoItems)
  const whatYouBring = coerceStringArray(v.what_you_bring_items ?? v.whatYouBringItems)
  const why7d = coerceStringArray(v.why_7d_items ?? v.why7dItems)
  const readyToJoinDescription = toStringOrEmpty(
    v.ready_to_join_description ?? v.readyToJoinDescription,
  )

  const status = statusFromApi(v.status)

  return {
    id,
    title,
    department,
    location,
    employmentType,
    aboutCompany,
    whatYoullDo: {
      subtitle: whatYoullDoSubtitle,
      intro: whatYoullDoIntro,
      items: whatYoullDoItems,
    },
    whatYouBring,
    why7d,
    readyToJoinDescription,
    status,
  }
}

// Convert an employment-type enum value → the string the API expects.
// The API accepts any string up to 100 chars; we send capitalised labels.
const employmentTypeLabel = (value: JobPost['employmentType']): string => {
  switch (value) {
    case 'part-time':
      return 'Part-time'
    case 'contract':
      return 'Contract'
    case 'internship':
      return 'Internship'
    default:
      return 'Full-time'
  }
}

export const buildCareerPayload = (post: JobPost): CareerMutationPayload => {
  const cleanList = (list: string[]) => list.map((v) => v.trim()).filter(Boolean)
  const what_you_do_items = cleanList(post.whatYoullDo.items)

  return {
    title: post.title.trim(),
    employment_type: employmentTypeLabel(post.employmentType),
    department: post.department.trim(),
    location: post.location.trim(),
    status: statusToApi(post.status),
    about_description: post.aboutCompany.trim(),
    what_you_do_subtitle: post.whatYoullDo.subtitle?.trim() || null,
    what_you_do_description: post.whatYoullDo.intro?.trim() || null,
    what_you_do_items: what_you_do_items.length ? what_you_do_items : null,
    what_you_bring_items: cleanList(post.whatYouBring),
    why_7d_items: cleanList(post.why7d),
    ready_to_join_description: post.readyToJoinDescription.trim(),
  }
}

export const fetchCareers = async (
  params: FetchCareersParams = {},
): Promise<FetchCareersResult> => {
  const query: Record<string, unknown> = {
    per_page: params.pageSize ?? 50,
  }
  if (params.page) query.page = params.page
  if (params.search && params.search.trim()) query.search = params.search.trim()

  const response = await client.get(CAREERS_LIST_ENDPOINT, {
    params: query,
    headers: { ...getAuthHeader() },
  })
  const body = response.data
  const list = extractList(body)
  const items = list
    .map((item, index) => normaliseCareer(item, `career-${index + 1}`))
    .filter((item): item is JobPost => Boolean(item))
  const total = extractTotal(body, items.length)
  return { items, total }
}

export const fetchCareerById = async (id: string): Promise<JobPost | null> => {
  const response = await client.get(`${CAREER_ITEM_ENDPOINT}/${encodeURIComponent(id)}`, {
    headers: { ...getAuthHeader() },
  })
  const raw = extractSingle(response.data)
  return normaliseCareer(raw, id)
}

export const createCareer = async (post: JobPost): Promise<void> => {
  const payload = buildCareerPayload(post)
  await client.post(CAREER_CREATE_ENDPOINT, payload, {
    headers: { ...getAuthHeader() },
  })
}

export const updateCareer = async (id: string, post: JobPost): Promise<void> => {
  const payload = { id: Number.parseInt(id, 10), ...buildCareerPayload(post) }
  await client.post(CAREER_UPDATE_ENDPOINT, payload, {
    headers: { ...getAuthHeader() },
  })
}

export const deleteCareer = async (id: string): Promise<void> => {
  await client.delete(`${CAREER_ITEM_ENDPOINT}/${encodeURIComponent(id)}`, {
    headers: { ...getAuthHeader() },
  })
}
