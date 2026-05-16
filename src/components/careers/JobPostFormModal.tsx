import { useEffect, useRef, useState, type FormEvent } from 'react'
import Modal from '../common/Modal'
import type {
  EmploymentType,
  JobPost,
  JobStatus,
} from '../../assets/constants/jobPosts'

export type JobPostFormMode = 'create' | 'edit'

type JobPostFormModalProps = {
  isOpen: boolean
  mode: JobPostFormMode
  initialPost: JobPost | null
  isSubmitting?: boolean
  onClose: () => void
  onSubmit: (values: JobPostFormValues) => void | Promise<void>
}

export type WorkMode = 'remote' | 'hybrid' | 'onsite'

export type JobPostFormValues = {
  title: string
  department: string
  workMode: WorkMode
  city: string
  employmentType: EmploymentType
  aboutCompany: string
  whatYoullDoSubtitle: string
  whatYoullDoIntro: string
  whatYoullDoItems: string[]
  whatYouBring: string[]
  why7d: string[]
  readyToJoinDescription: string
  status: JobStatus
}

const MAX_LIST_ITEMS = 10

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
]

const JOB_STATUSES: { value: JobStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Published' },
  { value: 'filled', label: 'Position filled' },
]

const WORK_MODES: { value: WorkMode; label: string }[] = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'In office' },
]

const parseLocation = (location: string): { workMode: WorkMode; city: string } => {
  const trimmed = (location || '').trim()
  const lower = trimmed.toLowerCase()
  if (!trimmed) return { workMode: 'remote', city: '' }
  if (lower === 'remote') return { workMode: 'remote', city: '' }
  if (lower.startsWith('hybrid')) {
    const rest = trimmed.replace(/^hybrid\s*[—\-·,:]?\s*/i, '').trim()
    return { workMode: 'hybrid', city: rest }
  }
  if (
    lower.startsWith('in office') ||
    lower.startsWith('in-office') ||
    lower.startsWith('onsite')
  ) {
    const rest = trimmed
      .replace(/^(in[\s-]?office|onsite)\s*[—\-·,:]?\s*/i, '')
      .trim()
    return { workMode: 'onsite', city: rest }
  }
  return { workMode: 'onsite', city: trimmed }
}

export const combineLocation = (workMode: WorkMode, city: string): string => {
  const trimmed = city.trim()
  if (workMode === 'remote') return 'Remote'
  if (workMode === 'hybrid') return trimmed ? `Hybrid — ${trimmed}` : 'Hybrid'
  return trimmed || 'In office'
}

const emptyValues = (): JobPostFormValues => ({
  title: '',
  department: '',
  workMode: 'remote',
  city: '',
  employmentType: 'full-time',
  aboutCompany: '',
  whatYoullDoSubtitle: '',
  whatYoullDoIntro: '',
  whatYoullDoItems: [''],
  whatYouBring: [''],
  why7d: [''],
  readyToJoinDescription: '',
  status: 'open',
})

const postToValues = (post: JobPost): JobPostFormValues => {
  const { workMode, city } = parseLocation(post.location)
  return {
    title: post.title,
    department: post.department,
    workMode,
    city,
    employmentType: post.employmentType,
    aboutCompany: post.aboutCompany,
    whatYoullDoSubtitle: post.whatYoullDo.subtitle ?? '',
    whatYoullDoIntro: post.whatYoullDo.intro ?? '',
    whatYoullDoItems: post.whatYoullDo.items.length
      ? [...post.whatYoullDo.items]
      : [''],
    whatYouBring: post.whatYouBring.length ? [...post.whatYouBring] : [''],
    why7d: post.why7d.length ? [...post.why7d] : [''],
    readyToJoinDescription: post.readyToJoinDescription,
    status: post.status,
  }
}

const steps = [
  {
    id: 'basics',
    label: 'Basics',
    description: 'Title, department, work mode, city, and employment type.',
  },
  {
    id: 'story',
    label: 'About & What You’ll Do',
    description: 'Company intro and the day-to-day.',
  },
  {
    id: 'fit',
    label: 'What You Bring & Why 7D Design',
    description: 'Requirements and culture highlights.',
  },
  {
    id: 'meta',
    label: 'Ready to join & status',
    description: 'Closing apply copy and posting status.',
  },
]

type FieldErrorKey =
  | keyof JobPostFormValues
  | 'whatYoullDoItemsGroup'
  | 'whatYouBringGroup'
  | 'why7dGroup'

type ListField = 'whatYoullDoItems' | 'whatYouBring' | 'why7d'

const JobPostFormModal = ({
  isOpen,
  mode,
  initialPost,
  isSubmitting = false,
  onClose,
  onSubmit,
}: JobPostFormModalProps) => {
  const [values, setValues] = useState<JobPostFormValues>(() =>
    initialPost ? postToValues(initialPost) : emptyValues(),
  )
  const [errors, setErrors] = useState<Partial<Record<FieldErrorKey, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [activeStepIndex, setActiveStepIndex] = useState(0)

  useEffect(() => {
    if (!isOpen) return
    setValues(initialPost ? postToValues(initialPost) : emptyValues())
    setErrors({})
    setFormError(null)
    setActiveStepIndex(0)
  }, [initialPost, isOpen])

  const setField = <K extends keyof JobPostFormValues>(
    field: K,
    value: JobPostFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const updateListItem = (field: ListField, index: number, value: string) => {
    setValues((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }))
  }

  const addListItem = (field: ListField) => {
    setValues((prev) =>
      prev[field].length >= MAX_LIST_ITEMS
        ? prev
        : { ...prev, [field]: [...prev[field], ''] },
    )
  }

  const removeListItem = (field: ListField, index: number) => {
    setValues((prev) => ({
      ...prev,
      [field]:
        prev[field].length > 1 ? prev[field].filter((_, i) => i !== index) : prev[field],
    }))
  }

  const insertListItemAfter = (field: ListField, index: number) => {
    setValues((prev) => {
      if (prev[field].length >= MAX_LIST_ITEMS) return prev
      const next = [...prev[field]]
      next.splice(index + 1, 0, '')
      return { ...prev, [field]: next }
    })
  }

  const reorderListItem = (field: ListField, fromIndex: number, toIndex: number) => {
    setValues((prev) => {
      if (fromIndex === toIndex) return prev
      const list = prev[field]
      if (
        fromIndex < 0 ||
        fromIndex >= list.length ||
        toIndex < 0 ||
        toIndex >= list.length
      )
        return prev
      const next = [...list]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return { ...prev, [field]: next }
    })
  }

  const validateStep = (index: number): Partial<Record<FieldErrorKey, string>> => {
    const next: Partial<Record<FieldErrorKey, string>> = {}
    if (index === 0) {
      if (!values.title.trim()) next.title = 'Job title is required.'
      if (!values.department.trim()) next.department = 'Department is required.'
      if (values.workMode !== 'remote' && !values.city.trim()) {
        next.city = 'City is required for hybrid and in-office roles.'
      }
    }
    if (index === 1) {
      if (!values.aboutCompany.trim())
        next.aboutCompany = 'About section is required.'
      const items = values.whatYoullDoItems.map((v) => v.trim()).filter(Boolean)
      if (items.length > MAX_LIST_ITEMS) {
        next.whatYoullDoItemsGroup = `Max ${MAX_LIST_ITEMS} items.`
      }
    }
    if (index === 2) {
      const bring = values.whatYouBring.map((v) => v.trim()).filter(Boolean)
      const why = values.why7d.map((v) => v.trim()).filter(Boolean)
      if (bring.length === 0) next.whatYouBringGroup = 'Add at least one item.'
      if (bring.length > MAX_LIST_ITEMS)
        next.whatYouBringGroup = `Max ${MAX_LIST_ITEMS} items.`
      if (why.length === 0) next.why7dGroup = 'Add at least one reason.'
      if (why.length > MAX_LIST_ITEMS) next.why7dGroup = `Max ${MAX_LIST_ITEMS} items.`
    }
    if (index === 3) {
      if (!values.readyToJoinDescription.trim())
        next.readyToJoinDescription = 'Ready-to-join description is required.'
    }
    return next
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return
    setFormError(null)

    if (activeStepIndex < steps.length - 1) {
      const stepErrors = validateStep(activeStepIndex)
      if (Object.values(stepErrors).some(Boolean)) {
        setErrors(stepErrors)
        return
      }
      setErrors({})
      setActiveStepIndex((i) => i + 1)
      return
    }

    const allErrors: Partial<Record<FieldErrorKey, string>> = {
      ...validateStep(0),
      ...validateStep(1),
      ...validateStep(2),
      ...validateStep(3),
    }
    if (Object.values(allErrors).some(Boolean)) {
      setErrors(allErrors)
      setFormError('Some required fields are missing.')
      return
    }
    onSubmit(values)
  }

  const handleBack = () => {
    setFormError(null)
    setActiveStepIndex((i) => Math.max(0, i - 1))
  }

  const inputClass =
    'h-11 w-full rounded-xl border border-border/60 bg-surface px-3 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20'
  const textareaClass =
    'w-full rounded-xl border border-border/60 bg-surface px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20'
  const labelClass =
    'text-xs font-semibold uppercase tracking-[0.16em] text-text-muted'
  const errorClass = 'mt-1 text-xs text-danger'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      fullScreen
      className="overflow-hidden"
      overlayClassName="bg-black/40 dark:bg-black/70"
    >
      <div className="flex h-full flex-col overflow-hidden bg-white lg:flex-row dark:bg-slate-950">
        <aside className="hidden w-full max-w-[320px] flex-col border-b border-slate-200/60 bg-gradient-to-b from-white via-[#f6f8fb] to-[#edf1fb] px-8 py-10 text-slate-900 lg:flex lg:border-b-0 lg:border-r dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 dark:text-slate-50">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
              {mode === 'create' ? 'New Job' : 'Edit Job'}
            </p>
            <h2 className="mt-3 text-3xl font-semibold">Job Builder</h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Fill in the basics, tell the story, and close with a clear call to action.
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
                    <span
                      className="absolute left-3.5 top-8 bottom-[-28px] w-px bg-slate-200 dark:bg-slate-700"
                      aria-hidden="true"
                    />
                  ) : null}
                  <p
                    className={`text-sm font-semibold ${
                      isCurrent
                        ? 'text-slate-900 dark:text-slate-50'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {step.description}
                  </p>
                </li>
              )
            })}
          </ol>
        </aside>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col bg-white dark:bg-slate-950"
        >
          <header className="border-b border-slate-200 px-5 py-5 sm:px-8 sm:py-6 dark:border-slate-800">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-slate-400 hover:text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-500 dark:hover:border-slate-500 dark:hover:text-slate-100"
                aria-label="Close job form"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="h-5 w-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
            {activeStepIndex === 0 ? (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Title *</label>
                    <input
                      type="text"
                      value={values.title}
                      onChange={(e) => setField('title', e.target.value)}
                      className={inputClass}
                      maxLength={200}
                      placeholder="Brand Communication Manager"
                    />
                    {errors.title ? <p className={errorClass}>{errors.title}</p> : null}
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Department *</label>
                    <input
                      type="text"
                      value={values.department}
                      onChange={(e) => setField('department', e.target.value)}
                      className={inputClass}
                      maxLength={100}
                      placeholder="Brand Solutions"
                    />
                    {errors.department ? (
                      <p className={errorClass}>{errors.department}</p>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Work mode *</label>
                    <select
                      value={values.workMode}
                      onChange={(e) => setField('workMode', e.target.value as WorkMode)}
                      className={inputClass}
                    >
                      {WORK_MODES.map((w) => (
                        <option key={w.value} value={w.value}>
                          {w.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>
                      City {values.workMode === 'remote' ? '(optional)' : '*'}
                    </label>
                    <input
                      type="text"
                      value={values.city}
                      onChange={(e) => setField('city', e.target.value)}
                      className={inputClass}
                      maxLength={100}
                      placeholder={
                        values.workMode === 'remote'
                          ? 'Anywhere'
                          : 'Bengaluru, Hyderabad…'
                      }
                      disabled={values.workMode === 'remote'}
                    />
                    {errors.city ? <p className={errorClass}>{errors.city}</p> : null}
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Employment type</label>
                    <select
                      value={values.employmentType}
                      onChange={(e) =>
                        setField('employmentType', e.target.value as EmploymentType)
                      }
                      className={inputClass}
                    >
                      {EMPLOYMENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : null}

            {activeStepIndex === 1 ? (
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className={labelClass}>About the company *</label>
                  <AutoGrowTextarea
                    value={values.aboutCompany}
                    onChange={(v) => setField('aboutCompany', v)}
                    minRows={5}
                    className={textareaClass}
                    placeholder="Who you are, what you do, and the vibe of the place."
                  />
                  {errors.aboutCompany ? (
                    <p className={errorClass}>{errors.aboutCompany}</p>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className={labelClass}>What You’ll Do — subtitle</label>
                    <input
                      type="text"
                      value={values.whatYoullDoSubtitle}
                      onChange={(e) =>
                        setField('whatYoullDoSubtitle', e.target.value)
                      }
                      className={inputClass}
                      placeholder="e.g. Client & Team Coordination"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>What You’ll Do — intro</label>
                    <input
                      type="text"
                      value={values.whatYoullDoIntro}
                      onChange={(e) => setField('whatYoullDoIntro', e.target.value)}
                      className={inputClass}
                      placeholder="One line setting up the day-to-day."
                    />
                  </div>
                </div>
                <ListEditor
                  key={`whatYoullDoItems-${initialPost?.id ?? 'new'}`}
                  label="What You’ll Do — items"
                  maxItems={MAX_LIST_ITEMS}
                  items={values.whatYoullDoItems}
                  onChange={(i, v) => updateListItem('whatYoullDoItems', i, v)}
                  onAdd={() => addListItem('whatYoullDoItems')}
                  onInsertAfter={(i) => insertListItemAfter('whatYoullDoItems', i)}
                  onRemove={(i) => removeListItem('whatYoullDoItems', i)}
                  onReorder={(from, to) => reorderListItem('whatYoullDoItems', from, to)}
                  addDisabled={values.whatYoullDoItems.length >= MAX_LIST_ITEMS}
                  placeholder="e.g. Content Strategy & Calendar Planning"
                  error={errors.whatYoullDoItemsGroup}
                />
              </div>
            ) : null}

            {activeStepIndex === 2 ? (
              <div className="space-y-8">
                <ListEditor
                  key={`whatYouBring-${initialPost?.id ?? 'new'}`}
                  label="What You Bring *"
                  maxItems={MAX_LIST_ITEMS}
                  items={values.whatYouBring}
                  onChange={(i, v) => updateListItem('whatYouBring', i, v)}
                  onAdd={() => addListItem('whatYouBring')}
                  onInsertAfter={(i) => insertListItemAfter('whatYouBring', i)}
                  onRemove={(i) => removeListItem('whatYouBring', i)}
                  onReorder={(from, to) => reorderListItem('whatYouBring', from, to)}
                  addDisabled={values.whatYouBring.length >= MAX_LIST_ITEMS}
                  placeholder="e.g. 2+ years in brand communication"
                  error={errors.whatYouBringGroup}
                />
                <ListEditor
                  key={`why7d-${initialPost?.id ?? 'new'}`}
                  label="Why 7D Design? *"
                  maxItems={MAX_LIST_ITEMS}
                  items={values.why7d}
                  onChange={(i, v) => updateListItem('why7d', i, v)}
                  onAdd={() => addListItem('why7d')}
                  onInsertAfter={(i) => insertListItemAfter('why7d', i)}
                  onRemove={(i) => removeListItem('why7d', i)}
                  onReorder={(from, to) => reorderListItem('why7d', from, to)}
                  addDisabled={values.why7d.length >= MAX_LIST_ITEMS}
                  placeholder="e.g. Work on bold brands and high-impact campaigns"
                  error={errors.why7dGroup}
                />
              </div>
            ) : null}

            {activeStepIndex === 3 ? (
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className={labelClass}>Ready to join — description *</label>
                  <AutoGrowTextarea
                    value={values.readyToJoinDescription}
                    onChange={(v) => setField('readyToJoinDescription', v)}
                    minRows={3}
                    className={textareaClass}
                    placeholder="Apply now. Let’s build brands that everyone talks about."
                  />
                  {errors.readyToJoinDescription ? (
                    <p className={errorClass}>{errors.readyToJoinDescription}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Status</label>
                  <select
                    value={values.status}
                    onChange={(e) => setField('status', e.target.value as JobStatus)}
                    className={inputClass}
                  >
                    {JOB_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            {formError ? (
              <p className="mt-6 rounded-xl border border-rose-300/60 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-800/60 dark:bg-rose-900/20 dark:text-rose-300">
                {formError}
              </p>
            ) : null}
          </div>

          <footer className="border-t border-slate-200 px-5 py-4 sm:px-8 sm:py-5 dark:border-slate-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                {activeStepIndex > 0 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100"
                  >
                    Back
                  </button>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-slate-400 hover:text-slate-900 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-100"
                >
                  Cancel
                </button>
                {activeStepIndex < steps.length - 1 ? (
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-xl bg-[#4f54e0] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_18px_32px_-20px_rgba(79,84,224,0.45)] transition hover:bg-[#4448c9]"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center rounded-xl bg-[#111322] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_18px_32px_-20px_rgba(15,17,33,0.45)] transition hover:bg-[#0c0e1b] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting
                      ? mode === 'create'
                        ? 'Creating…'
                        : 'Saving…'
                      : mode === 'create'
                        ? 'Create post'
                        : 'Save changes'}
                  </button>
                )}
              </div>
            </div>
          </footer>
        </form>
      </div>
    </Modal>
  )
}

type AutoGrowTextareaProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minRows?: number
  maxRows?: number
  className?: string
}

// Textarea that grows with its content up to `maxRows`, then allows scrolling
// — the scrollbar only appears while the user is hovering the field and content overflows.
const AutoGrowTextarea = ({
  value,
  onChange,
  placeholder,
  minRows = 3,
  maxRows = 5,
  className = '',
}: AutoGrowTextareaProps) => {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [hasOverflow, setHasOverflow] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Measure one line height from the live element so the cap matches the actual font.
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 24
    const paddingY =
      parseFloat(getComputedStyle(el).paddingTop) +
      parseFloat(getComputedStyle(el).paddingBottom)
    const maxHeight = lineHeight * maxRows + paddingY

    el.style.height = 'auto'
    const target = Math.min(el.scrollHeight, maxHeight)
    el.style.height = `${target}px`
    setHasOverflow(el.scrollHeight > maxHeight)
  }, [value, maxRows])

  const overflowClass = isHovered && hasOverflow ? 'overflow-y-auto' : 'overflow-hidden'

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      placeholder={placeholder}
      rows={minRows}
      className={`resize-none ${overflowClass} ${className}`}
    />
  )
}

type ListEditorRowProps = {
  index: number
  total: number
  value: string
  placeholder?: string
  isDragOver: boolean
  isDragging: boolean
  // Imperative focus signal: any non-zero value that changes triggers a focus.
  focusNonce: number
  onChange: (value: string) => void
  onEnter: () => void
  onBackspaceEmpty: () => void
  onRemove: () => void
  onDragStart: () => void
  onDragOver: () => void
  onDragLeave: () => void
  onDragEnd: () => void
  onDrop: () => void
}

const ListEditorRow = ({
  index,
  total,
  value,
  placeholder,
  isDragOver,
  isDragging,
  focusNonce,
  onChange,
  onEnter,
  onBackspaceEmpty,
  onRemove,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnd,
  onDrop,
}: ListEditorRowProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-grow textarea: collapse to 1 line by default, expand as content grows, cap at ~8 lines.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 24), 192)}px`
  }, [value])

  useEffect(() => {
    if (focusNonce > 0) {
      const el = textareaRef.current
      if (!el) return
      el.focus()
      // Place caret at end so Enter-add-below feels natural.
      const len = el.value.length
      el.setSelectionRange(len, len)
    }
  }, [focusNonce])

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        onDragOver()
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault()
        onDrop()
      }}
      className={[
        'group relative flex items-start gap-1.5 rounded-lg px-1.5 py-1 transition-colors',
        isDragging ? 'opacity-40' : '',
        isDragOver ? 'bg-[#4f54e0]/10 ring-1 ring-[#4f54e0]/40 dark:bg-[#4f54e0]/15' : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40',
      ].join(' ')}
    >
      {/* Drag handle (always visible at low opacity, brightens on hover) */}
      <button
        type="button"
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        aria-label="Reorder item"
        title="Drag to reorder"
        className="mt-1.5 inline-flex h-5 w-4 shrink-0 cursor-grab items-center justify-center text-slate-400 transition hover:text-slate-700 active:cursor-grabbing dark:text-slate-500 dark:hover:text-slate-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
          <circle cx="9" cy="6" r="1.4" />
          <circle cx="15" cy="6" r="1.4" />
          <circle cx="9" cy="12" r="1.4" />
          <circle cx="15" cy="12" r="1.4" />
          <circle cx="9" cy="18" r="1.4" />
          <circle cx="15" cy="18" r="1.4" />
        </svg>
      </button>

      {/* Number gutter */}
      <span
        aria-hidden="true"
        className="mt-1.5 inline-flex w-6 shrink-0 select-none justify-end pr-0.5 text-xs font-medium tabular-nums text-slate-400 dark:text-slate-500"
      >
        {index + 1}.
      </span>

      {/* Auto-grow textarea (no boxed border — feels like one cohesive list) */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            onEnter()
            return
          }
          if (e.key === 'Backspace' && value === '' && total > 1) {
            e.preventDefault()
            onBackspaceEmpty()
          }
        }}
        placeholder={placeholder}
        rows={1}
        className="flex-1 resize-none border-0 bg-transparent px-1 py-1 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0 dark:text-slate-50 dark:placeholder:text-slate-500"
      />

      {/* Remove (visible on hover/focus-within only, never on the last remaining row) */}
      <button
        type="button"
        onClick={onRemove}
        disabled={total <= 1}
        aria-label="Remove item"
        className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 disabled:pointer-events-none disabled:opacity-0 dark:hover:bg-rose-900/20"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className="h-3 w-3"
        >
          <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  )
}

type ListEditorProps = {
  label: string
  items: string[]
  maxItems: number
  onChange: (index: number, value: string) => void
  onAdd: () => void
  onInsertAfter: (index: number) => void
  onRemove: (index: number) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  addDisabled?: boolean
  placeholder?: string
  error?: string
}

const ListEditor = ({
  label,
  items,
  maxItems,
  onChange,
  onAdd,
  onInsertAfter,
  onRemove,
  onReorder,
  addDisabled,
  placeholder,
  error,
}: ListEditorProps) => {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  // Imperative focus signal that bumps every time the user wants a row focused.
  // Plain `focusIndex` would not re-fire when the same index needs focus again
  // (e.g. insert at index 3 twice in a row).
  const [focusRequest, setFocusRequest] = useState<{ index: number; nonce: number } | null>(null)

  const requestFocus = (index: number) => {
    setFocusRequest((prev) => ({ index, nonce: (prev?.nonce ?? 0) + 1 }))
  }

  // Stable per-row keys so React doesn't reuse a textarea DOM node across logical rows
  // when the user reorders or removes items. We mirror every mutation onto this ref
  // (insert/remove/reorder) so each logical item keeps the same key for its lifetime.
  // Length mismatch means our local mirror is out of sync with what the parent seeded
  // (e.g. switching from create → edit, or hot-reloading) — rebuild fresh.
  const keyCounterRef = useRef(0)
  const itemKeysRef = useRef<string[]>([])
  if (itemKeysRef.current.length !== items.length) {
    const next: string[] = []
    for (let i = 0; i < items.length; i += 1) {
      next.push(`row-${(keyCounterRef.current += 1)}`)
    }
    itemKeysRef.current = next
  }

  const handleEnter = (index: number) => {
    if (items.length >= maxItems) return
    // Mirror the insert into the keys ref so the new row keeps a fresh stable key
    // and existing rows retain theirs.
    const newKey = `row-${(keyCounterRef.current += 1)}`
    itemKeysRef.current = [
      ...itemKeysRef.current.slice(0, index + 1),
      newKey,
      ...itemKeysRef.current.slice(index + 1),
    ]
    onInsertAfter(index)
    requestFocus(index + 1)
  }

  const handleBackspaceEmpty = (index: number) => {
    if (items.length <= 1) return
    itemKeysRef.current = itemKeysRef.current.filter((_, i) => i !== index)
    onRemove(index)
    requestFocus(Math.max(0, index - 1))
  }

  const handleRemove = (index: number) => {
    if (items.length <= 1) return
    itemKeysRef.current = itemKeysRef.current.filter((_, i) => i !== index)
    onRemove(index)
  }

  const handleAdd = () => {
    if (addDisabled) return
    const appendIndex = items.length
    itemKeysRef.current = [
      ...itemKeysRef.current,
      `row-${(keyCounterRef.current += 1)}`,
    ]
    onAdd()
    requestFocus(appendIndex)
  }

  const handleDrop = (toIndex: number) => {
    if (draggingIndex === null || draggingIndex === toIndex) {
      setDraggingIndex(null)
      setDragOverIndex(null)
      return
    }
    // Mirror the move so identity follows the data.
    const next = [...itemKeysRef.current]
    const [moved] = next.splice(draggingIndex, 1)
    next.splice(toIndex, 0, moved)
    itemKeysRef.current = next
    onReorder(draggingIndex, toIndex)
    setDraggingIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          {label}
        </label>
        <span className="text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
          {items.length} / {maxItems}
        </span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white py-1.5 dark:border-slate-700 dark:bg-slate-900">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((item, index) => {
            const focusNonce =
              focusRequest && focusRequest.index === index ? focusRequest.nonce : 0
            return (
              <ListEditorRow
                key={itemKeysRef.current[index]}
                index={index}
                total={items.length}
                value={item}
                placeholder={placeholder}
                isDragging={draggingIndex === index}
                isDragOver={dragOverIndex === index && draggingIndex !== index}
                focusNonce={focusNonce}
                onChange={(v) => onChange(index, v)}
                onEnter={() => handleEnter(index)}
                onBackspaceEmpty={() => handleBackspaceEmpty(index)}
                onRemove={() => handleRemove(index)}
                onDragStart={() => setDraggingIndex(index)}
                onDragOver={() => setDragOverIndex(index)}
                onDragLeave={() => {
                  setDragOverIndex((curr) => (curr === index ? null : curr))
                }}
                onDragEnd={() => {
                  setDraggingIndex(null)
                  setDragOverIndex(null)
                }}
                onDrop={() => handleDrop(index)}
              />
            )
          })}
        </div>

        {/* Inline "Add item" affordance — sits flush at the bottom of the list */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={addDisabled}
          className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-400 transition hover:bg-slate-50 hover:text-[#4f54e0] disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-500 dark:hover:bg-slate-800/60 dark:hover:text-[#7d82ff]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          Add item
          <span className="ml-auto text-[10px] uppercase tracking-[0.18em] text-slate-300 dark:text-slate-600">
            Enter ↵
          </span>
        </button>
      </div>

      {error ? <p className="text-xs text-rose-500">{error}</p> : null}
    </div>
  )
}

export default JobPostFormModal
