import type {
  Testimonial,
  TestimonialFormPayload,
} from '../../components/testimonials/types'
import {
  DEFAULT_TESTIMONIAL_CATEGORIES,
  mergeTestimonialCategories,
} from '../../components/testimonials/types'
import { seedTestimonials } from '../../assets/constants/testimonials'

// In-memory store for the dummy phase. Module-level so it survives across page navigations
// within the same browser session, but resets on full reload (matches what the user sees as
// "non-persisted dummy data"). Once the backend lands, replace every function in this file
// with axios calls — the signatures stay identical.
let store: Testimonial[] = seedTestimonials.map((t) => ({ ...t }))
let nextId = store.length + 1

const FAKE_LATENCY_MS = 220

const wait = <T>(value: T): Promise<T> =>
  new Promise((resolve) => window.setTimeout(() => resolve(value), FAKE_LATENCY_MS))

const sortByDisplayOrder = (a: Testimonial, b: Testimonial) =>
  a.displayOrder - b.displayOrder

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

export const fetchTestimonials = async (
  params: FetchTestimonialsParams,
): Promise<FetchTestimonialsResult> => {
  const { page, pageSize, search, category, status } = params
  const term = search?.trim().toLowerCase() ?? ''

  const filtered = store
    .filter((t) => (category && category !== 'all' ? t.category === category : true))
    .filter((t) => (status !== undefined && status !== 'all' ? t.status === status : true))
    .filter((t) =>
      term
        ? t.name.toLowerCase().includes(term) ||
          t.role.toLowerCase().includes(term) ||
          t.quote.toLowerCase().includes(term)
        : true,
    )
    .slice()
    .sort(sortByDisplayOrder)

  const start = (page - 1) * pageSize
  const items = filtered.slice(start, start + pageSize)

  return wait({ items, total: filtered.length })
}

export const fetchTestimonialById = async (id: string): Promise<Testimonial | null> => {
  const found = store.find((t) => t.id === id) ?? null
  return wait(found ? { ...found } : null)
}

// Distinct categories currently in use, merged with the suggested defaults. Powers the
// filter bar and the builder's category chips. Categories are free-form, so this is the
// live source of truth rather than a fixed enum.
export const fetchTestimonialCategories = async (): Promise<string[]> => {
  return wait(
    mergeTestimonialCategories(
      DEFAULT_TESTIMONIAL_CATEGORIES,
      store.map((t) => t.category),
    ),
  )
}

export const createTestimonial = async (
  payload: TestimonialFormPayload,
): Promise<Testimonial> => {
  const now = new Date().toISOString()
  const created: Testimonial = {
    id: `t-${nextId++}`,
    name: payload.name,
    role: payload.role,
    category: payload.category,
    quote: payload.quote,
    photoUrl: payload.photoDataUrl,
    status: payload.status,
    displayOrder: payload.displayOrder,
    createdAt: now,
    updatedAt: now,
  }
  store = [...store, created]
  return wait({ ...created })
}

export const updateTestimonial = async (
  id: string,
  payload: TestimonialFormPayload,
): Promise<Testimonial | null> => {
  const idx = store.findIndex((t) => t.id === id)
  if (idx === -1) return wait(null)

  const existing = store[idx]
  const updated: Testimonial = {
    ...existing,
    name: payload.name,
    role: payload.role,
    category: payload.category,
    quote: payload.quote,
    // Empty data URL on update means "keep existing photo" — same convention as blog/portfolio.
    photoUrl: payload.photoDataUrl || existing.photoUrl,
    status: payload.status,
    displayOrder: payload.displayOrder,
    updatedAt: new Date().toISOString(),
  }
  store = store.map((t, i) => (i === idx ? updated : t))
  return wait({ ...updated })
}

export const deleteTestimonial = async (id: string): Promise<boolean> => {
  const initialLen = store.length
  store = store.filter((t) => t.id !== id)
  return wait(store.length < initialLen)
}
