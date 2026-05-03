import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react'
import Modal from '../../components/common/Modal'
import JobPostFormModal, {
  combineLocation,
  type JobPostFormMode,
  type JobPostFormValues,
} from '../../components/careers/JobPostFormModal'
import type {
  EmploymentType,
  JobPost,
  JobStatus,
} from '../../assets/constants/jobPosts'

type JobPostsTabProps = {
  posts: JobPost[]
  setPosts: (updater: (prev: JobPost[]) => JobPost[]) => void
  applicantsCountByPost: Record<string, number>
  selectedPostId: string | null
  setSelectedPostId: (id: string | null) => void
}

const secondaryButtonClasses =
  'inline-flex h-10 items-center justify-center rounded-lg border border-border/60 px-4 text-sm font-semibold text-text-secondary transition hover:border-[#6366f1] hover:text-[#6366f1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6366f1]/40 disabled:cursor-not-allowed disabled:opacity-60'

const dangerButtonClasses =
  'inline-flex h-10 items-center justify-center rounded-lg bg-danger px-4 text-sm font-semibold text-white transition hover:bg-danger/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger/50 disabled:cursor-not-allowed disabled:opacity-60'

const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
}

const STATUS_CLASSES: Record<JobStatus, string> = {
  open: 'bg-success/15 text-success',
  closed: 'bg-surface-muted text-text-muted',
  draft: 'bg-warning/15 text-warning',
}

const formatDate = (iso: string | null): string => {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const fromDateInput = (value: string): string | null => {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const JobPostsTab = ({
  posts,
  setPosts,
  applicantsCountByPost,
  selectedPostId,
  setSelectedPostId,
}: JobPostsTabProps) => {
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearchTerm(searchInput.trim().toLowerCase())
    }, 200)
    return () => window.clearTimeout(handle)
  }, [searchInput])

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<JobPostFormMode>('create')
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<JobPost | null>(null)

  const filtered = useMemo(() => {
    if (!searchTerm) return posts
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(searchTerm) ||
        p.department.toLowerCase().includes(searchTerm) ||
        p.location.toLowerCase().includes(searchTerm),
    )
  }, [posts, searchTerm])

  const selected = useMemo(
    () => posts.find((p) => p.id === selectedPostId) ?? null,
    [posts, selectedPostId],
  )

  const editingPost = useMemo(
    () => (editingPostId ? posts.find((p) => p.id === editingPostId) ?? null : null),
    [posts, editingPostId],
  )

  const handleOpenCreate = () => {
    setFormMode('create')
    setEditingPostId(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (post: JobPost) => {
    setFormMode('edit')
    setEditingPostId(post.id)
    setFormOpen(true)
  }

  const handleCloseForm = () => {
    setFormOpen(false)
    setEditingPostId(null)
  }

  const handleFormSubmit = (values: JobPostFormValues) => {
    const cleanList = (list: string[]) => list.map((v) => v.trim()).filter(Boolean)
    const nowIso = new Date().toISOString()

    const shared = {
      title: values.title.trim(),
      department: values.department.trim(),
      location: combineLocation(values.workMode, values.city),
      employmentType: values.employmentType,
      aboutCompany: values.aboutCompany.trim(),
      whatYoullDo: {
        intro: values.whatYoullDoIntro.trim(),
        items: cleanList(values.whatYoullDoItems),
      },
      whatYouBring: cleanList(values.whatYouBring),
      whyJoin: cleanList(values.whyJoin),
      ctaHeading: values.ctaHeading.trim(),
      ctaSubtext: values.ctaSubtext.trim(),
      status: values.status,
      deadlineAt: fromDateInput(values.deadlineAt),
    }

    if (formMode === 'create') {
      const newPost: JobPost = {
        id: `job-${Date.now()}`,
        ...shared,
        postedAt: fromDateInput(values.postedAt) ?? nowIso,
      }
      setPosts((prev) => [newPost, ...prev])
      setSelectedPostId(newPost.id)
    } else if (editingPostId) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === editingPostId
            ? {
                ...p,
                ...shared,
                postedAt: fromDateInput(values.postedAt) ?? p.postedAt,
              }
            : p,
        ),
      )
      setSelectedPostId(editingPostId)
    }
    setFormOpen(false)
    setEditingPostId(null)
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
    if (selectedPostId === deleteTarget.id) setSelectedPostId(null)
    setDeleteTarget(null)
  }

  return (
    <div className="grid gap-4 rounded-3xl border border-border/60 bg-surface/70 p-3 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:p-4">
      {/* LEFT — list */}
      <div className="flex h-[calc(100vh-260px)] min-h-[520px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface">
        <div className="space-y-3 border-b border-border/60 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
              Job posts · {posts.length}
            </span>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-accent/90"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                className="h-3 w-3"
              >
                <path strokeLinecap="round" d="M12 5v14m7-7H5" />
              </svg>
              Add
            </button>
          </div>
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            >
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setSearchInput(event.target.value)
              }
              placeholder="Search title, department, location"
              className="h-9 w-full rounded-xl border border-border/60 bg-background pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filtered.length === 0 ? (
            <li className="p-6 text-center text-sm text-text-muted">
              {searchTerm ? 'No posts match your search.' : 'No posts yet.'}
            </li>
          ) : (
            filtered.map((post) => {
              const isActive = selectedPostId === post.id
              const applicants = applicantsCountByPost[post.id] ?? 0
              return (
                <li key={post.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedPostId(post.id)}
                    className={`relative flex w-full items-start gap-3 border-b border-border/40 px-3 py-3 text-left transition hover:bg-surface-muted/40 ${
                      isActive ? 'bg-accent/10 hover:bg-accent/15' : ''
                    }`}
                  >
                    {isActive ? (
                      <span
                        aria-hidden
                        className="absolute inset-y-3 left-0 w-1 rounded-full bg-accent"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-text-secondary">
                          {post.title}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${STATUS_CLASSES[post.status]}`}
                        >
                          {post.status}
                        </span>
                      </div>
                      <p className="truncate text-[11px] text-text-muted">
                        {post.department} · {post.location}
                      </p>
                      <p className="text-[11px] text-text-muted">
                        {applicants} {applicants === 1 ? 'applicant' : 'applicants'}
                      </p>
                    </div>
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </div>

      {/* RIGHT — detail */}
      <div className="flex h-[calc(100vh-260px)] min-h-[520px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface">
        {selected ? (
          <>
            <div className="flex items-start justify-between gap-3 border-b border-border/60 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-base font-semibold text-text-primary">
                    {selected.title}
                  </h2>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${STATUS_CLASSES[selected.status]}`}
                  >
                    {selected.status}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-text-muted">
                  {EMPLOYMENT_TYPE_LABELS[selected.employmentType] ?? selected.employmentType}{' '}
                  | {selected.department} | {selected.location}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(selected)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:border-accent/60 hover:text-accent"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(selected)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-danger/50 px-3 py-1.5 text-xs font-medium text-danger transition hover:bg-danger/10"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-7 overflow-y-auto p-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {selected.aboutCompany ? (
                <section>
                  <h3 className="text-base font-semibold text-text-primary">
                    About {selected.department || 'the company'}
                  </h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-secondary/90">
                    {selected.aboutCompany}
                  </p>
                </section>
              ) : null}

              <section>
                <h3 className="text-base font-semibold text-text-primary">What You’ll Do</h3>
                {selected.whatYoullDo.intro ? (
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary/90">
                    {selected.whatYoullDo.intro}
                  </p>
                ) : null}
                {selected.whatYoullDo.items.length ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-text-secondary/85">
                    {selected.whatYoullDo.items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </section>

              {selected.whatYouBring.length ? (
                <section>
                  <h3 className="text-base font-semibold text-text-primary">What You Bring</h3>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-text-secondary/85">
                    {selected.whatYouBring.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {selected.whyJoin.length ? (
                <section>
                  <h3 className="text-base font-semibold text-text-primary">
                    Why {selected.department || 'join us'}?
                  </h3>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-text-secondary/85">
                    {selected.whyJoin.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {/* Admin-only meta (posted/deadline) kept small at the bottom */}
              <section className="flex flex-wrap gap-3 border-t border-border/60 pt-4 text-[11px] text-text-muted">
                <span>
                  <span className="font-semibold text-text-secondary">Posted:</span>{' '}
                  {formatDate(selected.postedAt)}
                </span>
                <span>
                  <span className="font-semibold text-text-secondary">Deadline:</span>{' '}
                  {formatDate(selected.deadlineAt)}
                </span>
              </section>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-text-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 7h6M9 11h6M9 15h6M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-text-secondary">Pick a post</p>
            <p className="text-xs text-text-muted">
              Select a job post from the left to view or edit its details.
            </p>
          </div>
        )}
      </div>

      {/* Full-screen create/edit form */}
      <JobPostFormModal
        isOpen={formOpen}
        mode={formMode}
        initialPost={formMode === 'edit' ? editingPost : null}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
      />

      {/* Delete confirmation */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        className="max-w-md"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-secondary">
            Delete job post
          </h2>
          <p className="text-sm text-text-muted">
            Are you sure you want to remove{' '}
            <span className="font-semibold text-text-secondary">
              {deleteTarget?.title}
            </span>
            ? Applicants linked to this post will be orphaned.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className={secondaryButtonClasses}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className={dangerButtonClasses}
            >
              Delete post
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default JobPostsTab
