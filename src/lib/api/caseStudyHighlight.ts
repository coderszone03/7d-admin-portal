import type { CaseStudyHighlight } from '../../components/blog/caseStudy/types'

// Dummy-store phase: the Case Study highlight is a single record persisted in
// localStorage so it survives reloads. Signatures mirror the eventual backend so the
// only thing that changes later is the body of these two functions (swap to axios).
const STORAGE_KEY = '7d-admin:blog:case-study-highlight'
const FAKE_LATENCY_MS = 200

const wait = <T>(value: T): Promise<T> =>
  new Promise((resolve) => window.setTimeout(() => resolve(value), FAKE_LATENCY_MS))

const emptyHighlight = (): CaseStudyHighlight => ({
  imageUrl: '',
  description: '',
  updatedAt: '',
})

const readStore = (): CaseStudyHighlight => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyHighlight()
    const parsed = JSON.parse(raw) as Partial<CaseStudyHighlight>
    return {
      imageUrl: typeof parsed.imageUrl === 'string' ? parsed.imageUrl : '',
      description: typeof parsed.description === 'string' ? parsed.description : '',
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    }
  } catch {
    return emptyHighlight()
  }
}

export const fetchCaseStudyHighlight = async (): Promise<CaseStudyHighlight> => {
  return wait(readStore())
}

export type CaseStudyHighlightPayload = {
  imageUrl: string
  description: string
}

export const saveCaseStudyHighlight = async (
  payload: CaseStudyHighlightPayload,
): Promise<CaseStudyHighlight> => {
  const next: CaseStudyHighlight = {
    imageUrl: payload.imageUrl,
    description: payload.description,
    updatedAt: new Date().toISOString(),
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Non-fatal — storage may be unavailable (private mode); the value still returns.
  }
  return wait(next)
}
