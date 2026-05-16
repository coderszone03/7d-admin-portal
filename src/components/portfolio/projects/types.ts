export type ProjectCategoryValue = 'branding' | 'video' | 'uiux' | 'ad'

export type ProjectKeywordOption = {
  value: string
  label: string
}

export type Project = {
  id: string
  title: string
  year: string
  category: ProjectCategoryValue
  shortDescription: string
  overviewDescription: string
  scopeOfWork: string
  industries: string
  keywords: string[]
  thumbnailUrl: string
  clientMockupUrl: string | null
  brandingMockupUrl: string | null
  brandingMockupSecondaryUrl: string | null
  landscapeMockupUrl: string | null
  websiteMockupUrl: string | null
  footerMockupUrl: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  badgeName: string
  brandTitle: string
  brandDescription: string
  websiteUrl: string
  websiteTitle: string
  websiteDescription: string
  isWebsiteEnabled: boolean
  testimonialFeedback: string
  testimonialClientName: string
  testimonialDesignation: string
  createdAt: string
  updatedAt: string
}

export type ProjectDetailsFormValues = {
  title: string
  year: string
  category: ProjectCategoryValue | ''
  shortDescription: string
  overviewDescription: string
  scopeOfWork: string
  industries: string
  keywords: string[]
  primaryColor: string
  secondaryColor: string
  accentColor: string
  badgeName: string
  brandTitle: string
  brandDescription: string
  landscapeMockupPreview: string | null
  websiteMockupPreview: string | null
  websiteUrl: string
  websiteTitle: string
  websiteDescription: string
  isWebsiteEnabled: boolean
  testimonialFeedback: string
  testimonialClientName: string
  testimonialDesignation: string
  footerMockupPreview: string | null
  thumbnailFile: File | null
  thumbnailPreview: string | null
  clientMockupFile: File | null
  clientMockupPreview: string | null
  brandingMockupFile: File | null
  brandingMockupPreview: string | null
  brandingMockupSecondaryFile: File | null
  brandingMockupSecondaryPreview: string | null
}

export type ProjectMediaField = 'clientMockup' | 'brandingMockup' | 'brandingMockupSecondary'

export type ProjectDetailsStepPayload = {
  title: string
  year: string
  category: ProjectCategoryValue
  shortDescription: string
  overviewDescription: string
  scopeOfWork: string
  industries: string
  keywords: string[]
  thumbnailDataUrl: string
  clientMockupDataUrl: string
  brandingMockupDataUrl: string
  brandingMockupSecondaryDataUrl: string
  // Extended fields — carried from the form to the API layer.
  primaryColor: string
  secondaryColor: string
  accentColor: string
  badgeName: string
  brandTitle: string
  brandDescription: string
  landscapeMockupDataUrl: string
  websiteMockupDataUrl: string
  footerMockupDataUrl: string
  websiteUrl: string
  websiteTitle: string
  websiteDescription: string
  isWebsiteEnabled: boolean
  testimonialFeedback: string
  testimonialClientName: string
  testimonialDesignation: string
}

export const PROJECT_CATEGORY_OPTIONS: Array<{
  label: string
  value: ProjectCategoryValue
}> = [
  { label: 'Brand', value: 'branding' },
  { label: 'Video', value: 'video' },
  { label: 'UI/UX', value: 'uiux' },
  { label: 'Ad', value: 'ad' },
]

export const PROJECT_KEYWORD_OPTIONS: ProjectKeywordOption[] = [
  { value: 'branding', label: 'Branding' },
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'motion', label: 'Motion' },
  { value: 'product-launch', label: 'Product Launch' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'digital', label: 'Digital' },
  { value: 'identity', label: 'Identity' },
  { value: 'prototype', label: 'Prototype' },
  { value: 'case-study', label: 'Case Study' },
  { value: 'animation', label: 'Animation' },
  { value: 'art-direction', label: 'Art Direction' },
  { value: 'packaging', label: 'Packaging' },
]

export const MAX_KEYWORDS = 10
export const MAX_DESCRIPTION_LENGTH = 200
export const MAX_OVERVIEW_LENGTH = 300
export const MAX_THUMBNAIL_SIZE = 2 * 1024 * 1024
export const MAX_MEDIA_ASSET_SIZE = 2 * 1024 * 1024
export const MEDIA_UPLOAD_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
]

export const getCategoryLabel = (value: ProjectCategoryValue) => {
  const match = PROJECT_CATEGORY_OPTIONS.find((option) => option.value === value)
  return match ? match.label : value
}

export type ProjectImageSlot =
  | 'thumbnail'
  | 'clientMockup'
  | 'brandingMockup'
  | 'brandingMockupSecondary'
  | 'landscapeMockup'
  | 'websiteMockup'
  | 'footerMockup'

export type ImageSpec = {
  label: string
  width: number
  height: number
}

// Reference dimensions taken from the public site case-study layout.
// Validation accepts files at or above these dimensions whose aspect ratio matches within ±3%.
export const IMAGE_SPECS: Record<ProjectImageSlot, ImageSpec> = {
  thumbnail: { label: 'Thumbnail', width: 757, height: 464 },
  clientMockup: { label: 'Client mockup', width: 817, height: 400 },
  brandingMockup: { label: 'Branding mockup', width: 770, height: 770 },
  brandingMockupSecondary: { label: 'Secondary branding mockup', width: 770, height: 770 },
  landscapeMockup: { label: 'Landscape mockup', width: 817, height: 502 },
  websiteMockup: { label: 'Website mockup', width: 817, height: 502 },
  footerMockup: { label: 'Footer brand strip', width: 408, height: 280 },
}

const ASPECT_RATIO_TOLERANCE = 0.03

export type ImageValidationResult =
  | { ok: true; width: number; height: number }
  | { ok: false; error: string }

const checkDimensions = (width: number, height: number, spec: ImageSpec): ImageValidationResult => {
  if (width < spec.width || height < spec.height) {
    return {
      ok: false,
      error: `${spec.label} must be at least ${spec.width}×${spec.height}px (uploaded ${width}×${height}px).`,
    }
  }

  const expectedRatio = spec.width / spec.height
  const actualRatio = width / height
  const ratioDelta = Math.abs(actualRatio / expectedRatio - 1)
  if (ratioDelta > ASPECT_RATIO_TOLERANCE) {
    return {
      ok: false,
      error: `${spec.label} must use a ${spec.width}:${spec.height} aspect ratio (uploaded ${width}×${height}px).`,
    }
  }

  return { ok: true, width, height }
}

export const validateImageDimensions = (
  file: File,
  spec: ImageSpec,
): Promise<ImageValidationResult> =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const result = checkDimensions(img.naturalWidth, img.naturalHeight, spec)
      URL.revokeObjectURL(url)
      resolve(result)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ ok: false, error: `${spec.label} could not be read. Please try a different image.` })
    }
    img.src = url
  })

// Validates an in-memory preview (data URL or http URL) against a spec.
// Used to re-check existing images at submit time, since edit-mode pre-loads
// previews directly without going through the file change handler.
export const validatePreviewDimensions = (
  preview: string,
  spec: ImageSpec,
): Promise<ImageValidationResult> =>
  new Promise((resolve) => {
    if (!preview) {
      resolve({ ok: false, error: `${spec.label} is required.` })
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      resolve(checkDimensions(img.naturalWidth, img.naturalHeight, spec))
    }
    img.onerror = () => {
      // If the image can't even load, surface a clear error (e.g. CORS or 404).
      resolve({ ok: false, error: `${spec.label} could not be read. Please re-upload the image.` })
    }
    img.src = preview
  })
