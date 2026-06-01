import client from './client'
import { getCookie } from '../utils/cookies'
import { AUTH_COOKIE_KEY } from '../../features/auth/constants'
import type { Enquiry } from '../../assets/constants/enquiries'

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

const CONTACTS_LIST_ENDPOINT = '/api/admin/contacts'
const CONTACT_ITEM_ENDPOINT = '/api/admin/contacts'

export type FetchContactsParams = {
  page?: number
  pageSize?: number
  search?: string
}

export type FetchContactsResult = {
  items: Enquiry[]
  total: number
}

const toStringOrEmpty = (v: unknown): string => (v === null || v === undefined ? '' : String(v))

const extractList = (body: unknown): unknown[] => {
  if (Array.isArray(body)) return body
  const b = body as any
  if (Array.isArray(b?.data)) return b.data
  if (Array.isArray(b?.items)) return b.items
  if (Array.isArray(b?.contacts)) return b.contacts
  return []
}

const extractSingle = (body: unknown): unknown => {
  if (!body || typeof body !== 'object') return body
  const b = body as any
  if (b.data && typeof b.data === 'object' && !Array.isArray(b.data)) return b.data
  if (b.contact && typeof b.contact === 'object') return b.contact
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

const normaliseContact = (raw: unknown, fallbackId: string): Enquiry | null => {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Record<string, any>

  const idSource = v.id ?? v.contact_id ?? v._id ?? fallbackId
  const id = String(idSource)

  const firstName = toStringOrEmpty(v.first_name ?? v.firstName)
  const lastName = toStringOrEmpty(v.last_name ?? v.lastName)
  const email = toStringOrEmpty(v.email)
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown'

  const from = email ? `${fullName} <${email}>` : fullName
  const to = 'hello@7ddesign.in'
  const subject = toStringOrEmpty(v.context ?? v.subject) || 'No subject'
  const body = toStringOrEmpty(v.description ?? v.body ?? v.message)
  const receivedAt = toStringOrEmpty(v.created_at ?? v.createdAt) || new Date().toISOString()

  return {
    id,
    from,
    to,
    subject,
    body,
    receivedAt,
    read: false,
  }
}

export const fetchContacts = async (
  params: FetchContactsParams = {},
): Promise<FetchContactsResult> => {
  const query: Record<string, unknown> = {
    per_page: params.pageSize ?? 50,
  }
  if (params.page) query.page = params.page
  if (params.search && params.search.trim()) query.search = params.search.trim()

  const response = await client.get(CONTACTS_LIST_ENDPOINT, {
    params: query,
    headers: { ...getAuthHeader() },
  })
  const body = response.data
  const list = extractList(body)
  const items = list
    .map((item, index) => normaliseContact(item, `contact-${index + 1}`))
    .filter((item): item is Enquiry => Boolean(item))
  const total = extractTotal(body, items.length)
  return { items, total }
}

export const fetchContactById = async (id: string): Promise<Enquiry | null> => {
  const response = await client.get(`${CONTACT_ITEM_ENDPOINT}/${encodeURIComponent(id)}`, {
    headers: { ...getAuthHeader() },
  })
  const raw = extractSingle(response.data)
  return normaliseContact(raw, id)
}

export const deleteContact = async (id: string): Promise<void> => {
  await client.delete(`${CONTACT_ITEM_ENDPOINT}/${encodeURIComponent(id)}`, {
    headers: { ...getAuthHeader() },
  })
}
