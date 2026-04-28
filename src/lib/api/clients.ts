import client from './client'
import { getCookie } from '../utils/cookies'
import { AUTH_COOKIE_KEY } from '../../features/auth/constants'

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

export type ApiClient = {
  id: string
  name: string
  description: string
  logoUrl: string
  uploadedAt: string
}

export type CreateClientPayload = {
  name: string
  description: string
  logo: File
}

export type UpdateClientPayload = {
  name: string
  description: string
  logo?: File | null
}

const CLIENTS_LIST_ENDPOINT = '/api/admin/clients'
const CLIENT_ITEM_ENDPOINT = '/api/admin/client'
const CLIENT_CREATE_ENDPOINT = '/api/admin/client/create'
const CLIENT_UPDATE_ENDPOINT = '/api/admin/client/update'

const createPlaceholderLogo = (name: string) => {
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 3)
  const palette = ['6366f1', '22d3ee', 'f97316', '10b981', 'ef4444', 'a855f7']
  const color = palette[name.length % palette.length]

  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><defs><linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23${color}' stop-opacity='0.85'/><stop offset='100%' stop-color='%23${color}' stop-opacity='1'/></linearGradient></defs><rect width='160' height='160' rx='36' fill='url(%23grad)'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='Inter, Arial, sans-serif' font-size='64' fill='%23ffffff' font-weight='700'>${initials || '?'}</text></svg>`
}

const normaliseClient = (raw: unknown, fallbackId: string): ApiClient | null => {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const value = raw as Record<string, any>

  const idSource = value.id ?? value.client_id ?? value._id ?? fallbackId
  const id = String(idSource)

  const name = String(value.name ?? value.client_name ?? value.title ?? 'Unnamed client')
  const description = String(value.description ?? value.desc ?? '')

  let logoUrl: string
  const logoSource =
    value.logo_url ?? value.logoUrl ?? value.logo ?? value.image ?? value.image_url ?? null

  if (typeof logoSource === 'string' && logoSource.trim()) {
    logoUrl = logoSource.trim()
  } else {
    logoUrl = createPlaceholderLogo(name)
  }

  const uploadedAtRaw =
    value.created_at ??
    value.createdAt ??
    value.uploaded_at ??
    value.uploadedAt ??
    value.updated_at ??
    new Date().toISOString()
  const uploadedAt = String(uploadedAtRaw)

  return { id, name, description, logoUrl, uploadedAt }
}

const extractList = (body: unknown): unknown[] => {
  if (Array.isArray(body)) return body
  const b = body as any
  if (Array.isArray(b?.data)) return b.data
  if (Array.isArray(b?.items)) return b.items
  if (Array.isArray(b?.clients)) return b.clients
  if (Array.isArray(b?.data?.clients)) return b.data.clients
  return []
}

const extractSingle = (body: unknown): unknown => {
  if (!body || typeof body !== 'object') return body
  const b = body as any
  if (b.data && typeof b.data === 'object' && !Array.isArray(b.data)) return b.data
  if (b.client && typeof b.client === 'object') return b.client
  return b
}

export const fetchClients = async (perPage = 50): Promise<ApiClient[]> => {
  const response = await client.get(CLIENTS_LIST_ENDPOINT, {
    params: { per_page: perPage },
    headers: { ...getAuthHeader() },
  })
  const list = extractList(response.data)

  return list
    .map((item, index) => normaliseClient(item, `client-${index + 1}`))
    .filter((item): item is ApiClient => Boolean(item))
}

export const fetchClientById = async (id: string): Promise<ApiClient | null> => {
  const response = await client.get(`${CLIENT_ITEM_ENDPOINT}/${encodeURIComponent(id)}`, {
    headers: { ...getAuthHeader() },
  })
  const raw = extractSingle(response.data)
  return normaliseClient(raw, id)
}

export const createClient = async (payload: CreateClientPayload): Promise<void> => {
  const form = new FormData()
  form.append('name', payload.name)
  form.append('description', payload.description)
  form.append('logo', payload.logo, payload.logo.name)
  await client.post(CLIENT_CREATE_ENDPOINT, form, {
    headers: {
      ...getAuthHeader(),
      // Let the browser set multipart/form-data with the correct boundary.
      'Content-Type': undefined,
    },
  })
}

export const updateClient = async (
  id: string,
  payload: UpdateClientPayload,
): Promise<void> => {
  const form = new FormData()
  form.append('id', id)
  form.append('name', payload.name)
  form.append('description', payload.description)
  if (payload.logo) {
    form.append('logo', payload.logo, payload.logo.name)
  }
  await client.post(CLIENT_UPDATE_ENDPOINT, form, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': undefined,
    },
  })
}

export const deleteClient = async (id: string): Promise<void> => {
  await client.delete(`${CLIENT_ITEM_ENDPOINT}/${encodeURIComponent(id)}`, {
    headers: { ...getAuthHeader() },
  })
}
