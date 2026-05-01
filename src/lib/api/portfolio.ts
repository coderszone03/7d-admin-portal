import client from './client'
import { getCookie } from '../utils/cookies'
import { AUTH_COOKIE_KEY } from '../../features/auth/constants'
import type {
  Project,
  ProjectCategoryValue,
  ProjectDetailsStepPayload,
} from '../../components/portfolio/projects/types'

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

const PORTFOLIOS_LIST_ENDPOINT = '/api/admin/portfolios'
const PORTFOLIO_ITEM_ENDPOINT = '/api/admin/portfolio'
const PORTFOLIO_CREATE_ENDPOINT = '/api/admin/portfolio/create'
const PORTFOLIO_UPDATE_ENDPOINT = '/api/admin/portfolio/update'

const extractList = (body: unknown): unknown[] => {
  if (Array.isArray(body)) return body
  const b = body as any
  if (Array.isArray(b?.data)) return b.data
  if (Array.isArray(b?.items)) return b.items
  if (Array.isArray(b?.portfolios)) return b.portfolios
  if (Array.isArray(b?.data?.portfolios)) return b.data.portfolios
  return []
}

const extractSingle = (body: unknown): unknown => {
  if (!body || typeof body !== 'object') return body
  const b = body as any
  if (b.data && typeof b.data === 'object' && !Array.isArray(b.data)) return b.data
  if (b.portfolio && typeof b.portfolio === 'object') return b.portfolio
  return b
}

const isValidCategory = (v: unknown): v is ProjectCategoryValue =>
  v === 'branding' || v === 'video' || v === 'uiux' || v === 'ad'

const toStringOrEmpty = (v: unknown): string => (v === null || v === undefined ? '' : String(v))

const coerceKeywords = (raw: unknown): string[] => {
  if (Array.isArray(raw)) {
    return raw.map((k) => String(k)).filter((k) => k.trim().length > 0)
  }
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
  }
  return []
}

const emptyToNull = (value: string): string | null => (value ? value : null)

const toBool = (v: unknown): boolean => {
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v === 1
  if (typeof v === 'string') return v === '1' || v.toLowerCase() === 'true'
  return false
}

const normaliseProject = (raw: unknown, fallbackId: string): Project | null => {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const v = raw as Record<string, any>

  const idSource = v.id ?? v.portfolio_id ?? v._id ?? fallbackId
  const id = String(idSource)

  const title = toStringOrEmpty(v.title ?? v.name) || 'Untitled project'

  const categoryRaw = v.category ?? v.type
  const category: ProjectCategoryValue = isValidCategory(categoryRaw) ? categoryRaw : 'branding'

  const year = toStringOrEmpty(v.year ?? new Date().getFullYear())
  const shortDescription = toStringOrEmpty(v.short_description ?? v.shortDescription ?? v.description)
  const overviewDescription = toStringOrEmpty(v.overview_description ?? v.overviewDescription)
  const scopeOfWork = toStringOrEmpty(v.scope_of_work ?? v.scopeOfWork)
  const industries = toStringOrEmpty(v.industries ?? v.industry)
  const keywords = coerceKeywords(v.keywords)

  const thumbnailUrl = toStringOrEmpty(
    v.thumbnail_preview ?? v.thumbnail_url ?? v.thumbnail ?? v.thumbnailUrl,
  )
  const clientMockupUrl = emptyToNull(
    toStringOrEmpty(
      v.client_mockup_preview ?? v.client_mockup_url ?? v.client_mockup ?? v.clientMockupUrl,
    ),
  )
  const brandingMockupUrl = emptyToNull(
    toStringOrEmpty(
      v.branding_mockup_preview ?? v.branding_mockup_url ?? v.branding_mockup ?? v.brandingMockupUrl,
    ),
  )
  const brandingMockupSecondaryUrl = emptyToNull(
    toStringOrEmpty(
      v.branding_mockup_secondary_preview ??
        v.branding_mockup_secondary_url ??
        v.branding_mockup_secondary ??
        v.brandingMockupSecondaryUrl,
    ),
  )
  const landscapeMockupUrl = emptyToNull(
    toStringOrEmpty(
      v.landscape_mockup_preview ?? v.landscape_mockup_url ?? v.landscapeMockupUrl,
    ),
  )
  const websiteMockupUrl = emptyToNull(
    toStringOrEmpty(v.website_mockup_preview ?? v.website_mockup_url ?? v.websiteMockupUrl),
  )
  const footerMockupUrl = emptyToNull(
    toStringOrEmpty(v.footer_mockup_preview ?? v.footer_mockup_url ?? v.footerMockupUrl),
  )

  const primaryColor = toStringOrEmpty(v.primary_color ?? v.primaryColor) || '#2A2A76'
  const secondaryColor = toStringOrEmpty(v.secondary_color ?? v.secondaryColor) || '#C3C3C3'
  const accentColor = toStringOrEmpty(v.accent_color ?? v.accentColor) || '#EF5A2B'

  const badgeName = toStringOrEmpty(v.badge_name ?? v.badgeName)
  const brandTitle = toStringOrEmpty(v.brand_title ?? v.brandTitle)
  const brandDescription = toStringOrEmpty(v.brand_description ?? v.brandDescription)

  const websiteUrl = toStringOrEmpty(v.website_url ?? v.websiteUrl)
  const websiteTitle = toStringOrEmpty(v.website_title ?? v.websiteTitle)
  const websiteDescription = toStringOrEmpty(v.website_description ?? v.websiteDescription)
  const isWebsiteEnabled = toBool(v.is_website_enabled ?? v.isWebsiteEnabled)

  const testimonialFeedback = toStringOrEmpty(v.testimonial_feedback ?? v.testimonialFeedback)
  const testimonialClientName = toStringOrEmpty(
    v.testimonial_client_name ?? v.testimonialClientName,
  )
  const testimonialDesignation = toStringOrEmpty(
    v.testimonial_designation ?? v.testimonialDesignation,
  )

  const createdAt = toStringOrEmpty(v.created_at ?? v.createdAt) || new Date().toISOString()
  const updatedAt = toStringOrEmpty(v.updated_at ?? v.updatedAt) || createdAt

  return {
    id,
    title,
    year,
    category,
    shortDescription,
    overviewDescription,
    scopeOfWork,
    industries,
    keywords,
    thumbnailUrl,
    clientMockupUrl,
    brandingMockupUrl,
    brandingMockupSecondaryUrl,
    landscapeMockupUrl,
    websiteMockupUrl,
    footerMockupUrl,
    primaryColor,
    secondaryColor,
    accentColor,
    badgeName,
    brandTitle,
    brandDescription,
    websiteUrl,
    websiteTitle,
    websiteDescription,
    isWebsiteEnabled,
    testimonialFeedback,
    testimonialClientName,
    testimonialDesignation,
    createdAt,
    updatedAt,
  }
}

const BACKEND_ORIGIN = 'https://7ddesign-backend.maverickz.online'

// In dev, rewrite absolute backend URLs to relative paths so Vite's proxy handles them
// (avoids CORS on /storage/*). In prod they stay absolute.
const toProxiedUrl = (url: string): string => {
  if (!url) return url
  if (import.meta.env.DEV && url.startsWith(BACKEND_ORIGIN)) {
    return url.slice(BACKEND_ORIGIN.length)
  }
  return url
}

const urlToBlob = async (url: string): Promise<Blob | null> => {
  if (!url) return null
  try {
    const res = await fetch(toProxiedUrl(url))
    if (!res.ok) return null
    return await res.blob()
  } catch {
    return null
  }
}

// Load an image via <img crossorigin="anonymous"> and export via canvas.
// Bypasses the CORS preflight that fetch() triggers — works as long as the server
// responds with `Access-Control-Allow-Origin: *` on the image resource (the backend's
// /storage/* route does). In dev, route through the Vite proxy for speed.
const imageUrlToBlobViaCanvas = (url: string, mime = 'image/png'): Promise<Blob | null> =>
  new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(null)
          return
        }
        ctx.drawImage(img, 0, 0)
        canvas.toBlob(
          (blob) => resolve(blob),
          mime,
          mime === 'image/jpeg' ? 0.9 : undefined,
        )
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = toProxiedUrl(url)
  })

const extensionForMime = (mime: string): string => {
  switch (mime) {
    case 'image/png':
      return 'png'
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    default:
      return 'bin'
  }
}

const appendImageFromPreview = async (
  form: FormData,
  field: string,
  preview: string,
): Promise<void> => {
  if (!preview) return
  let blob: Blob | null = null
  if (preview.startsWith('data:')) {
    // Freshly picked file from the file input — convert the data URL via fetch().
    blob = await urlToBlob(preview)
  } else {
    // Existing backend URL (e.g. /storage/*). Use the canvas path to bypass the
    // CORS preflight that fetch() triggers, so the edit flow keeps working.
    blob = await imageUrlToBlobViaCanvas(preview, 'image/png')
  }
  if (!blob) return
  const ext = extensionForMime(blob.type || 'image/png')
  const filename = `${field}.${ext}`
  form.append(field, blob, filename)
}

const buildFormData = async (
  payload: ProjectDetailsStepPayload,
  id?: string,
): Promise<FormData> => {
  const form = new FormData()

  if (id) {
    form.append('id', id)
  }

  form.append('category', payload.category)
  form.append('title', payload.title)
  form.append('short_description', payload.shortDescription)
  form.append('year', payload.year)
  form.append('overview_description', payload.overviewDescription)
  form.append('scope_of_work', payload.scopeOfWork)
  form.append('industries', payload.industries)
  form.append('primary_color', payload.primaryColor)
  form.append('secondary_color', payload.secondaryColor)
  form.append('accent_color', payload.accentColor)
  form.append('badge_name', payload.badgeName)
  form.append('brand_title', payload.brandTitle)
  form.append('brand_description', payload.brandDescription)
  form.append('website_url', payload.websiteUrl)
  form.append('website_title', payload.websiteTitle)
  form.append('website_description', payload.websiteDescription)
  form.append('is_website_enabled', payload.isWebsiteEnabled ? '1' : '0')
  form.append('testimonial_feedback', payload.testimonialFeedback)
  form.append('testimonial_client_name', payload.testimonialClientName)
  form.append('testimonial_designation', payload.testimonialDesignation)
  form.append('status', '1')

  payload.keywords.forEach((keyword) => {
    form.append('keywords[]', keyword)
  })

  await Promise.all([
    appendImageFromPreview(form, 'thumbnail_file', payload.thumbnailDataUrl),
    appendImageFromPreview(form, 'client_mockup_file', payload.clientMockupDataUrl),
    appendImageFromPreview(form, 'branding_mockup_file', payload.brandingMockupDataUrl),
    appendImageFromPreview(
      form,
      'branding_mockup_secondary_file',
      payload.brandingMockupSecondaryDataUrl,
    ),
    appendImageFromPreview(form, 'landscape_mockup_file', payload.landscapeMockupDataUrl),
    appendImageFromPreview(form, 'website_mockup_file', payload.websiteMockupDataUrl),
    appendImageFromPreview(form, 'footer_mockup_file', payload.footerMockupDataUrl),
  ])

  return form
}

export const fetchPortfolios = async (perPage = 50): Promise<Project[]> => {
  const response = await client.get(PORTFOLIOS_LIST_ENDPOINT, {
    params: { per_page: perPage },
    headers: { ...getAuthHeader() },
  })
  const list = extractList(response.data)
  return list
    .map((item, index) => normaliseProject(item, `portfolio-${index + 1}`))
    .filter((item): item is Project => Boolean(item))
}

export const fetchPortfolioById = async (id: string): Promise<Project | null> => {
  const response = await client.get(`${PORTFOLIO_ITEM_ENDPOINT}/${encodeURIComponent(id)}`, {
    headers: { ...getAuthHeader() },
  })
  const raw = extractSingle(response.data)
  return normaliseProject(raw, id)
}

export const createPortfolio = async (payload: ProjectDetailsStepPayload): Promise<void> => {
  const form = await buildFormData(payload)
  await client.post(PORTFOLIO_CREATE_ENDPOINT, form, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': undefined,
    },
  })
}

export const updatePortfolio = async (
  id: string,
  payload: ProjectDetailsStepPayload,
): Promise<void> => {
  const form = await buildFormData(payload, id)
  await client.post(PORTFOLIO_UPDATE_ENDPOINT, form, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': undefined,
    },
  })
}

export const deletePortfolio = async (id: string): Promise<void> => {
  await client.delete(`${PORTFOLIO_ITEM_ENDPOINT}/${encodeURIComponent(id)}`, {
    headers: { ...getAuthHeader() },
  })
}
