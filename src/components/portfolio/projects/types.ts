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
