import { useEffect, useState, type FormEvent } from 'react'
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
                  <textarea
                    value={values.aboutCompany}
                    onChange={(e) => setField('aboutCompany', e.target.value)}
                    rows={5}
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
                  label={`What You’ll Do — items (max ${MAX_LIST_ITEMS})`}
                  items={values.whatYoullDoItems}
                  onChange={(i, v) => updateListItem('whatYoullDoItems', i, v)}
                  onAdd={() => addListItem('whatYoullDoItems')}
                  onRemove={(i) => removeListItem('whatYoullDoItems', i)}
                  addDisabled={values.whatYoullDoItems.length >= MAX_LIST_ITEMS}
                  placeholder="e.g. Content Strategy & Calendar Planning"
                  error={errors.whatYoullDoItemsGroup}
                />
              </div>
            ) : null}

            {activeStepIndex === 2 ? (
              <div className="space-y-8">
                <ListEditor
                  label={`What You Bring * (max ${MAX_LIST_ITEMS})`}
                  items={values.whatYouBring}
                  onChange={(i, v) => updateListItem('whatYouBring', i, v)}
                  onAdd={() => addListItem('whatYouBring')}
                  onRemove={(i) => removeListItem('whatYouBring', i)}
                  addDisabled={values.whatYouBring.length >= MAX_LIST_ITEMS}
                  placeholder="e.g. 2+ years in brand communication"
                  error={errors.whatYouBringGroup}
                />
                <ListEditor
                  label={`Why 7D Design? * (max ${MAX_LIST_ITEMS})`}
                  items={values.why7d}
                  onChange={(i, v) => updateListItem('why7d', i, v)}
                  onAdd={() => addListItem('why7d')}
                  onRemove={(i) => removeListItem('why7d', i)}
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
                  <textarea
                    value={values.readyToJoinDescription}
                    onChange={(e) =>
                      setField('readyToJoinDescription', e.target.value)
                    }
                    rows={3}
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

type ListEditorProps = {
  label: string
  items: string[]
  onChange: (index: number, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
  addDisabled?: boolean
  placeholder?: string
  error?: string
}

const ListEditor = ({
  label,
  items,
  onChange,
  onAdd,
  onRemove,
  addDisabled,
  placeholder,
  error,
}: ListEditorProps) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <button
        type="button"
        onClick={onAdd}
        disabled={addDisabled}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-[#4f54e0] hover:text-[#4f54e0] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
      >
        + Add item
      </button>
    </div>
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={item}
            onChange={(e) => onChange(index, e.target.value)}
            placeholder={placeholder}
            className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#4f54e0] focus:ring-2 focus:ring-[#4f54e0]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
          />
          <button
            type="button"
            onClick={() => onRemove(index)}
            disabled={items.length <= 1}
            aria-label={`Remove ${label.toLowerCase()} item`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-rose-900/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="h-3.5 w-3.5"
            >
              <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
    {error ? <p className="text-xs text-rose-500">{error}</p> : null}
  </div>
)

export default JobPostFormModal
