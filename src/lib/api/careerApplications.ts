import client from './client'
import { getCookie } from '../utils/cookies'
import { AUTH_COOKIE_KEY } from '../../features/auth/constants'
import type { Applicant } from '../../assets/constants/applicants'

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

const CAREER_APPLICATIONS_LIST_ENDPOINT = '/api/admin/career-applications'
const CAREER_APPLICATION_ITEM_ENDPOINT = '/api/admin/career-applications'

export type FetchCareerApplicationsParams = {
  page?: number
  pageSize?: number
  search?: string
}

export type FetchCareerApplicationsResult = {
  items: Applicant[]
  total: number
}

const toStringOrEmpty = (v: unknown): string => (v === null || v === undefined ? '' : String(v))

const extractList = (body: unknown): unknown[] => {
  if (Array.isArray(body)) return body
  const b = body as any
  if (Array.isArray(b?.data)) return b.data
  if (Array.isArray(b?.items)) return b.items
  if (Array.isArray(b?.applications)) return b.applications
  return []
}

const extractSingle = (body: unknown): unknown => {
  if (!body || typeof body !== 'object') return body
  const b = body as any
  if (b.data && typeof b.data === 'object' && !Array.isArray(b.data)) return b.data
  if (b.application && typeof b.application === 'object') return b.application
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

const normaliseApplication = (raw: unknown, fallbackId: string): Applicant | null => {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Record<string, any>

  const idSource = v.id ?? v.application_id ?? v._id ?? fallbackId
  const id = String(idSource)

  const firstName = toStringOrEmpty(v.first_name ?? v.firstName)
  const lastName = toStringOrEmpty(v.last_name ?? v.lastName)
  const name = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown'

  const email = toStringOrEmpty(v.email)
  const phone = toStringOrEmpty(v.phone ?? v.mobile)
  const portfolioLink = toStringOrEmpty(v.portfolio_link ?? v.portfolioLink)
  const resumeUrl = toStringOrEmpty(v.resume_url ?? v.resumeUrl)
  const coverNote = toStringOrEmpty(v.cover_note ?? v.coverNote ?? v.message)

  const jobPostId = toStringOrEmpty(v.career_id ?? v.job_post_id ?? v.jobPostId)

  const appliedAt = toStringOrEmpty(v.created_at ?? v.createdAt) || new Date().toISOString()

  return {
    id,
    jobPostId,
    name,
    email,
    phone,
    coverNote,
    portfolioLink,
    resumeUrl,
    status: 'new',
    appliedAt,
    read: false,
  }
}

export const fetchCareerApplications = async (
  params: FetchCareerApplicationsParams = {},
): Promise<FetchCareerApplicationsResult> => {
  const query: Record<string, unknown> = {
    per_page: params.pageSize ?? 50,
  }
  if (params.page) query.page = params.page
  if (params.search && params.search.trim()) query.search = params.search.trim()

  const response = await client.get(CAREER_APPLICATIONS_LIST_ENDPOINT, {
    params: query,
    headers: { ...getAuthHeader() },
  })
  const body = response.data
  const list = extractList(body)
  const items = list
    .map((item, index) => normaliseApplication(item, `application-${index + 1}`))
    .filter((item): item is Applicant => Boolean(item))
  const total = extractTotal(body, items.length)
  return { items, total }
}

export const fetchCareerApplicationById = async (id: string): Promise<Applicant | null> => {
  const response = await client.get(
    `${CAREER_APPLICATION_ITEM_ENDPOINT}/${encodeURIComponent(id)}`,
    { headers: { ...getAuthHeader() } },
  )
  const raw = extractSingle(response.data)
  return normaliseApplication(raw, id)
}

export const deleteCareerApplication = async (id: string): Promise<void> => {
  await client.delete(
    `${CAREER_APPLICATION_ITEM_ENDPOINT}/${encodeURIComponent(id)}`,
    { headers: { ...getAuthHeader() } },
  )
}
