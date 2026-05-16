import type {
  Service,
  ServiceFormPayload,
} from '../../components/services/types'
import { seedServices } from '../../assets/constants/services'

let store: Service[] = seedServices.map((s) => ({ ...s }))
let nextId = store.length + 1

const FAKE_LATENCY_MS = 220

const wait = <T>(value: T): Promise<T> =>
  new Promise((resolve) => window.setTimeout(() => resolve(value), FAKE_LATENCY_MS))

const sortByDisplayOrder = (a: Service, b: Service) => a.displayOrder - b.displayOrder

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

export const fetchServices = async (
  params: FetchServicesParams,
): Promise<FetchServicesResult> => {
  const { page, pageSize, search, status } = params
  const term = search?.trim().toLowerCase() ?? ''

  const filtered = store
    .filter((s) => (status !== undefined && status !== 'all' ? s.status === status : true))
    .filter((s) =>
      term
        ? s.title.toLowerCase().includes(term) ||
          s.description.toLowerCase().includes(term) ||
          s.longDescription.toLowerCase().includes(term)
        : true,
    )
    .slice()
    .sort(sortByDisplayOrder)

  const start = (page - 1) * pageSize
  const items = filtered.slice(start, start + pageSize)

  return wait({ items, total: filtered.length })
}

export const fetchServiceById = async (id: string): Promise<Service | null> => {
  const found = store.find((s) => s.id === id) ?? null
  return wait(found ? { ...found } : null)
}

const isSlugTaken = (slug: string, excludeId?: string) =>
  store.some((s) => s.slug === slug && s.id !== excludeId)

export const createService = async (
  payload: ServiceFormPayload,
): Promise<Service> => {
  if (isSlugTaken(payload.slug)) {
    throw new Error(`Slug "${payload.slug}" is already in use.`)
  }
  const now = new Date().toISOString()
  const created: Service = {
    id: `s-${nextId++}`,
    title: payload.title,
    slug: payload.slug,
    description: payload.description,
    longDescription: payload.longDescription,
    imageUrl: payload.imageDataUrl,
    status: payload.status,
    displayOrder: payload.displayOrder,
    createdAt: now,
    updatedAt: now,
  }
  store = [...store, created]
  return wait({ ...created })
}

export const updateService = async (
  id: string,
  payload: ServiceFormPayload,
): Promise<Service | null> => {
  const idx = store.findIndex((s) => s.id === id)
  if (idx === -1) return wait(null)

  if (isSlugTaken(payload.slug, id)) {
    throw new Error(`Slug "${payload.slug}" is already in use.`)
  }

  const existing = store[idx]
  const updated: Service = {
    ...existing,
    title: payload.title,
    slug: payload.slug,
    description: payload.description,
    longDescription: payload.longDescription,
    // Empty data URL on update means "keep existing image".
    imageUrl: payload.imageDataUrl || existing.imageUrl,
    status: payload.status,
    displayOrder: payload.displayOrder,
    updatedAt: new Date().toISOString(),
  }
  store = store.map((s, i) => (i === idx ? updated : s))
  return wait({ ...updated })
}

export const deleteService = async (id: string): Promise<boolean> => {
  const initialLen = store.length
  store = store.filter((s) => s.id !== id)
  return wait(store.length < initialLen)
}
