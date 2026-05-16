import type {
  CareersGalleryFormPayload,
  CareersGalleryImage,
} from '../../components/careers/galleryTypes'
import { MAX_GALLERY_IMAGES } from '../../components/careers/galleryTypes'
import { seedCareersGallery } from '../../assets/constants/careersGallery'

let store: CareersGalleryImage[] = seedCareersGallery.map((g) => ({ ...g }))
let nextId = store.length + 1

const FAKE_LATENCY_MS = 200

const wait = <T>(value: T): Promise<T> =>
  new Promise((resolve) => window.setTimeout(() => resolve(value), FAKE_LATENCY_MS))

const sortByDisplayOrder = (a: CareersGalleryImage, b: CareersGalleryImage) =>
  a.displayOrder - b.displayOrder

export type FetchCareersGalleryParams = {
  status?: 'all' | 0 | 1
}

export type FetchCareersGalleryResult = {
  items: CareersGalleryImage[]
  total: number
  max: number
}

export const fetchCareersGallery = async (
  params: FetchCareersGalleryParams = {},
): Promise<FetchCareersGalleryResult> => {
  const { status } = params
  const items = store
    .filter((g) => (status !== undefined && status !== 'all' ? g.status === status : true))
    .slice()
    .sort(sortByDisplayOrder)
  return wait({ items, total: items.length, max: MAX_GALLERY_IMAGES })
}

export const createCareersGalleryImage = async (
  payload: CareersGalleryFormPayload,
): Promise<CareersGalleryImage> => {
  if (store.length >= MAX_GALLERY_IMAGES) {
    throw new Error(`Gallery is full (max ${MAX_GALLERY_IMAGES} images).`)
  }
  if (!payload.imageDataUrl) {
    throw new Error('Image is required.')
  }
  const now = new Date().toISOString()
  const created: CareersGalleryImage = {
    id: `g-${nextId++}`,
    imageUrl: payload.imageDataUrl,
    alt: payload.alt,
    status: payload.status,
    displayOrder: payload.displayOrder,
    createdAt: now,
    updatedAt: now,
  }
  store = [...store, created]
  return wait({ ...created })
}

export const updateCareersGalleryImage = async (
  id: string,
  payload: CareersGalleryFormPayload,
): Promise<CareersGalleryImage | null> => {
  const idx = store.findIndex((g) => g.id === id)
  if (idx === -1) return wait(null)

  const existing = store[idx]
  const updated: CareersGalleryImage = {
    ...existing,
    alt: payload.alt,
    status: payload.status,
    displayOrder: payload.displayOrder,
    imageUrl: payload.imageDataUrl || existing.imageUrl,
    updatedAt: new Date().toISOString(),
  }
  store = store.map((g, i) => (i === idx ? updated : g))
  return wait({ ...updated })
}

export const reorderCareersGallery = async (
  pairs: Array<{ id: string; displayOrder: number }>,
): Promise<CareersGalleryImage[]> => {
  const lookup = new Map(pairs.map((p) => [p.id, p.displayOrder]))
  store = store
    .map((g) => (lookup.has(g.id) ? { ...g, displayOrder: lookup.get(g.id) ?? g.displayOrder, updatedAt: new Date().toISOString() } : g))
    .sort(sortByDisplayOrder)
  return wait(store.slice().sort(sortByDisplayOrder))
}

export const deleteCareersGalleryImage = async (id: string): Promise<boolean> => {
  const initialLen = store.length
  store = store.filter((g) => g.id !== id)
  return wait(store.length < initialLen)
}
