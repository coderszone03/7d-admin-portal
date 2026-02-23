import { useEffect, useMemo, useState, type FormEvent } from 'react'
import Modal from '../common/Modal'
import type { BlogContentBlock, BlogContentBlockType, BlogPost } from './types'
import RichTextEditor from '../common/RichTextEditor'
 // You'd create this or use a library

type BlogPostFormModalProps = {
  isOpen: boolean
  mode: 'create' | 'edit'
  initialPost: BlogPost | null
  onClose: () => void
  onSubmit: (post: BlogPost) => Promise<void> | void
}

type BlogFormValues = {
  title: string
  slug: string
  excerpt: string
  authorName: string
  authorRole: string
  readTimeMinutes: number
  tags: string
  coverPreview: string | null
  blocks: BlogContentBlock[]
}

type FieldErrorKey = keyof Pick<
  BlogFormValues,
  'title' | 'slug' | 'excerpt' | 'authorName' | 'authorRole' | 'coverPreview'
>

const createBlock = (type: BlogContentBlockType): BlogContentBlock => {
  const id = `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`
  if (type === 'heading') {
    return { id, type, heading: '' };
  }
  if (type === 'image') {
    return { id, type, imageUrl: '', alt: '' };
  }
  return { id, type, text: '' }; // 'text' will now store HTML for paragraph/list
}

const buildInitialValues = (post: BlogPost | null): BlogFormValues => {
  if (!post) {
    return {
      title: '',
      slug: '',
      excerpt: '',
      authorName: '',
      authorRole: '',
      readTimeMinutes: 2,
      tags: '',
      coverPreview: null,
      blocks: [
        { ...createBlock('heading'), heading: 'Introduction' },
        createBlock('paragraph'),
      ],
    }
  }

  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    authorName: post.authorName,
    authorRole: post.authorRole,
    readTimeMinutes: post.readTimeMinutes,
    tags: post.tags.join(', '),
    coverPreview: post.coverImageUrl,
    blocks: post.sections.length
      ? post.sections.map((block) => ({ ...block, id: `${block.id}` }))
      : [
          { ...createBlock('heading'), heading: 'Introduction' },
          createBlock('paragraph'),
        ],
  }
}

const steps = [
  {
    id: 'details',
    label: 'Post details',
    description: 'Title, slug, teaser copy, and author.',
  },
  {
    id: 'content',
    label: 'Content blocks',
    description: 'Headings, paragraphs, lists, and inline images.',
  },
  {
    id: 'preview',
    label: 'Preview & submit',
    description: 'Review the full article layout before publishing.',
  },
]

const BlogPostFormModal = ({ isOpen, mode, initialPost, onClose, onSubmit }: BlogPostFormModalProps) => {
  const [values, setValues] = useState<BlogFormValues>(() => buildInitialValues(initialPost))
  const [errors, setErrors] = useState<Partial<Record<FieldErrorKey, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setSubmitting] = useState(false)
  const [activeStepIndex, setActiveStepIndex] = useState(0)

  useEffect(() => {
    if (!isOpen) {
      return
    }
    setValues(buildInitialValues(initialPost))
    setErrors({})
    setFormError(null)
    setActiveStepIndex(0)
  }, [initialPost, isOpen])

  const handleFieldChange = <K extends keyof BlogFormValues>(field: K, value: BlogFormValues[K]) => {
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

  const handleTitleChange = (title: string) => {
    // Only update the post title. Slug should be edited independently so typing
    // the title does not automatically overwrite or populate the slug field.
    handleFieldChange('title', title)
  }

  const handleCoverChange = (file: File | null) => {
    if (!file) {
      handleFieldChange('coverPreview', null)
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
      nextErrors.title = 'Post title is required.'
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

    // Helper to strip HTML tags for word count calculation
    const stripHtml = (html: string) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return doc.body.textContent || '';
    };

    values.blocks.forEach((block) => {
      if (block.type === 'heading' && block.heading) {
        texts.push(block.heading)
      } else if ((block.type === 'paragraph' || block.type === 'list') && block.text) {
        // Strip HTML before counting words for rich text blocks
        texts.push(stripHtml(block.text));
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
        // Helper to strip HTML tags for content check
        const stripHtml = (html: string) => {
          const doc = new DOMParser().parseFromString(html, 'text/html');
          return doc.body.textContent || '';
        };

        if (block.type === 'heading') {
          return Boolean(block.heading && block.heading.trim())
        }
        if (block.type === 'image') {
          return Boolean(block.imageUrl && block.imageUrl.trim())
        }
        // For rich text blocks, check if stripped HTML content is not empty
        return Boolean(block.text && stripHtml(block.text).trim());
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

    const base: BlogPost = {
      id: initialPost?.id ?? `blog-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: values.title.trim(),
      slug: values.slug.trim(),
      excerpt: values.excerpt.trim(),
      coverImageUrl: values.coverPreview ?? '',
      authorName: values.authorName.trim(),
      authorRole: values.authorRole.trim(),
      readTimeMinutes: estimatedReadTime,
      tags: rawTags,
      sections: cleanedBlocks,
      createdAt: initialPost?.createdAt ?? now,
      updatedAt: now,
    }

    setSubmitting(true)
    try {
      await onSubmit(base)
      onClose()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save blog post.')
    } finally {
      setSubmitting(false)
    }
  }

  const renderPreviewSection = (block: BlogContentBlock) => {
    if (block.type === 'heading') {
      if (!block.heading) return null;
      return (
        <h2
          key={block.id}
          className="mt-10 text-lg font-semibold tracking-[0.16em] text-white"
        >
          {block.heading}
        </h2>
      )
    }

    if (block.type === 'paragraph') {
      if (!block.text) return null;
      return (
        <p
          key={block.id}
          className="mt-4 max-w-3xl text-sm leading-relaxed text-white/80 whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: block.text }} // Render HTML content
        >
        </p>
      )
    }

    if (block.type === 'list') {
      if (!block.text) return null
      const items = block.text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
      if (!items.length) return null;

      const ListTag = (block.ordered ? 'ol' : 'ul') as 'ol' | 'ul'

      return (
        <ListTag
          // Note: For rich text lists, you might want the editor to output the full <ol>/<ul> structure
          key={block.id}
          className={`mt-4 ml-5 space-y-1 text-sm text-white/80 ${
            block.ordered ? 'list-decimal' : 'list-disc'
          }`}
        >
          {items.map((item, index) => (
            <li key={`${block.id}-${index}`}>{item}</li>
          ))} 
        </ListTag>
      )
    }

    if (block.type === 'image') {
      if (!block.imageUrl) return null
      return (
        <div
          key={block.id}
          className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-black/40"
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
              {mode === 'create' ? 'New Post' : 'Edit Post'}
            </p>
            <h2 className="mt-3 text-3xl font-semibold">Blog Builder</h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Structure long-form, case-study style articles with headings, lists, and inline imagery.
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
          className="flex h-full flex-1 flex-col overflow-hidden bg-surface/90 text-slate-900 dark:bg-slate-950 dark:text-slate-50"
        >
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-surface px-5 py-4 sm:px-8 dark:border-slate-800 dark:bg-slate-950/80">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-text-muted">
                Blog
              </p>
              <h1 className="text-base font-semibold text-text-primary">
                {mode === 'create' ? 'Create blog post' : 'Edit blog post'}
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

          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
            {activeStepIndex === 0 ? (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-muted">Post title</label>
                    <input
                      value={values.title}
                      onChange={(event) => handleTitleChange(event.target.value)}
                      className="w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      placeholder="Leverage the power of AI in your SEO"
                    />
                    {errors.title ? (
                      <p className="mt-1 text-xs text-error">{errors.title}</p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-muted">Slug</label>
                    <input
                      value={values.slug}
                      onChange={(event) => handleFieldChange('slug', event.target.value)}
                      className="w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      placeholder="leverage-the-power-of-ai-in-your-seo"
                    />
                    {errors.slug ? (
                      <p className="mt-1 text-xs text-error">{errors.slug}</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">Short description</label>
                  <textarea
                    value={values.excerpt}
                    onChange={(event) => handleFieldChange('excerpt', event.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                    placeholder="A short teaser for feeds and cards."
                  />
                  {errors.excerpt ? (
                    <p className="mt-1 text-xs text-error">{errors.excerpt}</p>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-muted">Author name</label>
                    <input
                      value={values.authorName}
                      onChange={(event) =>
                        handleFieldChange('authorName', event.target.value)
                      }
                      className="w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      placeholder="Hurman Ali Khan"
                    />
                    {errors.authorName ? (
                      <p className="mt-1 text-xs text-error">{errors.authorName}</p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-muted">Author role</label>
                    <input
                      value={values.authorRole}
                      onChange={(event) =>
                        handleFieldChange('authorRole', event.target.value)
                      }
                      className="w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      placeholder="Digital Marketing Expert"
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
                    placeholder="ai, seo, branding"
                  />
                  <p className="text-[11px] text-text-muted">
                    Separate tags with commas.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">Cover image</label>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/60 px-4 py-2 text-xs font-medium text-text-secondary hover:border-accent/60 hover:text-accent">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) =>
                          handleCoverChange(event.target.files?.[0] ?? null)
                        }
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
                  {errors.coverPreview ? (
                    <p className="mt-1 text-xs text-error">{errors.coverPreview}</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {activeStepIndex === 1 ? (
              <div className="space-y-4">
                <div className="sticky top-0 z-30 flex items-center justify-between  pb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                    Content blocks
                  </h3>
                  <div className="inline-flex flex-col items-end gap-1 rounded-2xl border border-border/70 bg-background/95 px-3 py-2 shadow-lg backdrop-blur">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
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
                </div>

                <div className="space-y-3">
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
                          placeholder="INTRODUCTION"
                        />
                      ) : null}

                      {block.type === 'paragraph' ? (
                        <RichTextEditor // Replace textarea with RichTextEditor
                          value={block.text ?? ''}
                          onChange={(htmlContent: string) => // Editor outputs HTML
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
                          <RichTextEditor // Replace textarea with RichTextEditor
                            value={block.text ?? ''}
                            onChange={(htmlContent:string) => // Editor outputs HTML
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
                <div className="rounded-3xl border border-border/60 bg-[#111111] p-6 text-white">
                  <div className="flex flex-col gap-6 lg:flex-row">
                    <aside className="w-full max-w-xs space-y-4 lg:w-64 ">
                      <div className='sticky top-0 space-y-4'>

                      <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 ">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500">
                          <span className="text-sm font-semibold text-white">7D</span>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                            Written by
                          </p>
                          <p className="text-sm font-medium text-white">
                            {values.authorName || 'Team 7D Design'}
                          </p>
                          <p className="text-[11px] text-white/60">
                            {values.authorRole || 'Content Team'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 rounded-2xl bg-white/5 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                          Contents
                        </p>
                        <ul className="space-y-1 text-sm text-white/80">
                          {headingsForContents.map((block) => (
                            <li key={block.id}>{block.heading}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-2 rounded-2xl bg-white/5 p-3 text-[11px] text-white/70">
                        <p>
                          <span className="inline-block h-1 w-10 rounded-full bg-gradient-to-r from-orange-400 to-purple-500" />
                        </p>
                        <p>{estimatedReadTime} mins read</p>
                      </div>
                      </div>
                    </aside>

                    <article className="flex-1 space-y-4">
                      <h1 className="text-3xl font-semibold leading-tight text-white">
                        {values.title || 'Your blog title will appear here'}
                      </h1>
                      <p className="max-w-3xl text-sm text-white/70">
                        {values.excerpt ||
                          'Use the previous steps to structure your case-study style blog post.'}
                      </p>

                      {values.coverPreview ? (
                        <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-black/40">
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
                  {isSubmitting ? 'Publishing…' : 'Publish post'}
                </button>
              )}
            </div>
          </footer>
        </form>
      </div>
    </Modal>
  )
}

export default BlogPostFormModal
