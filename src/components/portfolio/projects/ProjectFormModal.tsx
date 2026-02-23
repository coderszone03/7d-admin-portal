import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import Modal from '../../common/Modal'
import ProjectDetailsStep from './steps/step1'
import ProjectOverviewStep from './steps/step2'
import ProjectMediaStep from './steps/step3'
import MockupUploadsStep from './steps/step4'
import TestimonialFooterStep from './steps/step5'
import PreviewStep from './steps/step6'
import {
  MAX_KEYWORDS,
  MAX_MEDIA_ASSET_SIZE,
  MAX_THUMBNAIL_SIZE,
  MEDIA_UPLOAD_MIME_TYPES,
  PROJECT_KEYWORD_OPTIONS,
  type Project,
  type ProjectDetailsFormValues,
  type ProjectDetailsStepPayload,
  type ProjectKeywordOption,
  type ProjectMediaField,
} from './types'

type ProjectFormModalProps = {
  isOpen: boolean
  mode: 'create' | 'edit'
  initialProject: Project | null
  keywordOptions?: ProjectKeywordOption[]
  onClose: () => void
  onSubmit: (payload: ProjectDetailsStepPayload) => Promise<void> | void
}

type FieldErrorKey =
  | 'title'
  | 'year'
  | 'category'
  | 'shortDescription'
  | 'overviewDescription'
  | 'scopeOfWork'
  | 'industries'
  | 'thumbnail'
  | 'keywords'
  | 'clientMockup'
  | 'brandingMockup'
  | 'brandingMockupSecondary'
  | 'badgeName'
  | 'brandTitle'
  | 'brandDescription'
  | 'landscapeMockup'
  | 'websiteMockup'
  | 'websiteUrl'
  | 'websiteTitle'
  | 'websiteDescription'

type MediaFieldKey = ProjectMediaField

const defaultValues: ProjectDetailsFormValues = {
  title: '',
  year: '',
  category: '',
  shortDescription: '',
  overviewDescription: '',
  scopeOfWork: '',
  industries: '',
  keywords: [],
  primaryColor: '#2A2A76',
  secondaryColor: '#C3C3C3',
  accentColor: '#EF5A2B',
  badgeName: '',
  brandTitle: '',
  brandDescription: '',
  landscapeMockupPreview: null,
  websiteMockupPreview: null,
  websiteUrl: '',
  websiteTitle: '',
  websiteDescription: '',
  isWebsiteEnabled: true,
  testimonialFeedback: '',
  testimonialClientName: '',
  testimonialDesignation: '',
  footerMockupPreview: null,
  thumbnailFile: null,
  thumbnailPreview: null,
  clientMockupFile: null,
  clientMockupPreview: null,
  brandingMockupFile: null,
  brandingMockupPreview: null,
  brandingMockupSecondaryFile: null,
  brandingMockupSecondaryPreview: null,
}

const readFileAsDataURL = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

const buildInitialValues = (project: Project | null): ProjectDetailsFormValues => {
  if (!project) {
    return { ...defaultValues }
  }

  const fallbackOverview =
    project.overviewDescription ||
    'This project overview will be expanded with objectives, approach, and key outcomes.'

  const slug = project.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'project'

  const defaultWebsiteUrl = `https://example.com/${slug}`

  return {
    title: project.title,
    year: project.year ?? '',
    category: project.category,
    shortDescription: project.shortDescription,
    overviewDescription: fallbackOverview,
    scopeOfWork: project.scopeOfWork ?? 'Brand identity, website, launch toolkit',
    industries: project.industries ?? 'Brand, digital',
    keywords: project.keywords,
    primaryColor: '#2A2A76',
    secondaryColor: '#C3C3C3',
    accentColor: '#EF5A2B',
    badgeName: 'Extending the brand',
    brandTitle: `${project.title} – Creating a cohesive visual narrative`,
    brandDescription:
      'By redefining the identity and building a cohesive visual system, we aligned messaging, visuals, and touchpoints to create a consistent brand experience.',
    landscapeMockupPreview:
      project.clientMockupUrl ??
      'https://placehold.co/1600x700/222222/666666?text=Landscape+Mockup',
    websiteMockupPreview:
      project.brandingMockupUrl ??
      'https://placehold.co/1600x700/111111/666666?text=Website+Mockup',
    websiteUrl: defaultWebsiteUrl,
    websiteTitle: project.title,
    websiteDescription:
      'We aimed to modernise the brand to increase awareness, with a subtle nod to its previous logo and a modular digital experience.',
    isWebsiteEnabled: true,
    testimonialFeedback:
      '“Seven Design helped us launch a cohesive brand system that lifted conversions and internal confidence across the team.”',
    testimonialClientName: 'Anushka Sharma',
    testimonialDesignation: 'Founder',
    footerMockupPreview:
      project.brandingMockupSecondaryUrl ??
      'https://placehold.co/1600x120/111111/666666?text=Footer+Brand+Strip',
    thumbnailFile: null,
    thumbnailPreview: project.thumbnailUrl,
    clientMockupFile: null,
    clientMockupPreview: project.clientMockupUrl,
    brandingMockupFile: null,
    brandingMockupPreview: project.brandingMockupUrl,
    brandingMockupSecondaryFile: null,
    brandingMockupSecondaryPreview: project.brandingMockupSecondaryUrl,
  }
}

const steps = [
  {
    id: 'details',
    label: 'Project details',
    description: 'Title, category, teaser copy, thumbnail, and keywords.',
  },
  {
    id: 'overview',
    label: 'Project overview',
    description: 'Longer overview, scope of work, and industries.',
  },
  {
    id: 'branding-media',
    label: 'Branding media',
    description: 'Client mockup, branding frames, and brand identity.',
  },
  {
    id: 'mockups',
    label: 'Mockup uploads',
    description: 'Landscape and website mockups, live URL, and visibility.',
  },
  {
    id: 'testimonial',
    label: 'Testimonials & footer',
    description: 'Client feedback and a footer brand strip.',
  },
  {
    id: 'preview',
    label: 'Preview & submit',
    description: 'Review a hero-style preview before saving.',
  },
]

const ProjectFormModal = ({
  isOpen,
  mode,
  initialProject,
  keywordOptions = PROJECT_KEYWORD_OPTIONS,
  onClose,
  onSubmit,
}: ProjectFormModalProps) => {
  const [values, setValues] = useState<ProjectDetailsFormValues>(() => buildInitialValues(initialProject))
  const [errors, setErrors] = useState<Partial<Record<FieldErrorKey, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setSubmitting] = useState(false)
  const [activeStepIndex, setActiveStepIndex] = useState(0)

  const fileInputResetToken = useRef(0)
  const clientMockupInputResetToken = useRef(0)
  const brandingMockupInputResetToken = useRef(0)
  const brandingMockupSecondaryInputResetToken = useRef(0)

  useEffect(() => {
    if (!isOpen) {
      return
    }
    setValues(buildInitialValues(initialProject))
    setErrors({})
    setFormError(null)
    fileInputResetToken.current += 1
    clientMockupInputResetToken.current += 1
    brandingMockupInputResetToken.current += 1
    brandingMockupSecondaryInputResetToken.current += 1
    setActiveStepIndex(0)
  }, [initialProject, isOpen])

  const handleFieldChange = <
    K extends
      | 'title'
      | 'year'
      | 'category'
      | 'shortDescription'
      | 'overviewDescription'
      | 'scopeOfWork'
      | 'industries'
      | 'badgeName'
      | 'brandTitle'
      | 'brandDescription'
      | 'websiteUrl'
      | 'websiteTitle'
      | 'websiteDescription'
      | 'testimonialFeedback'
      | 'testimonialClientName'
      | 'testimonialDesignation',
  >(
    field: K,
    value: ProjectDetailsFormValues[K],
  ) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }))
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }))
  }

  const handleKeywordsToggle = (keyword: string) => {
    setValues((prev) => {
      const isSelected = prev.keywords.includes(keyword)
      if (isSelected) {
        return {
          ...prev,
          keywords: prev.keywords.filter((item) => item !== keyword),
        }
      }
      if (prev.keywords.length >= MAX_KEYWORDS) {
        return prev
      }
      return {
        ...prev,
        keywords: [...prev.keywords, keyword],
      }
    })
    setErrors((prev) => ({
      ...prev,
      keywords: undefined,
    }))
  }

  const handleColorChange = (
    field: 'primaryColor' | 'secondaryColor' | 'accentColor',
    value: string,
  ) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleLandscapeMockupChange = (preview: string | null) => {
    setValues((prev) => ({
      ...prev,
      landscapeMockupPreview: preview,
    }))
  }

  const handleWebsiteMockupChange = (preview: string | null) => {
    setValues((prev) => ({
      ...prev,
      websiteMockupPreview: preview,
    }))
  }

  const handleWebsiteVisibilityToggle = () => {
    setValues((prev) => ({
      ...prev,
      isWebsiteEnabled: !prev.isWebsiteEnabled,
    }))
  }

  const handleThumbnailChange = async (file: File | null) => {
    if (!file) {
      setValues((prev) => ({
        ...prev,
        thumbnailFile: null,
        thumbnailPreview: initialProject?.thumbnailUrl ?? null,
      }))
      setErrors((prev) => ({
        ...prev,
        thumbnail: undefined,
      }))
      fileInputResetToken.current += 1
      return
    }

    const mime = file.type.toLowerCase()
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(mime)) {
      setErrors((prev) => ({
        ...prev,
        thumbnail: 'Thumbnail must be a JPG, PNG, or WebP image.',
      }))
      fileInputResetToken.current += 1
      return
    }

    if (file.size > MAX_THUMBNAIL_SIZE) {
      setErrors((prev) => ({
        ...prev,
        thumbnail: 'Thumbnail must be 2MB or smaller.',
      }))
      fileInputResetToken.current += 1
      return
    }

    try {
      const preview = await readFileAsDataURL(file)
      setValues((prev) => ({
        ...prev,
        thumbnailFile: file,
        thumbnailPreview: preview,
      }))
      setErrors((prev) => ({
        ...prev,
        thumbnail: undefined,
      }))
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        thumbnail: error instanceof Error ? error.message : 'Failed to process thumbnail.',
      }))
    }
  }

  const handleThumbnailRemove = () => {
    setValues((prev) => ({
      ...prev,
      thumbnailFile: null,
      thumbnailPreview: null,
    }))
    setErrors((prev) => ({
      ...prev,
      thumbnail: undefined,
    }))
    fileInputResetToken.current += 1
  }

  const getMediaFieldLabel = (field: MediaFieldKey) =>
    field === 'clientMockup' ? 'Client project mockup' : 'Branding mockup'

  const bumpMediaInputResetToken = (field: MediaFieldKey) => {
    if (field === 'clientMockup') {
      clientMockupInputResetToken.current += 1
    } else if (field === 'brandingMockup') {
      brandingMockupInputResetToken.current += 1
    } else {
      brandingMockupSecondaryInputResetToken.current += 1
    }
  }

  const handleMediaAssetChange = async (field: MediaFieldKey, file: File | null) => {
    if (!file) {
      setValues((prev) => {
        if (field === 'clientMockup') {
          return { ...prev, clientMockupFile: null, clientMockupPreview: initialProject?.clientMockupUrl ?? null }
        }
        if (field === 'brandingMockup') {
          return { ...prev, brandingMockupFile: null, brandingMockupPreview: initialProject?.brandingMockupUrl ?? null }
        }
        return {
          ...prev,
          brandingMockupSecondaryFile: null,
          brandingMockupSecondaryPreview: initialProject?.brandingMockupSecondaryUrl ?? null,
        }
      })
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }))
      bumpMediaInputResetToken(field)
      return
    }

    const mime = file.type.toLowerCase()
    if (!MEDIA_UPLOAD_MIME_TYPES.includes(mime)) {
      setErrors((prev) => ({
        ...prev,
        [field]: `${getMediaFieldLabel(field)} must be PNG, JPG, or GIF.`,
      }))
      bumpMediaInputResetToken(field)
      return
    }

    if (file.size > MAX_MEDIA_ASSET_SIZE) {
      setErrors((prev) => ({
        ...prev,
        [field]: `${getMediaFieldLabel(field)} must be 2MB or smaller.`,
      }))
      bumpMediaInputResetToken(field)
      return
    }

    try {
      const preview = await readFileAsDataURL(file)
      setValues((prev) => {
        if (field === 'clientMockup') {
          return { ...prev, clientMockupFile: file, clientMockupPreview: preview }
        }
        if (field === 'brandingMockup') {
          return { ...prev, brandingMockupFile: file, brandingMockupPreview: preview }
        }
        return { ...prev, brandingMockupSecondaryFile: file, brandingMockupSecondaryPreview: preview }
      })
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }))
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [field]: error instanceof Error ? error.message : `Failed to process ${getMediaFieldLabel(field).toLowerCase()}.`,
      }))
      bumpMediaInputResetToken(field)
    }
  }

  const handleMediaAssetRemove = (field: MediaFieldKey) => {
    setValues((prev) => {
      if (field === 'clientMockup') {
        return { ...prev, clientMockupFile: null, clientMockupPreview: null }
      }
      if (field === 'brandingMockup') {
        return { ...prev, brandingMockupFile: null, brandingMockupPreview: null }
      }
      return { ...prev, brandingMockupSecondaryFile: null, brandingMockupSecondaryPreview: null }
    })
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }))
    bumpMediaInputResetToken(field)
  }

  const validateDetailsStep = () => {
    const nextErrors: Partial<Record<FieldErrorKey, string>> = {}
    const trimmedTitle = values.title.trim()
    const trimmedYear = values.year.trim()
    const trimmedDescription = values.shortDescription.trim()

    if (!trimmedTitle) {
      nextErrors.title = 'Project title is required.'
    } else if (trimmedTitle.length < 3) {
      nextErrors.title = 'Project title must be at least 3 characters.'
    }

    if (!values.category) {
      nextErrors.category = 'Select a category.'
    }

    if (!trimmedYear) {
      nextErrors.year = 'Select a year.'
    }

    if (!trimmedDescription) {
      nextErrors.shortDescription = 'Short description is required.'
    }

    if (!values.keywords.length) {
      nextErrors.keywords = 'Select at least one keyword.'
    }

    if (!values.thumbnailPreview) {
      nextErrors.thumbnail = 'Upload a thumbnail image.'
    }

    return nextErrors
  }

  const validateOverviewStep = () => {
    const nextErrors: Partial<Record<FieldErrorKey, string>> = {}
    const trimmedOverview = values.overviewDescription.trim()
    const trimmedScope = values.scopeOfWork.trim()
    const trimmedIndustries = values.industries.trim()

    if (!trimmedOverview) {
      nextErrors.overviewDescription = 'Overview description is required.'
    }

    if (!trimmedScope) {
      nextErrors.scopeOfWork = 'Scope of work is required.'
    }

    if (!trimmedIndustries) {
      nextErrors.industries = 'Industries field is required.'
    }

    return nextErrors
  }

  const validateMediaStep = () => {
    const nextErrors: Partial<Record<FieldErrorKey, string>> = {}

    if (!values.clientMockupPreview) {
      nextErrors.clientMockup = 'Upload a client project mockup.'
    }

    if (!values.brandingMockupPreview) {
      nextErrors.brandingMockup = 'Upload a branding mockup.'
    }

    const trimmedBadge = values.badgeName.trim()
    const trimmedBrandTitle = values.brandTitle.trim()
    const trimmedBrandDescription = values.brandDescription.trim()

    if (!trimmedBadge) {
      nextErrors.badgeName = 'Badge name is required.'
    }

    if (!trimmedBrandTitle) {
      nextErrors.brandTitle = 'Brand title is required.'
    }

    if (!trimmedBrandDescription) {
      nextErrors.brandDescription = 'Brand description is required.'
    }

    return nextErrors
  }

  const validateMockupsStep = () => {
    const nextErrors: Partial<Record<FieldErrorKey, string>> = {}

    if (!values.landscapeMockupPreview) {
      nextErrors.landscapeMockup = 'Upload a landscape mockup.'
    }

    if (!values.websiteMockupPreview) {
      nextErrors.websiteMockup = 'Upload a website mockup.'
    }

    const trimmedUrl = values.websiteUrl.trim()
    const trimmedTitle = values.websiteTitle.trim()
    const trimmedDescription = values.websiteDescription.trim()

    if (!trimmedUrl) {
      nextErrors.websiteUrl = 'Website URL is required.'
    }

    if (!trimmedTitle) {
      nextErrors.websiteTitle = 'Website title is required.'
    }

    if (!trimmedDescription) {
      nextErrors.websiteDescription = 'Website description is required.'
    }

    return nextErrors
  }

  const isKeywordLimitReached = useMemo(
    () => values.keywords.length >= MAX_KEYWORDS,
    [values.keywords.length],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setFormError(null)

    // Step 1 – basic details
    if (activeStepIndex === 0) {
      const detailsErrors = validateDetailsStep()

      if (
        detailsErrors.title ||
        detailsErrors.year ||
        detailsErrors.category ||
        detailsErrors.shortDescription ||
        detailsErrors.thumbnail ||
        detailsErrors.keywords
      ) {
        setErrors(detailsErrors)
        return
      }

      setErrors({})
      setActiveStepIndex(1)
      return
    }

    // Step 2 – overview
    if (activeStepIndex === 1) {
      const overviewErrors = validateOverviewStep()

      if (
        overviewErrors.overviewDescription ||
        overviewErrors.scopeOfWork ||
        overviewErrors.industries
      ) {
        setErrors(overviewErrors)
        return
      }

      setErrors({})
      setActiveStepIndex(2)
      return
    }

    // Step 3 – branding media
    if (activeStepIndex === 2) {
      const mediaErrors = validateMediaStep()

      if (
        mediaErrors.clientMockup ||
        mediaErrors.brandingMockup ||
        mediaErrors.badgeName ||
        mediaErrors.brandTitle ||
        mediaErrors.brandDescription
      ) {
        setErrors(mediaErrors)
        return
      }

      setErrors({})
      setActiveStepIndex(3)
      return
    }

    // Step 4 – mockup uploads
    if (activeStepIndex === 3) {
      const mockupErrors = validateMockupsStep()

      if (
        mockupErrors.landscapeMockup ||
        mockupErrors.websiteMockup ||
        mockupErrors.websiteUrl ||
        mockupErrors.websiteTitle ||
        mockupErrors.websiteDescription
      ) {
        setErrors(mockupErrors)
        return
      }

      setErrors({})
      setActiveStepIndex(4)
      return
    }

    // Step 5 – testimonials & footer (no extra validations yet)
    if (activeStepIndex === 4) {
      setErrors({})
      setActiveStepIndex(5)
      return
    }

    // Step 6 – submit

    const trimmedOverview = values.overviewDescription.trim()
    const trimmedScope = values.scopeOfWork.trim()
    const trimmedIndustries = values.industries.trim()

    setErrors({})
    setSubmitting(true)

    try {
      const payload: ProjectDetailsStepPayload = {
        title: values.title.trim(),
        year: values.year.trim(),
        category: values.category as ProjectDetailsStepPayload['category'],
        shortDescription: values.shortDescription.trim(),
        overviewDescription: trimmedOverview,
        scopeOfWork: trimmedScope,
        industries: trimmedIndustries,
        keywords: values.keywords.slice(0, MAX_KEYWORDS),
        thumbnailDataUrl: values.thumbnailPreview ?? '',
        clientMockupDataUrl: values.clientMockupPreview ?? '',
        brandingMockupDataUrl: values.brandingMockupPreview ?? '',
        brandingMockupSecondaryDataUrl: values.brandingMockupSecondaryPreview ?? '',
      }

      await onSubmit(payload)
      onClose()
      setValues(buildInitialValues(null))
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save changes.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      fullScreen
      className="overflow-hidden"
      overlayClassName="bg-black/40 dark:bg-black/70"
    >
      <div className="flex h-full flex-col overflow-hidden bg-white lg:flex-row">
        <aside className="hidden w-full max-w-[320px] flex-col border-b border-slate-200/60 bg-gradient-to-b from-white via-[#f6f8fb] to-[#edf1fb] px-8 py-10 text-slate-900 lg:flex lg:border-b-0 lg:border-r dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 dark:text-slate-50">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
              {mode === 'create' ? 'New Project' : 'Edit Project'}
            </p>
            <h2 className="mt-3 text-3xl font-semibold">Project Builder</h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Follow the guided flow to capture story, visuals, and metadata for your portfolio entry.
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
                        ? 'border-[#4f54e0] bg-[#eef0ff] text-[#4f54e0] shadow-[0_12px_30px_-25px_rgba(79,84,224,0.65)] dark:bg-[#4f54e0]/25'
                        : isCompleted
                          ? 'border-[#4f54e0]/50 bg-[#e1e4fc] text-[#4f54e0] dark:bg-[#4f54e0]/15'
                          : 'border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500',
                    ].join(' ')}
                  >
                    {index + 1}
                  </span>
                  {index < steps.length - 1 ? (
                    <span className="absolute left-3.5 top-8 bottom-[-28px] w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
                  ) : null}
                  <p className={`text-sm font-semibold ${isCurrent ? 'text-slate-900 dark:text-slate-50' : 'text-slate-600 dark:text-slate-300'}`}>{step.label}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{step.description}</p>
                </li>
              )
            })}
          </ol>
          <div className="mt-auto rounded-2xl border border-slate-200 bg-white/90 p-4 text-xs text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <p className="font-semibold text-slate-900 dark:text-slate-50">Pro tip</p>
            <p className="mt-1">
              Keep copy concise and visuals under 2MB for a polished review experience.
            </p>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col bg-white dark:bg-slate-950">
          <header className="border-b border-slate-200 px-5 py-5 sm:px-8 sm:py-6 dark:border-slate-800">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                    Step {activeStepIndex + 1} / {steps.length}
                  </p>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 sm:text-2xl">
                    {steps[activeStepIndex]?.label}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                    {steps[activeStepIndex]?.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-slate-400 hover:text-slate-700 dark:border-slate-700 dark:text-slate-500 dark:hover:border-slate-500 dark:hover:text-slate-100"
                  aria-label="Close project form"
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
            </div>
          </header>

          <div className="flex flex-1 min-h-0 flex-col overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
            {activeStepIndex === 0 ? (
              <ProjectDetailsStep
                values={values}
                errors={errors}
                keywordOptions={keywordOptions}
                isKeywordLimitReached={isKeywordLimitReached}
                fileInputResetKey={fileInputResetToken.current}
                onFieldChange={handleFieldChange}
                onKeywordsToggle={handleKeywordsToggle}
                onThumbnailChange={handleThumbnailChange}
                onThumbnailRemove={handleThumbnailRemove}
              />
            ) : null}

            {activeStepIndex === 1 ? (
              <ProjectOverviewStep values={values} errors={errors} onFieldChange={handleFieldChange} />
            ) : null}

            {activeStepIndex === 2 ? (
              <ProjectMediaStep
                values={values}
                errors={{
                  clientMockup: errors.clientMockup,
                  brandingMockup: errors.brandingMockup,
                  brandingMockupSecondary: errors.brandingMockupSecondary,
                  badgeName: errors.badgeName,
                  brandTitle: errors.brandTitle,
                  brandDescription: errors.brandDescription,
                }}
                fileInputResetKeys={{
                  clientMockup: clientMockupInputResetToken.current,
                  brandingMockup: brandingMockupInputResetToken.current,
                  brandingMockupSecondary: brandingMockupSecondaryInputResetToken.current,
                }}
                onAssetChange={handleMediaAssetChange}
                onAssetRemove={handleMediaAssetRemove}
                onColorChange={handleColorChange}
                onFieldChange={handleFieldChange}
              />
            ) : null}

            {activeStepIndex === 3 ? (
              <MockupUploadsStep
                values={values}
                onLandscapeMockupChange={handleLandscapeMockupChange}
                onWebsiteMockupChange={handleWebsiteMockupChange}
                onWebsiteFieldChange={handleFieldChange}
                onWebsiteVisibilityToggle={handleWebsiteVisibilityToggle}
                errors={{
                  landscapeMockup: errors.landscapeMockup,
                  websiteMockup: errors.websiteMockup,
                  websiteUrl: errors.websiteUrl,
                  websiteTitle: errors.websiteTitle,
                  websiteDescription: errors.websiteDescription,
                }}
              />
            ) : null}

            {activeStepIndex === 4 ? (
              <TestimonialFooterStep
                values={values}
                onFieldChange={handleFieldChange}
                onFooterMockupChange={(preview) =>
                  setValues((prev) => ({ ...prev, footerMockupPreview: preview }))
                }
              />
            ) : null}

            {activeStepIndex === 5 ? (
              <PreviewStep values={values} />
            ) : null}

            {formError ? (
              <p className="mt-6 rounded-2xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">{formError}</p>
            ) : null}
          </div>

          <footer className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 dark:border-slate-800 dark:bg-slate-950">
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
                  setActiveStepIndex((prev) => Math.max(0, prev - 1))
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
                  className="inline-flex items-center justify-center rounded-2xl bg-[#4f54e0] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_32px_-20px_rgba(79,84,224,0.45)] transition hover:bg-[#4448c9]"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#111322] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_32px_-20px_rgba(15,17,33,0.45)] transition hover:bg-[#0c0e1b] disabled:cursor-not-allowed disabled:bg-[#111322]/60"
                >
                  {isSubmitting ? 'Saving…' : 'Save & Continue'}
                </button>
              )}
            </div>
          </footer>
        </form>
      </div>
    </Modal>
  )
}

export default ProjectFormModal
