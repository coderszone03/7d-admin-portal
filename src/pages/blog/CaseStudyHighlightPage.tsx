import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import {
  validateImageDimensions,
  validatePreviewDimensions,
} from '../../components/portfolio/projects/types'
import {
  CASE_STUDY_IMAGE_MAX_SIZE,
  CASE_STUDY_IMAGE_MIME_TYPES,
  CASE_STUDY_IMAGE_SPEC,
  MAX_CASE_STUDY_DESCRIPTION_LENGTH,
} from '../../components/blog/caseStudy/types'
import {
  fetchCaseStudyHighlight,
  saveCaseStudyHighlight,
} from '../../lib/api/caseStudyHighlight'

const primaryButtonClasses =
  'inline-flex h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_28px_-20px_rgba(99,102,241,0.9)] transition hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-60'

const CaseStudyHighlightPage = () => {
  const [description, setDescription] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  // The data URL of a newly picked file (vs. a previously saved remote/stored URL).
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string>('')

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errors, setErrors] = useState<{
    image?: string
    description?: string
    form?: string
  }>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      setIsLoading(true)
      setLoadError(null)
      try {
        const data = await fetchCaseStudyHighlight()
        if (!isMounted) return
        setDescription(data.description)
        setImagePreview(data.imageUrl || null)
        setUpdatedAt(data.updatedAt)
      } catch (error) {
        if (!isMounted) return
        setLoadError(
          error instanceof Error ? error.message : 'Unable to load the case study highlight.',
        )
      } finally {
        if (isMounted) setIsLoading(false)
      }
    })()
    return () => {
      isMounted = false
    }
  }, [])

  const isTypeAllowed = (file: File) => {
    const mime = file.type.toLowerCase()
    const extension = file.name.split('.').pop()?.toLowerCase()
    return (
      CASE_STUDY_IMAGE_MIME_TYPES.includes(mime) ||
      (extension ? ['png', 'jpg', 'jpeg', 'webp'].includes(extension) : false)
    )
  }

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const file = input.files?.[0] ?? null

    if (!file) return

    if (!isTypeAllowed(file)) {
      setErrors((prev) => ({ ...prev, image: 'Image must be a PNG, JPG, or WebP.' }))
      input.value = ''
      return
    }

    if (file.size > CASE_STUDY_IMAGE_MAX_SIZE) {
      setErrors((prev) => ({ ...prev, image: 'Image must be 2MB or smaller.' }))
      input.value = ''
      return
    }

    const dimensionCheck = await validateImageDimensions(file, CASE_STUDY_IMAGE_SPEC)
    if (!dimensionCheck.ok) {
      setErrors((prev) => ({ ...prev, image: dimensionCheck.error }))
      input.value = ''
      return
    }

    setErrors((prev) => ({ ...prev, image: undefined }))
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setImagePreview(result)
      setPendingImage(result)
    }
    reader.readAsDataURL(file)
  }

  const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value)
    setErrors((prev) => ({ ...prev, description: undefined }))
  }

  const formatDate = (iso: string) => {
    if (!iso) return null
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatusMessage(null)

    const nextErrors: typeof errors = {}
    const trimmedDescription = description.trim()

    if (!imagePreview) {
      nextErrors.image = 'A case study image is required.'
    }
    if (!trimmedDescription) {
      nextErrors.description = 'Description is required.'
    } else if (trimmedDescription.length > MAX_CASE_STUDY_DESCRIPTION_LENGTH) {
      nextErrors.description = `Description must be at most ${MAX_CASE_STUDY_DESCRIPTION_LENGTH} characters.`
    }

    if (nextErrors.image || nextErrors.description) {
      setErrors(nextErrors)
      return
    }

    // If the saved image is being kept (no new upload), re-check its 502×303 orientation
    // so an older off-spec image can't slip through a description-only save.
    if (!pendingImage && imagePreview) {
      const dimensionCheck = await validatePreviewDimensions(imagePreview, CASE_STUDY_IMAGE_SPEC)
      if (!dimensionCheck.ok) {
        setErrors((prev) => ({ ...prev, image: dimensionCheck.error }))
        return
      }
    }

    setIsSaving(true)
    setErrors({})
    try {
      const saved = await saveCaseStudyHighlight({
        imageUrl: imagePreview ?? '',
        description: trimmedDescription,
      })
      setUpdatedAt(saved.updatedAt)
      setPendingImage(null)
      setStatusMessage('Case study highlight saved.')
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        form:
          error instanceof Error
            ? error.message
            : 'Could not save the case study highlight. Please try again.',
      }))
    } finally {
      setIsSaving(false)
    }
  }

  const lastUpdatedLabel = formatDate(updatedAt)

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-surface p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.25em] text-text-muted">Blog</p>
          <h1 className="text-2xl font-semibold text-text-secondary">Case Study Highlight</h1>
          <p className="max-w-2xl text-sm text-text-muted">
            This image and text appear on the public blog page, just above the “Case Studies”
            button. Use a 502×303 landscape image to match the site layout.
          </p>
        </div>
        {lastUpdatedLabel ? (
          <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-text-secondary">
            Updated {lastUpdatedLabel}
          </span>
        ) : null}
      </header>

      {statusMessage ? (
        <div className="inline-flex items-center gap-2 rounded-xl border border-success/40 bg-success/10 px-4 py-2 text-xs font-medium text-success">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-4 w-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          {statusMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-3xl border border-border/60 bg-surface/60 p-8 text-center text-sm text-text-muted">
          Loading case study highlight…
        </div>
      ) : loadError ? (
        <div className="rounded-3xl border border-error/40 bg-error/10 p-8 text-center text-sm text-error">
          {loadError}
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start"
          noValidate
        >
          <div className="space-y-6 rounded-3xl border border-border/60 bg-surface/80 p-6">
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
                  Case study image (502×303)
                </p>
              </div>
              <div className="relative flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border/60 bg-background/70 p-6 text-center transition hover:border-accent/50 focus-within:border-accent/60">
                <div className="aspect-[502/303] w-full max-w-md overflow-hidden rounded-2xl border border-border/60 bg-surface-muted">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Case study highlight preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        className="h-10 w-10 text-text-muted"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5V19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2.5M3 16.5l4.5-4.5a1.414 1.414 0 0 1 2 0L15 15m-12 1.5 3-3a1.414 1.414 0 0 1 2 0L17 15m0 0 3-3m-7.5-8.25h-3A2.25 2.25 0 0 0 7.25 6v0A2.25 2.25 0 0 0 9.5 8.25h3A2.25 2.25 0 0 0 14.75 6v0A2.25 2.25 0 0 0 12.5 3.75Z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-text-secondary">
                    {imagePreview ? 'Replace the image' : 'Upload the case study image'}
                  </p>
                  <p className="text-xs text-text-muted">
                    Landscape 502×303 (1.66:1) · PNG, JPG, or WebP · up to 2MB.
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border/60 bg-surface px-4 py-2 text-xs font-semibold text-text-secondary shadow-sm transition hover:border-accent hover:text-accent">
                  Browse files
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={isSaving}
                  />
                </label>
              </div>
              {errors.image ? (
                <p className="text-xs font-medium text-error">{errors.image}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="case-study-description"
                  className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted"
                >
                  Description
                </label>
                <span className="text-[11px] text-text-muted/80">
                  {description.length}/{MAX_CASE_STUDY_DESCRIPTION_LENGTH}
                </span>
              </div>
              <textarea
                id="case-study-description"
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Short copy shown above the Case Studies button."
                maxLength={MAX_CASE_STUDY_DESCRIPTION_LENGTH}
                rows={5}
                className="w-full rounded-lg border border-border/60 bg-background/70 px-4 py-3 text-sm text-text-secondary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                disabled={isSaving}
              />
              {errors.description ? (
                <p className="text-xs font-medium text-error">{errors.description}</p>
              ) : null}
            </div>

            {errors.form ? (
              <p className="rounded-xl border border-error/50 bg-error/10 px-3 py-2 text-xs text-error">
                {errors.form}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="submit" className={primaryButtonClasses} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save highlight'}
              </button>
            </div>
          </div>

          {/* Live preview replica of the public block above the Case Studies button */}
          <div className="space-y-3 lg:sticky lg:top-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
              Preview
            </p>
            <div className="overflow-hidden rounded-3xl border border-border/60 bg-surface p-6">
              <div className="aspect-[502/303] w-full overflow-hidden rounded-2xl border border-border/60 bg-surface-muted">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-text-muted">
                    Image preview
                  </div>
                )}
              </div>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-text-secondary/80">
                {description.trim() || 'Your case study description will appear here.'}
              </p>
              <button
                type="button"
                disabled
                className="mt-5 inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white opacity-80"
              >
                Case Studies
              </button>
            </div>
            <p className="text-[11px] text-text-muted">
              The “Case Studies” button is part of the public site and shown here for context
              only.
            </p>
          </div>
        </form>
      )}
    </section>
  )
}

export default CaseStudyHighlightPage
