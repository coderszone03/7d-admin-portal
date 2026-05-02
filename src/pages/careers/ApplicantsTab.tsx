import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import type {
  Applicant,
  ApplicantStatus,
} from '../../assets/constants/applicants'
import type { JobPost } from '../../assets/constants/jobPosts'

type ApplicantsTabProps = {
  posts: JobPost[]
  applicants: Applicant[]
  setApplicants: (updater: (prev: Applicant[]) => Applicant[]) => void
  onJumpToPost: (postId: string) => void
}

const APPLICANT_STATUSES: { value: ApplicantStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'interviewed', label: 'Interviewed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'hired', label: 'Hired' },
]

const STATUS_CLASSES: Record<ApplicantStatus, string> = {
  new: 'bg-accent/15 text-accent',
  reviewing: 'bg-warning/15 text-warning',
  interviewed: 'bg-surface-muted text-text-secondary',
  rejected: 'bg-danger/15 text-danger',
  hired: 'bg-success/15 text-success',
}

const initials = (name: string) =>
  (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join('') || '?'

const hashHue = (input: string): number => {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % 360
}

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const formatListTime = (iso: string): string => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  if (isSameDay(date, now)) {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }
  const diffMs = now.getTime() - date.getTime()
  if (diffMs < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString(undefined, { weekday: 'short' })
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }
  return date.toLocaleDateString(undefined, {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatFullTime = (iso: string): string => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const ApplicantsTab = ({
  posts,
  applicants,
  setApplicants,
  onJumpToPost,
}: ApplicantsTabProps) => {
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPostId, setFilterPostId] = useState<string>('all')
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const firstUnread = applicants.find((a) => !a.read)
    return firstUnread?.id ?? applicants[0]?.id ?? null
  })
  const [readingMobile, setReadingMobile] = useState(false)

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearchTerm(searchInput.trim().toLowerCase())
    }, 200)
    return () => window.clearTimeout(handle)
  }, [searchInput])

  const countsByPost = useMemo(() => {
    const counts: Record<string, number> = {}
    applicants.forEach((a) => {
      counts[a.jobPostId] = (counts[a.jobPostId] ?? 0) + 1
    })
    return counts
  }, [applicants])

  const postTitleById = useMemo(() => {
    const map = new Map<string, string>()
    posts.forEach((p) => map.set(p.id, p.title))
    return map
  }, [posts])

  const filtered = useMemo(() => {
    let list = applicants
    if (filterPostId !== 'all') {
      list = list.filter((a) => a.jobPostId === filterPostId)
    }
    if (searchTerm) {
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(searchTerm) ||
          a.email.toLowerCase().includes(searchTerm),
      )
    }
    return [...list].sort(
      (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
    )
  }, [applicants, filterPostId, searchTerm])

  const selected = useMemo(
    () => applicants.find((a) => a.id === selectedId) ?? null,
    [applicants, selectedId],
  )

  const handleSelect = (applicant: Applicant) => {
    setSelectedId(applicant.id)
    setReadingMobile(true)
    if (!applicant.read) {
      setApplicants((prev) =>
        prev.map((a) => (a.id === applicant.id ? { ...a, read: true } : a)),
      )
    }
  }

  const handleStatusChange = (status: ApplicantStatus) => {
    if (!selected) return
    setApplicants((prev) =>
      prev.map((a) => (a.id === selected.id ? { ...a, status } : a)),
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex flex-col gap-2 rounded-3xl border border-border/60 bg-surface/70 p-3">
        <span className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
          Filter by post
        </span>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setFilterPostId('all')}
            className={[
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
              filterPostId === 'all'
                ? 'border-accent/70 bg-accent/10 text-accent'
                : 'border-border/60 bg-surface text-text-secondary hover:border-accent/60 hover:text-accent',
            ].join(' ')}
          >
            All · {applicants.length}
          </button>
          {posts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => setFilterPostId(post.id)}
              className={[
                'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                filterPostId === post.id
                  ? 'border-accent/70 bg-accent/10 text-accent'
                  : 'border-border/60 bg-surface text-text-secondary hover:border-accent/60 hover:text-accent',
              ].join(' ')}
            >
              {post.title} · {countsByPost[post.id] ?? 0}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 rounded-3xl border border-border/60 bg-surface/70 p-3 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:p-4">
        {/* LIST PANE */}
        <div
          className={`${
            readingMobile ? 'hidden lg:flex' : 'flex'
          } h-[calc(100vh-340px)] min-h-[440px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface`}
        >
          <div className="border-b border-border/60 p-3">
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
                placeholder="Search name or email"
                className="h-9 w-full rounded-xl border border-border/60 bg-background pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <ul className="flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filtered.length === 0 ? (
              <li className="p-6 text-center text-sm text-text-muted">
                {searchTerm || filterPostId !== 'all'
                  ? 'No applicants match these filters.'
                  : 'No applicants yet.'}
              </li>
            ) : (
              filtered.map((applicant) => {
                const isActive = selected?.id === applicant.id
                const hue = hashHue(applicant.email)
                const postTitle = postTitleById.get(applicant.jobPostId) ?? '—'
                return (
                  <li key={applicant.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(applicant)}
                      className={`relative flex w-full items-start gap-3 border-b border-border/40 px-3 py-3 text-left transition hover:bg-surface-muted/40 ${
                        isActive ? 'bg-accent/10 hover:bg-accent/15' : ''
                      }`}
                    >
                      {!applicant.read ? (
                        <span
                          aria-hidden
                          className={`absolute inset-y-3 left-0 w-1 rounded-full ${
                            isActive ? 'bg-accent' : 'bg-accent/80'
                          }`}
                        />
                      ) : isActive ? (
                        <span
                          aria-hidden
                          className="absolute inset-y-3 left-0 w-1 rounded-full bg-accent/50"
                        />
                      ) : null}
                      <div
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                        style={{ backgroundColor: `hsl(${hue} 60% 50%)` }}
                      >
                        {initials(applicant.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={`min-w-0 flex-1 truncate text-sm ${
                              applicant.read
                                ? 'font-normal text-text-secondary'
                                : 'font-semibold text-text-primary'
                            }`}
                          >
                            {applicant.name}
                          </p>
                          <span
                            className={`shrink-0 text-[11px] ${
                              applicant.read
                                ? 'text-text-muted'
                                : 'font-semibold text-accent'
                            }`}
                          >
                            {formatListTime(applicant.appliedAt)}
                          </span>
                        </div>
                        <p
                          className={`mt-0.5 truncate text-xs ${
                            applicant.read ? 'text-text-muted' : 'text-text-secondary'
                          }`}
                        >
                          Applied to: {postTitle}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${STATUS_CLASSES[applicant.status]}`}
                          >
                            {applicant.status}
                          </span>
                        </div>
                      </div>
                      {!applicant.read ? (
                        <span
                          aria-hidden
                          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent"
                        />
                      ) : null}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>

        {/* READING PANE */}
        <div
          className={`${
            readingMobile ? 'flex' : 'hidden lg:flex'
          } h-[calc(100vh-340px)] min-h-[440px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface`}
        >
          {selected ? (
            <>
              <div className="flex items-center gap-3 border-b border-border/60 p-4">
                <button
                  type="button"
                  onClick={() => setReadingMobile(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted hover:text-text-secondary lg:hidden"
                  aria-label="Back to list"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    className="h-4 w-4"
                  >
                    <path strokeLinecap="round" d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold text-text-primary">
                    {selected.name}
                  </h2>
                  <p className="truncate text-[11px] text-text-muted">
                    Applied {formatFullTime(selected.appliedAt)}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="space-y-5 p-6">
                  {/* Contact */}
                  {(() => {
                    const hue = hashHue(selected.email)
                    return (
                      <div className="flex items-start gap-3 rounded-2xl bg-surface-muted/60 p-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: `hsl(${hue} 60% 50%)` }}
                        >
                          {initials(selected.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-text-primary">
                            {selected.name}
                          </p>
                          <p className="truncate text-[11px] text-text-muted">
                            {selected.email}
                          </p>
                          <p className="truncate text-[11px] text-text-muted">
                            {selected.phone}
                          </p>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Applied to */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                      Applied to
                    </p>
                    <button
                      type="button"
                      onClick={() => onJumpToPost(selected.jobPostId)}
                      className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
                    >
                      {postTitleById.get(selected.jobPostId) ?? '—'}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        className="h-3 w-3"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7 17 17 7M9 7h8v8"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                      Status
                    </p>
                    <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border/60 bg-background/70 p-1">
                      {APPLICANT_STATUSES.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => handleStatusChange(s.value)}
                          className={`h-8 rounded-md px-2.5 text-[11px] font-medium transition ${
                            selected.status === s.value
                              ? 'bg-accent text-white'
                              : 'text-text-muted hover:text-text-secondary'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cover note */}
                  {selected.coverNote ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                        Cover note
                      </p>
                      <pre className="mt-1 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-text-secondary">
                        {selected.coverNote}
                      </pre>
                    </div>
                  ) : null}
                </div>
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
                    d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 0v0M4 20c1-4 5-6 8-6s7 2 8 6"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-text-secondary">
                Select an applicant
              </p>
              <p className="text-xs text-text-muted">
                Pick someone from the list to review their details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ApplicantsTab
