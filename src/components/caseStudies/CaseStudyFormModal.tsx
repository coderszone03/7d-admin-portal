import { useEffect, useMemo, useState, type FormEvent } from 'react'
import Modal from '../common/Modal'
import type { BlogContentBlock, BlogContentBlockType } from '../blog/types'
import type { CaseStudy } from './types'
import { CASE_STUDY_COVER_IMAGE_SPEC } from './types'
import {
  validateImageDimensions,
  validatePreviewDimensions,
} from '../portfolio/projects/types'
import RichTextEditor from '../common/RichTextEditor'

type CaseStudyFormModalProps = {
  isOpen: boolean
  mode: 'create' | 'edit'
  initialCaseStudy: CaseStudy | null
  onClose: () => void
  onSubmit: (caseStudy: CaseStudy) => Promise<void> | void
}

type CaseStudyFormValues = {
  title: string
  slug: string
  excerpt: string
  status: 0 | 1
  isPopular: boolean
  authorName: string
  authorRole: string
  tags: string
  thumbnailTopic: string
  thumbnailDescription: string
  thumbnailContent: string
  coverPreview: string | null
  blocks: BlogContentBlock[]
}

type FieldErrorKey =
  | 'title'
  | 'slug'
  | 'excerpt'
  | 'authorName'
  | 'authorRole'
  | 'coverPreview'

const LIMIT_TITLE = 200
const LIMIT_SLUG = 250
const LIMIT_EXCERPT = 300
const LIMIT_AUTHOR_NAME = 48
const LIMIT_AUTHOR_ROLE = 48
const LIMIT_THUMBNAIL_TOPIC = 200
const LIMIT_THUMBNAIL_DESCRIPTION = 500

const counterToneClass = (used: number, max: number): string => {
  const ratio = used / max
  if (ratio >= 1) return 'text-error'
  if (ratio >= 0.9) return 'text-warning'
  return 'text-text-muted'
}

const createBlock = (type: BlogContentBlockType): BlogContentBlock => {
  const id = `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`
  if (type === 'heading') {
    return { id, type, heading: '' }
  }
  if (type === 'image') {
    return { id, type, imageUrl: '', alt: '' }
  }
  return { id, type, text: '' }
}

const buildInitialValues = (caseStudy: CaseStudy | null): CaseStudyFormValues => {
  if (!caseStudy) {
    return {
      title: '',
      slug: '',
      excerpt: '',
      status: 1,
      isPopular: false,
      authorName: '',
      authorRole: '',
      tags: '',
      thumbnailTopic: '',
      thumbnailDescription: '',
      thumbnailContent: '',
      coverPreview: null,
      blocks: [
        { ...createBlock('heading'), heading: 'Overview' },
        createBlock('paragraph'),
      ],
    }
  }

  return {
    title: caseStudy.title,
    slug: caseStudy.slug,
    excerpt: caseStudy.excerpt,
    status: caseStudy.status,
    isPopular: caseStudy.isPopular,
    authorName: caseStudy.authorName,
    authorRole: caseStudy.authorRole,
    tags: caseStudy.tags.join(', '),
    thumbnailTopic: caseStudy.thumbnailTopic,
    thumbnailDescription: caseStudy.thumbnailDescription,
    thumbnailContent: caseStudy.thumbnailContent.join('\n'),
    coverPreview: caseStudy.coverImageUrl,
    blocks: caseStudy.sections.length
      ? caseStudy.sections.map((block) => ({ ...block, id: `${block.id}` }))
      : [
          { ...createBlock('heading'), heading: 'Overview' },
          createBlock('paragraph'),
        ],
  }
}

const steps = [
  {
    id: 'details',
    label: 'Case study details',
    description: 'Title, slug, teaser copy, thumbnail, and author.',
  },
  {
    id: 'content',
    label: 'Content blocks',
    description: 'Headings, paragraphs, and inline images.',
  },
  {
    id: 'preview',
    label: 'Preview & submit',
    description: 'Review the full layout before publishing.',
  },
]

const CaseStudyFormModal = ({
  isOpen,
  mode,
  initialCaseStudy,
  onClose,
  onSubmit,
}: CaseStudyFormModalProps) => {
  const [values, setValues] = useState<CaseStudyFormValues>(() =>
    buildInitialValues(initialCaseStudy),
  )
  const [errors, setErrors] = useState<Partial<Record<FieldErrorKey, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setSubmitting] = useState(false)
  const [activeStepIndex, setActiveStepIndex] = useState(0)

  useEffect(() => {
    if (!isOpen) {
      return
    }
    setValues(buildInitialValues(initialCaseStudy))
    setErrors({})
    setFormError(null)
    setActiveStepIndex(0)
  }, [initialCaseStudy, isOpen])

  const handleFieldChange = <K extends keyof CaseStudyFormValues>(
    field: K,
    value: CaseStudyFormValues[K],
  ) => {
    setValues((previous) => ({
      ...previous,
      [field]: value,
    }))
    if (field in errors) {
      setErrors((previous) => ({
        ...previous,
        [field]: undefined,
      }))
    }
  }

  const handleCoverChange = async (file: File | null) => {
    if (!file) {
      handleFieldChange('coverPreview', null)
      return
    }

    const dimensionCheck = await validateImageDimensions(file, CASE_STUDY_COVER_IMAGE_SPEC)
    if (!dimensionCheck.ok) {
      setErrors((previous) => ({ ...previous, coverPreview: dimensionCheck.error }))
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        handleFieldChange('coverPreview', event.target.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleImageFileChange = (id: string, file: File | null) => {
    if (!file) {
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        handleBlockChange(id, { imageUrl: event.target.result })
      }
    }
    reader.readAsDataURL(file)
  }

  const handleBlockChange = (id: string, partial: Partial<BlogContentBlock>) => {
    setValues((previous) => ({
      ...previous,
      blocks: previous.blocks.map((block) => (block.id === id ? { ...block, ...partial } : block)),
    }))
  }

  const handleAddBlock = (type: BlogContentBlockType) => {
    setValues((previous) => ({
      ...previous,
      blocks: [...previous.blocks, createBlock(type)],
    }))
  }

  const handleRemoveBlock = (id: string) => {
    setValues((previous) => ({
      ...previous,
      blocks: previous.blocks.filter((block) => block.id !== id),
    }))
  }

  const handleMoveBlock = (id: string, direction: -1 | 1) => {
    setValues((previous) => {
      const index = previous.blocks.findIndex((block) => block.id === id)
      if (index === -1) {
        return previous
      }
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= previous.blocks.length) {
        return previous
      }
      const blocks = [...previous.blocks]
      const [item] = blocks.splice(index, 1)
      blocks.splice(nextIndex, 0, item)
      return { ...previous, blocks }
    })
  }

  const validateDetailsStep = () => {
    const nextErrors: Partial<Record<FieldErrorKey, string>> = {}
    const trimmedTitle = values.title.trim()
    const trimmedSlug = values.slug.trim()
    const trimmedExcerpt = values.excerpt.trim()
    const trimmedAuthor = values.authorName.trim()
    const trimmedRole = values.authorRole.trim()

    if (!trimmedTitle) {
      nextErrors.title = 'Case study title is required.'
    }
    if (!trimmedSlug) {
      nextErrors.slug = 'Slug is required.'
    }
    if (!trimmedExcerpt) {
      nextErrors.excerpt = 'Short description is required.'
    }
    if (!trimmedAuthor) {
      nextErrors.authorName = 'Author name is required.'
    }
    if (!trimmedRole) {
      nextErrors.authorRole = 'Author role is required.'
    }
    if (!values.coverPreview) {
      nextErrors.coverPreview = 'Cover image is required.'
    }

    return nextErrors
  }

  const estimatedReadTime = useMemo(() => {
    const texts: string[] = []

    if (values.title) {
      texts.push(values.title)
    }
    if (values.excerpt) {
      texts.push(values.excerpt)
    }

    const stripHtml = (html: string) => {
      const doc = new DOMParser().parseFromString(html, 'text/html')
      return doc.body.textContent || ''
    }

    values.blocks.forEach((block) => {
      if (block.type === 'heading' && block.heading) {
        texts.push(block.heading)
      } else if ((block.type === 'paragraph' || block.type === 'list') && block.text) {
        texts.push(stripHtml(block.text))
      }
    })

    const wordCount = texts
      .join(' ')
      .split(/\s+/)
      .filter(Boolean).length

    if (!wordCount) {
      return 1
    }

    const minutes = Math.round(wordCount / 200)
    return Math.max(1, minutes || 1)
  }, [values.title, values.excerpt, values.blocks])

  const cleanedBlocks = useMemo(
    () =>
      values.blocks.filter((block) => {
        const stripHtml = (html: string) => {
          const doc = new DOMParser().parseFromString(html, 'text/html')
          return doc.body.textContent || ''
        }

        if (block.type === 'heading') {
          return Boolean(block.heading && block.heading.trim())
        }
        if (block.type === 'image') {
          return Boolean(block.imageUrl && block.imageUrl.trim())
        }
        return Boolean(block.text && stripHtml(block.text).trim())
      }),
    [values.blocks],
  )

  const headingsForContents = useMemo(
    () =>
      cleanedBlocks.filter(
        (block) => block.type === 'heading' && block.heading && block.heading.trim(),
      ),
    [cleanedBlocks],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setFormError(null)

    if (activeStepIndex === 0) {
      const nextErrors = validateDetailsStep()
      if (!nextErrors.coverPreview && values.coverPreview) {
        const dimensionCheck = await validatePreviewDimensions(
          values.coverPreview,
          CASE_STUDY_COVER_IMAGE_SPEC,
        )
        if (!dimensionCheck.ok) {
          nextErrors.coverPreview = dimensionCheck.error
        }
      }
      if (Object.keys(nextErrors).length) {
        setErrors(nextErrors)
        return
      }
      setErrors({})
      setActiveStepIndex(1)
      return
    }

    if (activeStepIndex === 1) {
      if (!cleanedBlocks.length) {
        setFormError('Add at least one heading or paragraph block.')
        return
      }
      setFormError(null)
      setActiveStepIndex(2)
      return
    }

    const now = new Date().toISOString()
    const rawTags = values.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
    const rawThumbnailContent = values.thumbnailContent
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    const base: CaseStudy = {
      id: initialCaseStudy?.id ?? `case-study-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      status: values.status,
      isPopular: values.isPopular,
      title: values.title.trim(),
      slug: values.slug.trim(),
      excerpt: values.excerpt.trim(),
      coverImageUrl: values.coverPreview ?? '',
      thumbnailTopic: values.thumbnailTopic.trim(),
      thumbnailDescription: values.thumbnailDescription.trim(),
      thumbnailContent: rawThumbnailContent,
      authorName: values.authorName.trim(),
      authorRole: values.authorRole.trim(),
      readTimeMinutes: estimatedReadTime,
      tags: rawTags,
      sections: cleanedBlocks,
      createdAt: initialCaseStudy?.createdAt ?? now,
      updatedAt: now,
    }

    setSubmitting(true)
    try {
      await onSubmit(base)
      onClose()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save case study.')
    } finally {
      setSubmitting(false)
    }
  }

  const renderPreviewSection = (block: BlogContentBlock) => {
    if (block.type === 'heading') {
      if (!block.heading) return null
      return (
        <h2
          key={block.id}
          className="mt-10 text-lg font-semibold tracking-[0.16em] text-text-secondary"
        >
          {block.heading}
        </h2>
      )
    }

    if (block.type === 'paragraph') {
      if (!block.text) return null
      return (
        <div
          key={block.id}
          className="mt-4 max-w-3xl text-sm leading-relaxed text-text-secondary/80 [&_p]:my-2 [&_a]:text-accent [&_a]:underline [&_strong]:font-semibold [&_em]:italic [&_h1]:mt-6 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-text-secondary [&_h2]:mt-5 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-text-secondary [&_h3]:mt-4 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-text-secondary [&_h4]:mt-4 [&_h4]:text-lg [&_h4]:font-semibold [&_h5]:mt-3 [&_h5]:text-base [&_h5]:font-semibold [&_h6]:mt-3 [&_h6]:text-sm [&_h6]:font-semibold [&_h6]:uppercase [&_h6]:tracking-wide [&_ul]:my-2 [&_ul]:ml-5 [&_ul]:list-disc [&_ol]:my-2 [&_ol]:ml-5 [&_ol]:list-decimal [&_li]:my-1 [&_blockquote]:border-l-4 [&_blockquote]:border-accent/50 [&_blockquote]:pl-4 [&_blockquote]:italic"
          dangerouslySetInnerHTML={{ __html: block.text }}
        />
      )
    }

    if (block.type === 'list') {
      if (!block.text) return null
      return (
        <div
          key={block.id}
          className="mt-4 text-sm text-text-secondary/80 [&_ul]:ml-5 [&_ul]:list-disc [&_ol]:ml-5 [&_ol]:list-decimal [&_li]:my-1 [&_a]:text-accent [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: block.text }}
        />
      )
    }

    if (block.type === 'image') {
      if (!block.imageUrl) return null
      return (
        <div
          key={block.id}
          className="mt-6 overflow-hidden rounded-3xl border border-border/60 bg-surface-muted/80"
        >
          <img src={block.imageUrl} alt={block.alt ?? ''} className="w-full object-cover" />
        </div>
      )
    }

    return null
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      fullScreen
      className="overflow-hidden"
      overlayClassName="bg-black/40 dark:bg-black/70"
    >
      <div className="flex h-full flex-col overflow-hidden bg-white lg:flex-row dark:bg-slate-950">
        <aside className="hidden w-full max-w-[320px] flex-col border-b border-slate-200/60 bg-gradient-to-b from-white via-[#f7f8fb] to-[#eef2ff] px-8 py-10 text-slate-900 lg:flex lg:border-b-0 lg:border-r dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-50">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
              {mode === 'create' ? 'New Case Study' : 'Edit Case Study'}
            </p>
            <h2 className="mt-3 text-3xl font-semibold">Case Study Builder</h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Structure long-form case studies with headings, lists, and inline imagery.
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
                        ? 'border-[#f97316] bg-[#fff7ed] text-[#ea580c] shadow-[0_12px_30px_-25px_rgba(234,88,12,0.65)] dark:bg-[#ea580c]/20'
                        : isCompleted
                          ? 'border-[#f97316]/60 bg-[#ffedd5] text-[#ea580c] dark:bg-[#ea580c]/15'
                          : 'border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500',
                    ].join(' ')}
                  >
                    {index + 1}
                  </span>
                  {index < steps.length - 1 ? (
                    <span
                      className="absolute left-3.5 top-8 bottom-[-28px] w-px bg-slate-200 dark:bg-slate-700"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-50">
                      {step.label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {step.description}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </aside>

        <form
          onSubmit={handleSubmit}
          className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-surface/90 text-slate-900 dark:bg-slate-950 dark:text-slate-50"
        >
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-surface px-5 py-4 sm:px-8 dark:border-slate-800 dark:bg-slate-950/80">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-text-muted">
                Case Study
              </p>
              <h1 className="text-base font-semibold text-text-primary">
                {mode === 'create' ? 'Create case study' : 'Edit case study'}
              </h1>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full border border-border/60 px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-accent hover:text-accent"
            >
              Close
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
            {activeStepIndex === 0 ? (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-text-muted">Case study title</label>
                      <span className={`text-[10px] font-medium ${counterToneClass(values.title.length, LIMIT_TITLE)}`}>
                        {values.title.length}/{LIMIT_TITLE}
                      </span>
                    </div>
                    <input
                      value={values.title}
                      onChange={(event) => handleFieldChange('title', event.target.value)}
                      maxLength={LIMIT_TITLE}
                      className="w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      placeholder="Rebranding a legacy fintech product"
                    />
                    {errors.title ? (
                      <p className="mt-1 text-xs text-error">{errors.title}</p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-text-muted">Slug</label>
                      <span className={`text-[10px] font-medium ${counterToneClass(values.slug.length, LIMIT_SLUG)}`}>
                        {values.slug.length}/{LIMIT_SLUG}
                      </span>
                    </div>
                    <input
                      value={values.slug}
                      onChange={(event) => handleFieldChange('slug', event.target.value)}
                      maxLength={LIMIT_SLUG}
                      className="w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      placeholder="rebranding-a-legacy-fintech-product"
                    />
                    {errors.slug ? (
                      <p className="mt-1 text-xs text-error">{errors.slug}</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col items-start gap-1.5">
                  <label className="text-xs font-medium text-text-muted">Status</label>
                  <div className="inline-flex h-9 items-center gap-1 rounded-2xl border border-border/60 bg-background p-1">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('status', 1)}
                      className={`h-7 rounded-xl px-3 text-xs font-medium transition ${
                        values.status === 1
                          ? 'bg-accent text-white'
                          : 'text-text-muted hover:text-text-secondary'
                      }`}
                    >
                      Published
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFieldChange('status', 0)}
                      className={`h-7 rounded-xl px-3 text-xs font-medium transition ${
                        values.status === 0
                          ? 'bg-accent text-white'
                          : 'text-text-muted hover:text-text-secondary'
                      }`}
                    >
                      Draft
                    </button>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background px-4 py-3">
                  <span className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
                      Mark as featured
                    </span>
                    <span className="text-[11px] text-text-muted">
                      Highlights this case study on the public site and with a pill in the admin list.
                    </span>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={values.isPopular}
                    onClick={() => handleFieldChange('isPopular', !values.isPopular)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                      values.isPopular ? 'bg-accent' : 'bg-surface-muted'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                        values.isPopular ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </label>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-text-muted">Short description</label>
                    <span className={`text-[10px] font-medium ${counterToneClass(values.excerpt.length, LIMIT_EXCERPT)}`}>
                      {values.excerpt.length}/{LIMIT_EXCERPT}
                    </span>
                  </div>
                  <textarea
                    value={values.excerpt}
                    onChange={(event) => handleFieldChange('excerpt', event.target.value)}
                    rows={3}
                    maxLength={LIMIT_EXCERPT}
                    className="w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                    placeholder="A short teaser for feeds and cards."
                  />
                  {errors.excerpt ? (
                    <p className="mt-1 text-xs text-error">{errors.excerpt}</p>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-text-muted">Author name</label>
                      <span className={`text-[10px] font-medium ${counterToneClass(values.authorName.length, LIMIT_AUTHOR_NAME)}`}>
                        {values.authorName.length}/{LIMIT_AUTHOR_NAME}
                      </span>
                    </div>
                    <input
                      value={values.authorName}
                      onChange={(event) => handleFieldChange('authorName', event.target.value)}
                      maxLength={LIMIT_AUTHOR_NAME}
                      className="w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      placeholder="Hurman Ali Khan"
                    />
                    {errors.authorName ? (
                      <p className="mt-1 text-xs text-error">{errors.authorName}</p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-text-muted">Author role</label>
                      <span className={`text-[10px] font-medium ${counterToneClass(values.authorRole.length, LIMIT_AUTHOR_ROLE)}`}>
                        {values.authorRole.length}/{LIMIT_AUTHOR_ROLE}
                      </span>
                    </div>
                    <input
                      value={values.authorRole}
                      onChange={(event) => handleFieldChange('authorRole', event.target.value)}
                      maxLength={LIMIT_AUTHOR_ROLE}
                      className="w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      placeholder="Brand Strategist"
                    />
                    {errors.authorRole ? (
                      <p className="mt-1 text-xs text-error">{errors.authorRole}</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">Tags</label>
                  <input
                    value={values.tags}
                    onChange={(event) => handleFieldChange('tags', event.target.value)}
                    className="w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                    placeholder="branding, fintech, redesign"
                  />
                  <p className="text-[11px] text-text-muted">Separate tags with commas.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">
                    Cover image (502×303)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/60 px-4 py-2 text-xs font-medium text-text-secondary hover:border-accent/60 hover:text-accent">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => handleCoverChange(event.target.files?.[0] ?? null)}
                      />
                      Upload image
                    </label>
                    {values.coverPreview ? (
                      <div className="h-14 w-28 overflow-hidden rounded-xl border border-border/60 bg-surface-muted">
                        <img
                          src={values.coverPreview}
                          alt="Cover preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-text-muted">
                    Use a 502×303 landscape image (1.66:1) to match the case study hero.
                  </p>
                  {errors.coverPreview ? (
                    <p className="mt-1 text-xs text-error">{errors.coverPreview}</p>
                  ) : null}
                </div>

                <div className="space-y-4 rounded-2xl border border-border/60 bg-background/40 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                    Thumbnail card (optional)
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-text-muted">Thumbnail topic</label>
                      <span className={`text-[10px] font-medium ${counterToneClass(values.thumbnailTopic.length, LIMIT_THUMBNAIL_TOPIC)}`}>
                        {values.thumbnailTopic.length}/{LIMIT_THUMBNAIL_TOPIC}
                      </span>
                    </div>
                    <input
                      value={values.thumbnailTopic}
                      onChange={(event) => handleFieldChange('thumbnailTopic', event.target.value)}
                      maxLength={LIMIT_THUMBNAIL_TOPIC}
                      className="w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      placeholder="Short headline shown on the card"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-text-muted">Thumbnail description</label>
                      <span className={`text-[10px] font-medium ${counterToneClass(values.thumbnailDescription.length, LIMIT_THUMBNAIL_DESCRIPTION)}`}>
                        {values.thumbnailDescription.length}/{LIMIT_THUMBNAIL_DESCRIPTION}
                      </span>
                    </div>
                    <textarea
                      value={values.thumbnailDescription}
                      onChange={(event) => handleFieldChange('thumbnailDescription', event.target.value)}
                      rows={2}
                      maxLength={LIMIT_THUMBNAIL_DESCRIPTION}
                      className="w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      placeholder="Supporting copy for the card"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-muted">Thumbnail content</label>
                    <textarea
                      value={values.thumbnailContent}
                      onChange={(event) => handleFieldChange('thumbnailContent', event.target.value)}
                      rows={3}
                      className="w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      placeholder={'One item per line:\nBrand identity\nUI/UX design\nMotion graphics'}
                    />
                    <p className="text-[11px] text-text-muted">One item per line.</p>
                  </div>
                </div>
              </div>
            ) : null}

            {activeStepIndex === 1 ? (
              <div className="relative space-y-4">
                <aside className="sticky top-0 z-10 float-right ml-4 mb-2 max-w-[420px]">
                  <div className="rounded-2xl border flex gap-1 items-center justify-start border-border/70 bg-background/95 p-3 shadow-lg backdrop-blur">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                      Add block
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddBlock('heading')}
                        className="rounded-full border border-border/70 px-3 py-1 text-[11px] font-semibold text-text-secondary hover:border-accent/60 hover:text-accent"
                      >
                        Heading
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddBlock('paragraph')}
                        className="rounded-full border border-border/70 px-3 py-1 text-[11px] font-semibold text-text-secondary hover:border-accent/60 hover:text-accent"
                      >
                        Paragraph
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddBlock('image')}
                        className="rounded-full border border-border/70 px-3 py-1 text-[11px] font-semibold text-text-secondary hover:border-accent/60 hover:text-accent"
                      >
                        Image
                      </button>
                    </div>
                  </div>
                </aside>

                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                  Content blocks
                </h3>

                <div className="space-y-3 pt-4">
                  {values.blocks.map((block, index) => (
                    <div
                      key={block.id}
                      className="space-y-2 rounded-2xl border border-border/60 bg-background/60 p-3"
                    >
                      <div className="flex items-center justify-between text-[11px] text-text-muted">
                        <span className="uppercase tracking-[0.16em]">
                          {block.type === 'list'
                            ? `${block.ordered ? 'NUMBERED LIST' : 'BULLET LIST'}`
                            : block.type.toUpperCase()}{' '}
                          • Block {index + 1}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            aria-label="Move block up"
                            onClick={() => handleMoveBlock(block.id, -1)}
                            className="rounded-full px-2 py-1 hover:bg-surface-muted"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            aria-label="Move block down"
                            onClick={() => handleMoveBlock(block.id, 1)}
                            className="rounded-full px-2 py-1 hover:bg-surface-muted"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveBlock(block.id)}
                            className="text-error hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {block.type === 'heading' ? (
                        <input
                          value={block.heading ?? ''}
                          onChange={(event) =>
                            handleBlockChange(block.id, { heading: event.target.value })
                          }
                          className="w-full rounded-2xl border border-border/60 bg-background px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                          placeholder="OVERVIEW"
                        />
                      ) : null}

                      {block.type === 'paragraph' ? (
                        <RichTextEditor
                          value={block.text ?? ''}
                          onChange={(htmlContent: string) =>
                            handleBlockChange(block.id, { text: htmlContent })
                          }
                          placeholder="Write your paragraph here..."
                        />
                      ) : null}

                      {block.type === 'list' ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-text-muted">
                            <span>
                              {block.ordered ? 'Numbered list (1, 2, 3)' : 'Bulleted list (•)'}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleBlockChange(block.id, { ordered: !block.ordered })
                              }
                              className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-semibold text-text-secondary hover:border-accent/60 hover:text-accent"
                            >
                              Toggle style
                            </button>
                          </div>
                          <RichTextEditor
                            value={block.text ?? ''}
                            onChange={(htmlContent: string) =>
                              handleBlockChange(block.id, { text: htmlContent })
                            }
                            placeholder={'Each line becomes a list item:\nA refreshed brand identity\nUI/UX improvements\nCross-platform digital campaigns'}
                          />
                        </div>
                      ) : null}

                      {block.type === 'image' ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/60 px-4 py-2 text-xs font-medium text-text-secondary hover:border-accent/60 hover:text-accent">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) =>
                                  handleImageFileChange(
                                    block.id,
                                    event.target.files?.[0] ?? null,
                                  )
                                }
                              />
                              Upload image
                            </label>
                            {block.imageUrl ? (
                              <div className="h-14 w-28 overflow-hidden rounded-xl border border-border/60 bg-surface-muted">
                                <img
                                  src={block.imageUrl}
                                  alt={block.alt ?? ''}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : null}
                          </div>
                          <input
                            value={block.imageUrl ?? ''}
                            onChange={(event) =>
                              handleBlockChange(block.id, { imageUrl: event.target.value })
                            }
                            className="w-full rounded-2xl border border-border/60 bg-background px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                            placeholder="Paste image URL (optional)"
                          />
                          <input
                            value={block.alt ?? ''}
                            onChange={(event) =>
                              handleBlockChange(block.id, { alt: event.target.value })
                            }
                            className="w-full rounded-2xl border border-border/60 bg-background px-3 py-1.5 text-xs text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                            placeholder="Alt text for accessibility"
                          />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {activeStepIndex === 2 ? (
              <div className="space-y-5">
                <div className="rounded-3xl border border-border/60 bg-surface p-6 text-text-secondary">
                  <div className="flex flex-col gap-6 lg:flex-row">
                    <aside className="w-full max-w-xs space-y-4 lg:w-64 ">
                      <div className="sticky top-0 space-y-4">
                        <div className="flex items-center gap-3 rounded-2xl bg-surface-muted/60 p-3 ">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500">
                            <span className="text-sm font-semibold text-white">7D</span>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                              Written by
                            </p>
                            <p className="text-sm font-medium text-text-secondary">
                              {values.authorName || 'Team 7D Design'}
                            </p>
                            <p className="text-[11px] text-text-muted">
                              {values.authorRole || 'Content Team'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 rounded-2xl bg-surface-muted/60 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                            Contents
                          </p>
                          <ul className="space-y-1 text-sm text-text-secondary/80">
                            {headingsForContents.map((block) => (
                              <li key={block.id}>{block.heading}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-2 rounded-2xl bg-surface-muted/60 p-3 text-[11px] text-text-muted">
                          <p>
                            <span className="inline-block h-1 w-10 rounded-full bg-gradient-to-r from-orange-400 to-purple-500" />
                          </p>
                          <p>{estimatedReadTime} mins read</p>
                        </div>
                      </div>
                    </aside>

                    <article className="flex-1 space-y-4">
                      <h1 className="text-3xl font-semibold leading-tight text-text-secondary">
                        {values.title || 'Your case study title will appear here'}
                      </h1>
                      <p className="max-w-3xl text-sm text-text-muted">
                        {values.excerpt ||
                          'Use the previous steps to structure your case study.'}
                      </p>

                      {values.coverPreview ? (
                        <div className="mt-4 overflow-hidden rounded-3xl border border-border/60 bg-surface-muted/80">
                          <img
                            src={values.coverPreview}
                            alt=""
                            className="h-60 w-full object-cover"
                          />
                        </div>
                      ) : null}

                      <div className="mt-6">
                        {cleanedBlocks.map((block) => renderPreviewSection(block))}
                      </div>
                    </article>
                  </div>
                </div>

                {formError ? (
                  <p className="rounded-2xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
                    {formError}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <footer className="flex flex-col gap-3 border-t border-slate-200 bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 dark:border-slate-800 dark:bg-slate-950/90">
            {activeStepIndex === 0 ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-50"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setFormError(null)
                  setActiveStepIndex((previous) => Math.max(0, previous - 1))
                }}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-50"
              >
                Back
              </button>
            )}
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              {activeStepIndex < steps.length - 1 ? (
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#f97316] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_32px_-20px_rgba(248,113,22,0.45)] transition hover:bg-[#ea580c]"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#111322] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_32px_-20px_rgba(15,17,33,0.45)] transition hover:bg-[#0c0e1b] disabled:cursor-not-allowed disabled:bg-[#111322]/60"
                >
                  {isSubmitting ? 'Publishing…' : 'Publish case study'}
                </button>
              )}
            </div>
          </footer>
        </form>
      </div>
    </Modal>
  )
}

export default CaseStudyFormModal
