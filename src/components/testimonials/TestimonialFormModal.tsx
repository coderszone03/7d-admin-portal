import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import Modal from '../common/Modal'
import { validateImageDimensions } from '../portfolio/projects/types'
import {
  DEFAULT_TESTIMONIAL_CATEGORIES,
  MAX_CATEGORY_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PHOTO_SIZE,
  MAX_QUOTE_LENGTH,
  MAX_ROLE_LENGTH,
  PHOTO_MIME_TYPES,
  TESTIMONIAL_PHOTO_SPEC,
  mergeTestimonialCategories,
  type Testimonial,
  type TestimonialFormPayload,
  type TestimonialFormValues,
} from './types'

type TestimonialFormModalProps = {
  isOpen: boolean
  mode: 'create' | 'edit'
  initialTestimonial: Testimonial | null
  // Categories already in use across the directory — merged with the defaults so
  // existing labels stay selectable. Admins can still add brand-new categories.
  existingCategories?: string[]
  onClose: () => void
  onSubmit: (payload: TestimonialFormPayload) => Promise<void> | void
}

type FieldErrorKey = 'name' | 'role' | 'category' | 'quote' | 'photo' | 'displayOrder'

const defaultValues: TestimonialFormValues = {
  name: '',
  role: '',
  category: '',
  quote: '',
  photoFile: null,
  photoPreview: null,
  status: 1,
  displayOrder: 1,
}

const buildInitialValues = (item: Testimonial | null): TestimonialFormValues => {
  if (!item) return { ...defaultValues }
  return {
    name: item.name,
    role: item.role,
    category: item.category,
    quote: item.quote,
    photoFile: null,
    photoPreview: item.photoUrl || null,
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
    id: 'person',
    label: 'Person',
    description: 'Name, role, category, and the photo.',
  },
  {
    id: 'quote',
    label: 'Quote & meta',
    description: 'The testimonial copy, status, and display order.',
  },
]

const TestimonialFormModal = ({
  isOpen,
  mode,
  initialTestimonial,
  existingCategories = [],
  onClose,
  onSubmit,
}: TestimonialFormModalProps) => {
  const [values, setValues] = useState<TestimonialFormValues>(() =>
    buildInitialValues(initialTestimonial),
  )
  const [errors, setErrors] = useState<Partial<Record<FieldErrorKey, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setSubmitting] = useState(false)
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const photoInputResetToken = useRef(0)
  const quoteRef = useRef<HTMLTextAreaElement>(null)
  const [isQuoteHovered, setIsQuoteHovered] = useState(false)
  const [quoteHasOverflow, setQuoteHasOverflow] = useState(false)

  // Categories the admin has added during this session (before save), kept separate
  // so they persist while the form is open even if not yet selected.
  const [addedCategories, setAddedCategories] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState('')

  const categoryOptions = useMemo(
    () =>
      mergeTestimonialCategories(
        DEFAULT_TESTIMONIAL_CATEGORIES,
        existingCategories,
        addedCategories,
        values.category ? [values.category] : [],
      ),
    [existingCategories, addedCategories, values.category],
  )

  const handleAddCategory = () => {
    const label = newCategory.trim()
    if (!label) return
    if (label.length > MAX_CATEGORY_LENGTH) {
      setErrors((prev) => ({
        ...prev,
        category: `Keep the category under ${MAX_CATEGORY_LENGTH} characters.`,
      }))
      return
    }
    const existing = categoryOptions.find(
      (option) => option.toLowerCase() === label.toLowerCase(),
    )
    const canonical = existing ?? label
    if (!existing) setAddedCategories((prev) => [...prev, canonical])
    setValues((prev) => ({ ...prev, category: canonical }))
    setNewCategory('')
    setErrors((prev) => ({ ...prev, category: undefined }))
  }

  useEffect(() => {
    if (!isOpen) return
    setValues(buildInitialValues(initialTestimonial))
    setErrors({})
    setFormError(null)
    setActiveStepIndex(0)
    setAddedCategories([])
    setNewCategory('')
    photoInputResetToken.current += 1
  }, [initialTestimonial, isOpen])

  useEffect(() => {
    const el = quoteRef.current
    if (!el) return
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 24
    const paddingY =
      parseFloat(getComputedStyle(el).paddingTop) +
      parseFloat(getComputedStyle(el).paddingBottom)
    const maxHeight = lineHeight * 6 + paddingY
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
    setQuoteHasOverflow(el.scrollHeight > maxHeight)
  }, [values.quote, activeStepIndex])

  const handlePhotoChange = async (file: File | null) => {
    if (!file) {
      setValues((prev) => ({
        ...prev,
        photoFile: null,
        photoPreview: initialTestimonial?.photoUrl ?? null,
      }))
      setErrors((prev) => ({ ...prev, photo: undefined }))
      photoInputResetToken.current += 1
      return
    }

    const mime = file.type.toLowerCase()
    if (!PHOTO_MIME_TYPES.includes(mime)) {
      setErrors((prev) => ({ ...prev, photo: 'Photo must be a PNG, JPG, or WebP image.' }))
      photoInputResetToken.current += 1
      return
    }

    if (file.size > MAX_PHOTO_SIZE) {
      setErrors((prev) => ({ ...prev, photo: 'Photo must be 2MB or smaller.' }))
      photoInputResetToken.current += 1
      return
    }

    const dimensionCheck = await validateImageDimensions(file, TESTIMONIAL_PHOTO_SPEC)
    if (!dimensionCheck.ok) {
      setErrors((prev) => ({ ...prev, photo: dimensionCheck.error }))
      photoInputResetToken.current += 1
      return
    }

    try {
      const preview = await readFileAsDataURL(file)
      setValues((prev) => ({ ...prev, photoFile: file, photoPreview: preview }))
      setErrors((prev) => ({ ...prev, photo: undefined }))
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        photo: err instanceof Error ? err.message : 'Failed to process photo.',
      }))
    }
  }

  const validateStep = (index: number): Partial<Record<FieldErrorKey, string>> => {
    const next: Partial<Record<FieldErrorKey, string>> = {}
    if (index === 0) {
      if (!values.name.trim()) next.name = 'Name is required.'
      else if (values.name.length > MAX_NAME_LENGTH)
        next.name = `Keep the name under ${MAX_NAME_LENGTH} characters.`
      if (!values.role.trim()) next.role = 'Role is required.'
      else if (values.role.length > MAX_ROLE_LENGTH)
        next.role = `Keep the role under ${MAX_ROLE_LENGTH} characters.`
      if (!values.category) next.category = 'Pick a category.'
      if (!values.photoPreview) next.photo = 'Upload a square photo (600×600).'
    } else if (index === 1) {
      if (!values.quote.trim()) next.quote = 'Quote is required.'
      else if (values.quote.length > MAX_QUOTE_LENGTH)
        next.quote = `Keep the quote under ${MAX_QUOTE_LENGTH} characters.`
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
      const payload: TestimonialFormPayload = {
        name: values.name.trim(),
        role: values.role.trim(),
        category: values.category.trim(),
        quote: values.quote.trim(),
        photoDataUrl: values.photoFile
          ? values.photoPreview ?? ''
          : '', // empty = keep existing on edit
        status: values.status,
        displayOrder: values.displayOrder,
      }
      await onSubmit(payload)
      onClose()
      setValues(buildInitialValues(null))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save testimonial.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20'
  const labelClass = 'text-xs font-semibold uppercase tracking-[0.16em] text-text-muted'
  const errorClass = 'mt-1 text-xs text-error'

  const overflowClass = isQuoteHovered && quoteHasOverflow ? 'overflow-y-auto' : 'overflow-hidden'

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
              {mode === 'create' ? 'New Testimonial' : 'Edit Testimonial'}
            </p>
            <h2 className="mt-3 text-3xl font-semibold">Testimonial Builder</h2>
            <p className="mt-3 text-sm text-text-muted">
              Capture a client quote that will rotate through the homepage deck.
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
          <div className="mt-auto rounded-2xl border border-border/60 bg-background p-4 text-xs text-text-muted">
            <p className="font-semibold text-text-secondary">Tip</p>
            <p className="mt-1">
              Crop photos to a square (600×600) so the homepage deck looks consistent.
            </p>
          </div>
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
                aria-label="Close testimonial form"
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
                    <label className={labelClass}>Name *</label>
                    <input
                      type="text"
                      value={values.name}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className={inputClass}
                      placeholder="e.g. Jasmine Davenport"
                      maxLength={MAX_NAME_LENGTH + 5}
                    />
                    {errors.name ? <p className={errorClass}>{errors.name}</p> : null}
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Role *</label>
                    <input
                      type="text"
                      value={values.role}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, role: e.target.value }))
                      }
                      className={inputClass}
                      placeholder="e.g. CEO of XYZ"
                      maxLength={MAX_ROLE_LENGTH + 5}
                    />
                    {errors.role ? <p className={errorClass}>{errors.role}</p> : null}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Category *</label>
                  <div className="flex flex-wrap gap-2">
                    {categoryOptions.map((option) => {
                      const isActive =
                        values.category.toLowerCase() === option.toLowerCase()
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            setValues((prev) => ({ ...prev, category: option }))
                          }
                          className={[
                            'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition',
                            isActive
                              ? 'border-accent bg-accent/10 text-accent'
                              : 'border-border/60 bg-surface text-text-secondary hover:border-accent/60 hover:text-accent',
                          ].join(' ')}
                        >
                          {option}
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddCategory()
                        }
                      }}
                      placeholder="Add a category…"
                      maxLength={MAX_CATEGORY_LENGTH}
                      className="h-9 w-48 rounded-xl border border-border/60 bg-background px-3 text-xs text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={!newCategory.trim()}
                      className="inline-flex h-9 items-center gap-1 rounded-xl border border-border/60 bg-surface px-3 text-xs font-semibold text-text-secondary transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        className="h-3.5 w-3.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
                      </svg>
                      Add
                    </button>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    Pick a category or add your own — categories aren’t restricted.
                  </p>
                  {errors.category ? <p className={errorClass}>{errors.category}</p> : null}
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Photo * (600×600 square)</label>
                  <div
                    className={[
                      'flex flex-col gap-4 rounded-2xl border-2 border-dashed bg-surface p-4 sm:flex-row sm:items-center',
                      values.photoPreview ? 'border-border/40' : 'border-border/60',
                      errors.photo ? 'border-error/60' : '',
                    ].join(' ')}
                  >
                    <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-background">
                      {values.photoPreview ? (
                        <img
                          src={values.photoPreview}
                          alt="Photo preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs text-text-muted">
                          No photo
                        </span>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm text-text-secondary">
                        Upload a 600×600 PNG, JPG, or WebP. Max 2MB.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <label
                          htmlFor="testimonial-photo"
                          className="inline-flex cursor-pointer items-center rounded-xl border border-border/60 bg-background px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-accent hover:text-accent"
                        >
                          {values.photoPreview ? 'Replace photo' : 'Upload photo'}
                        </label>
                        {values.photoPreview ? (
                          <button
                            type="button"
                            onClick={() => handlePhotoChange(null)}
                            className="inline-flex items-center rounded-xl border border-border/60 bg-background px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-error/60 hover:text-error"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <input
                        id="testimonial-photo"
                        key={`photo-${photoInputResetToken.current}`}
                        type="file"
                        accept={PHOTO_MIME_TYPES.join(',')}
                        className="hidden"
                        onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
                      />
                    </div>
                  </div>
                  {errors.photo ? <p className={errorClass}>{errors.photo}</p> : null}
                </div>
              </div>
            ) : null}

            {activeStepIndex === 1 ? (
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={labelClass}>Quote *</label>
                    <span className="text-[11px] tabular-nums text-text-muted">
                      {values.quote.length} / {MAX_QUOTE_LENGTH}
                    </span>
                  </div>
                  <textarea
                    ref={quoteRef}
                    value={values.quote}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, quote: e.target.value }))
                    }
                    onMouseEnter={() => setIsQuoteHovered(true)}
                    onMouseLeave={() => setIsQuoteHovered(false)}
                    rows={3}
                    placeholder="What did the client say?"
                    className={[
                      'w-full resize-none rounded-xl border border-border/60 bg-background px-3 py-2 text-sm leading-6 text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20',
                      overflowClass,
                    ].join(' ')}
                  />
                  {errors.quote ? <p className={errorClass}>{errors.quote}</p> : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Status</label>
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
                    ) : null}
                    <p className="text-[11px] text-text-muted">
                      Lower numbers appear first in the homepage deck.
                    </p>
                  </div>
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
                  className="inline-flex items-center justify-center rounded-2xl bg-text-primary px-6 py-3 text-sm font-semibold text-background shadow-[0_18px_32px_-20px_rgba(15,17,33,0.45)] transition hover:bg-text-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create testimonial'}
                </button>
              )}
            </div>
          </footer>
        </form>
      </div>
    </Modal>
  )
}

export default TestimonialFormModal
