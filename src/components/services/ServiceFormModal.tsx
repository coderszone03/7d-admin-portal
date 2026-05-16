import { useEffect, useRef, useState, type FormEvent } from 'react'
import Modal from '../common/Modal'
import { validateImageDimensions } from '../portfolio/projects/types'
import {
  IMAGE_MIME_TYPES,
  MAX_DESCRIPTION_LENGTH,
  MAX_IMAGE_SIZE,
  MAX_LONG_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
  SERVICE_IMAGE_SPEC,
  slugify,
  type Service,
  type ServiceFormPayload,
  type ServiceFormValues,
} from './types'

type ServiceFormModalProps = {
  isOpen: boolean
  mode: 'create' | 'edit'
  initialService: Service | null
  existingSlugs: string[]
  onClose: () => void
  onSubmit: (payload: ServiceFormPayload) => Promise<void> | void
}

type FieldErrorKey =
  | 'title'
  | 'slug'
  | 'description'
  | 'longDescription'
  | 'image'
  | 'displayOrder'

const defaultValues: ServiceFormValues = {
  title: '',
  slug: '',
  description: '',
  longDescription: '',
  imageFile: null,
  imagePreview: null,
  status: 1,
  displayOrder: 1,
}

const buildInitialValues = (item: Service | null): ServiceFormValues => {
  if (!item) return { ...defaultValues }
  return {
    title: item.title,
    slug: item.slug,
    description: item.description,
    longDescription: item.longDescription,
    imageFile: null,
    imagePreview: item.imageUrl || null,
    status: item.status,
    displayOrder: item.displayOrder,
  }
}

const readFileAsDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })

const steps = [
  {
    id: 'basics',
    label: 'Basics',
    description: 'Title, slug, short description, and visibility.',
  },
  {
    id: 'content',
    label: 'Content & media',
    description: 'Long description, card image, and order.',
  },
]

const ServiceFormModal = ({
  isOpen,
  mode,
  initialService,
  existingSlugs,
  onClose,
  onSubmit,
}: ServiceFormModalProps) => {
  const [values, setValues] = useState<ServiceFormValues>(() =>
    buildInitialValues(initialService),
  )
  const [errors, setErrors] = useState<Partial<Record<FieldErrorKey, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setSubmitting] = useState(false)
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const imageInputResetToken = useRef(0)
  const longDescRef = useRef<HTMLTextAreaElement>(null)
  const [isLongDescHovered, setIsLongDescHovered] = useState(false)
  const [longDescHasOverflow, setLongDescHasOverflow] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setValues(buildInitialValues(initialService))
    setSlugManuallyEdited(Boolean(initialService))
    setErrors({})
    setFormError(null)
    setActiveStepIndex(0)
    imageInputResetToken.current += 1
  }, [initialService, isOpen])

  // Auto-derive slug from title (only when user hasn't manually touched the slug field).
  useEffect(() => {
    if (slugManuallyEdited) return
    setValues((prev) => ({ ...prev, slug: slugify(prev.title) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.title])

  useEffect(() => {
    const el = longDescRef.current
    if (!el) return
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 24
    const paddingY =
      parseFloat(getComputedStyle(el).paddingTop) +
      parseFloat(getComputedStyle(el).paddingBottom)
    const maxHeight = lineHeight * 8 + paddingY
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
    setLongDescHasOverflow(el.scrollHeight > maxHeight)
  }, [values.longDescription, activeStepIndex])

  const handleImageChange = async (file: File | null) => {
    if (!file) {
      setValues((prev) => ({
        ...prev,
        imageFile: null,
        imagePreview: initialService?.imageUrl ?? null,
      }))
      setErrors((prev) => ({ ...prev, image: undefined }))
      imageInputResetToken.current += 1
      return
    }

    const mime = file.type.toLowerCase()
    if (!IMAGE_MIME_TYPES.includes(mime)) {
      setErrors((prev) => ({ ...prev, image: 'Image must be PNG, JPG, or WebP.' }))
      imageInputResetToken.current += 1
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setErrors((prev) => ({ ...prev, image: 'Image must be 2MB or smaller.' }))
      imageInputResetToken.current += 1
      return
    }

    const dimensionCheck = await validateImageDimensions(file, SERVICE_IMAGE_SPEC)
    if (!dimensionCheck.ok) {
      setErrors((prev) => ({ ...prev, image: dimensionCheck.error }))
      imageInputResetToken.current += 1
      return
    }

    try {
      const preview = await readFileAsDataURL(file)
      setValues((prev) => ({ ...prev, imageFile: file, imagePreview: preview }))
      setErrors((prev) => ({ ...prev, image: undefined }))
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        image: err instanceof Error ? err.message : 'Failed to process image.',
      }))
    }
  }

  const validateStep = (index: number): Partial<Record<FieldErrorKey, string>> => {
    const next: Partial<Record<FieldErrorKey, string>> = {}
    if (index === 0) {
      if (!values.title.trim()) next.title = 'Title is required.'
      else if (values.title.length > MAX_TITLE_LENGTH)
        next.title = `Keep the title under ${MAX_TITLE_LENGTH} characters.`

      if (!values.slug.trim()) next.slug = 'Slug is required.'
      else if (!/^[a-z0-9-]+$/.test(values.slug))
        next.slug = 'Slug can only contain lowercase letters, digits, and hyphens.'
      else if (
        existingSlugs.some(
          (s) => s === values.slug && s !== initialService?.slug,
        )
      )
        next.slug = 'Slug is already in use.'

      if (!values.description.trim()) next.description = 'Short description is required.'
      else if (values.description.length > MAX_DESCRIPTION_LENGTH)
        next.description = `Keep the description under ${MAX_DESCRIPTION_LENGTH} characters.`
    } else if (index === 1) {
      if (values.longDescription.length > MAX_LONG_DESCRIPTION_LENGTH)
        next.longDescription = `Keep the body under ${MAX_LONG_DESCRIPTION_LENGTH} characters.`
      if (!values.imagePreview) next.image = 'Upload a 600×600 service image.'
      if (!Number.isFinite(values.displayOrder) || values.displayOrder < 1)
        next.displayOrder = 'Display order must be 1 or higher.'
    }
    return next
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return
    setFormError(null)

    if (activeStepIndex === 0) {
      const stepErrors = validateStep(0)
      if (Object.values(stepErrors).some(Boolean)) {
        setErrors(stepErrors)
        return
      }
      setErrors({})
      setActiveStepIndex(1)
      return
    }

    const allErrors = { ...validateStep(0), ...validateStep(1) }
    if (Object.values(allErrors).some(Boolean)) {
      setErrors(allErrors)
      setFormError('Some required fields are missing. Please go back and fix them.')
      return
    }

    setErrors({})
    setSubmitting(true)
    try {
      const payload: ServiceFormPayload = {
        title: values.title.trim(),
        slug: values.slug.trim(),
        description: values.description.trim(),
        longDescription: values.longDescription.trim(),
        imageDataUrl: values.imageFile ? values.imagePreview ?? '' : '',
        status: values.status,
        displayOrder: values.displayOrder,
      }
      await onSubmit(payload)
      onClose()
      setValues(buildInitialValues(null))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save service.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20'
  const labelClass = 'text-xs font-semibold uppercase tracking-[0.16em] text-text-muted'
  const errorClass = 'mt-1 text-xs text-error'

  const longDescOverflowClass =
    isLongDescHovered && longDescHasOverflow ? 'overflow-y-auto' : 'overflow-hidden'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      fullScreen
      className="overflow-hidden"
      overlayClassName="bg-black/40 dark:bg-black/70"
    >
      <div className="flex h-full flex-col overflow-hidden bg-background lg:flex-row">
        <aside className="hidden w-full max-w-[320px] flex-col border-b border-border/60 bg-surface px-8 py-10 text-text-primary lg:flex lg:border-b-0 lg:border-r">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-text-muted">
              {mode === 'create' ? 'New Service' : 'Edit Service'}
            </p>
            <h2 className="mt-3 text-3xl font-semibold">Service Builder</h2>
            <p className="mt-3 text-sm text-text-muted">
              Manage what appears on the public services grid and the navbar dropdown.
            </p>
          </div>
          <ol className="mt-10 space-y-7">
            {steps.map((step, index) => {
              const isCurrent = index === activeStepIndex
              const isCompleted = index < activeStepIndex
              return (
                <li key={step.id} className="relative pl-10">
                  <span
                    className={[
                      'absolute left-0 top-0 inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold transition',
                      isCurrent
                        ? 'border-accent bg-accent/15 text-accent'
                        : isCompleted
                          ? 'border-accent/50 bg-accent/10 text-accent'
                          : 'border-border bg-background text-text-muted',
                    ].join(' ')}
                  >
                    {index + 1}
                  </span>
                  {index < steps.length - 1 ? (
                    <span className="absolute left-3.5 top-8 bottom-[-28px] w-px bg-border" aria-hidden="true" />
                  ) : null}
                  <p className={`text-sm font-semibold ${isCurrent ? 'text-text-primary' : 'text-text-secondary'}`}>
                    {step.label}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">{step.description}</p>
                </li>
              )
            })}
          </ol>
        </aside>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col bg-background">
          <header className="border-b border-border/60 px-5 py-5 sm:px-8 sm:py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-text-muted">
                  Step {activeStepIndex + 1} / {steps.length}
                </p>
                <h3 className="text-xl font-semibold text-text-primary sm:text-2xl">
                  {steps[activeStepIndex]?.label}
                </h3>
                <p className="text-xs text-text-muted sm:text-sm">
                  {steps[activeStepIndex]?.description}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center self-end rounded-xl border border-border/60 text-text-muted transition hover:border-accent hover:text-accent"
                aria-label="Close service form"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="h-5 w-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </header>

          <div className="flex flex-1 min-h-0 flex-col overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
            {activeStepIndex === 0 ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Title *</label>
                    <input
                      type="text"
                      value={values.title}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className={inputClass}
                      placeholder="e.g. Branding"
                      maxLength={MAX_TITLE_LENGTH + 5}
                    />
                    {errors.title ? <p className={errorClass}>{errors.title}</p> : null}
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Slug *</label>
                    <input
                      type="text"
                      value={values.slug}
                      onChange={(e) => {
                        setSlugManuallyEdited(true)
                        setValues((prev) => ({ ...prev, slug: e.target.value }))
                      }}
                      className={inputClass}
                      placeholder="e.g. branding"
                    />
                    {errors.slug ? (
                      <p className={errorClass}>{errors.slug}</p>
                    ) : (
                      <p className="text-[11px] text-text-muted">
                        Auto-derived from the title until you edit it.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={labelClass}>Short description *</label>
                    <span className="text-[11px] tabular-nums text-text-muted">
                      {values.description.length} / {MAX_DESCRIPTION_LENGTH}
                    </span>
                  </div>
                  <textarea
                    value={values.description}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={2}
                    placeholder="One-line summary used on the grid card and in the navbar dropdown."
                    className="w-full resize-none rounded-xl border border-border/60 bg-background px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                  {errors.description ? (
                    <p className={errorClass}>{errors.description}</p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Visibility</label>
                  <div className="flex gap-2">
                    {[
                      { value: 0 as const, label: 'Draft' },
                      { value: 1 as const, label: 'Live' },
                    ].map((option) => {
                      const isActive = values.status === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setValues((prev) => ({ ...prev, status: option.value }))
                          }
                          className={[
                            'flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition',
                            isActive
                              ? 'border-accent bg-accent/10 text-accent'
                              : 'border-border/60 bg-surface text-text-secondary hover:border-accent/60 hover:text-accent',
                          ].join(' ')}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[11px] text-text-muted">
                    Drafts are hidden from the public grid and dropdown.
                  </p>
                </div>
              </div>
            ) : null}

            {activeStepIndex === 1 ? (
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={labelClass}>Long description</label>
                    <span className="text-[11px] tabular-nums text-text-muted">
                      {values.longDescription.length} / {MAX_LONG_DESCRIPTION_LENGTH}
                    </span>
                  </div>
                  <textarea
                    ref={longDescRef}
                    value={values.longDescription}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        longDescription: e.target.value,
                      }))
                    }
                    onMouseEnter={() => setIsLongDescHovered(true)}
                    onMouseLeave={() => setIsLongDescHovered(false)}
                    rows={4}
                    placeholder="Body shown on the /services/:slug detail page. Plain text or markdown."
                    className={[
                      'w-full resize-none rounded-xl border border-border/60 bg-background px-3 py-2 text-sm leading-6 text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20',
                      longDescOverflowClass,
                    ].join(' ')}
                  />
                  {errors.longDescription ? (
                    <p className={errorClass}>{errors.longDescription}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Card image * (600×600)</label>
                  <div
                    className={[
                      'flex flex-col gap-4 rounded-2xl border-2 border-dashed bg-surface p-4 sm:flex-row sm:items-center',
                      values.imagePreview ? 'border-border/40' : 'border-border/60',
                      errors.image ? 'border-error/60' : '',
                    ].join(' ')}
                  >
                    <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-background">
                      {values.imagePreview ? (
                        <img
                          src={values.imagePreview}
                          alt="Service preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs text-text-muted">
                          No image
                        </span>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm text-text-secondary">
                        Upload a 600×600 PNG, JPG, or WebP. Max 2MB.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <label
                          htmlFor="service-image"
                          className="inline-flex cursor-pointer items-center rounded-xl border border-border/60 bg-background px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-accent hover:text-accent"
                        >
                          {values.imagePreview ? 'Replace image' : 'Upload image'}
                        </label>
                        {values.imagePreview ? (
                          <button
                            type="button"
                            onClick={() => handleImageChange(null)}
                            className="inline-flex items-center rounded-xl border border-border/60 bg-background px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-error/60 hover:text-error"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <input
                        id="service-image"
                        key={`image-${imageInputResetToken.current}`}
                        type="file"
                        accept={IMAGE_MIME_TYPES.join(',')}
                        className="hidden"
                        onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
                      />
                    </div>
                  </div>
                  {errors.image ? <p className={errorClass}>{errors.image}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Display order</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={values.displayOrder}
                    onChange={(e) => {
                      const v = Number.parseInt(e.target.value, 10)
                      setValues((prev) => ({
                        ...prev,
                        displayOrder: Number.isFinite(v) ? v : 1,
                      }))
                    }}
                    className={inputClass}
                  />
                  {errors.displayOrder ? (
                    <p className={errorClass}>{errors.displayOrder}</p>
                  ) : (
                    <p className="text-[11px] text-text-muted">
                      Lower numbers appear first in the grid and the navbar dropdown.
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            {formError ? (
              <p className="mt-6 rounded-2xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
                {formError}
              </p>
            ) : null}
          </div>

          <footer className="flex flex-col gap-3 border-t border-border/60 bg-background px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            {activeStepIndex === 0 ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-2xl border border-border/60 bg-surface px-4 py-2.5 text-sm font-semibold text-text-secondary transition hover:border-accent hover:text-accent"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setFormError(null)
                  setActiveStepIndex(0)
                }}
                className="inline-flex items-center justify-center rounded-2xl border border-border/60 bg-surface px-4 py-2.5 text-sm font-semibold text-text-secondary transition hover:border-accent hover:text-accent"
              >
                Back
              </button>
            )}
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              {activeStepIndex < steps.length - 1 ? (
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_32px_-20px_rgba(99,102,241,0.45)] transition hover:bg-accent/90"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-2xl bg-text-primary px-6 py-3 text-sm font-semibold text-background transition hover:bg-text-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? 'Saving…'
                    : mode === 'edit'
                      ? 'Save changes'
                      : 'Create service'}
                </button>
              )}
            </div>
          </footer>
        </form>
      </div>
    </Modal>
  )
}

export default ServiceFormModal
