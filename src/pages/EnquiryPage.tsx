import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import type { Enquiry } from '../assets/constants/enquiries'
import { fetchContacts, deleteContact } from '../lib/api/contacts'

const parseSender = (from: string): { name: string; email: string } => {
  const match = from.match(/^(.*?)\s*<(.+)>\s*$/)
  if (match) return { name: match[1].trim(), email: match[2].trim() }
  return { name: from, email: from }
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

const isSameWeek = (a: Date, b: Date) => {
  const diff = Math.abs(a.getTime() - b.getTime())
  return diff < 7 * 24 * 60 * 60 * 1000 && a.getDay() >= b.getDay() - 6
}

const formatListTime = (iso: string): string => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  if (isSameDay(date, now)) {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }
  if (isSameWeek(date, now)) {
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

const bodyPreview = (body: string): string =>
  body.replace(/\s+/g, ' ').trim().slice(0, 110)

const EnquiryPage = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [readingMobile, setReadingMobile] = useState(false)

  const loadContacts = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const { items } = await fetchContacts({ pageSize: 100 })
      const sorted = items.sort(
        (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
      )
      setEnquiries(sorted)
      setSelectedId((prev) => {
        if (prev && sorted.some((e) => e.id === prev)) return prev
        return sorted[0]?.id ?? null
      })
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to load enquiries.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadContacts()
  }, [loadContacts])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearchTerm(searchInput.trim().toLowerCase())
    }, 200)
    return () => window.clearTimeout(handle)
  }, [searchInput])

  const filtered = useMemo(() => {
    if (!searchTerm) return enquiries
    return enquiries.filter(
      (e) =>
        e.subject.toLowerCase().includes(searchTerm) ||
        e.from.toLowerCase().includes(searchTerm) ||
        e.to.toLowerCase().includes(searchTerm),
    )
  }, [enquiries, searchTerm])

  const unreadCount = useMemo(
    () => enquiries.filter((e) => !e.read).length,
    [enquiries],
  )

  const selected = useMemo(
    () => enquiries.find((e) => e.id === selectedId) ?? null,
    [enquiries, selectedId],
  )

  const handleSelect = (enquiry: Enquiry) => {
    setSelectedId(enquiry.id)
    setReadingMobile(true)
    if (!enquiry.read) {
      setEnquiries((prev) =>
        prev.map((e) => (e.id === enquiry.id ? { ...e, read: true } : e)),
      )
    }
  }

  const handleMarkAsUnread = () => {
    if (!selected) return
    setEnquiries((prev) =>
      prev.map((e) => (e.id === selected.id ? { ...e, read: false } : e)),
    )
  }

  const handleDelete = async () => {
    if (!selected) return
    const idToDelete = selected.id
    try {
      await deleteContact(idToDelete)
      setEnquiries((prev) => prev.filter((e) => e.id !== idToDelete))
      setSelectedId((prev) => {
        if (prev !== idToDelete) return prev
        const remaining = enquiries.filter((e) => e.id !== idToDelete)
        return remaining[0]?.id ?? null
      })
      setReadingMobile(false)
    } catch {
      // silently fail — could add toast later
    }
  }

  if (isLoading) {
    return (
      <section className="space-y-6">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.25em] text-text-muted">Inbox</p>
          <h1 className="text-2xl font-semibold text-text-secondary">Enquiries</h1>
        </header>
        <div className="flex items-center justify-center py-20 text-sm text-text-muted">
          Loading enquiries…
        </div>
      </section>
    )
  }

  if (loadError) {
    return (
      <section className="space-y-6">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.25em] text-text-muted">Inbox</p>
          <h1 className="text-2xl font-semibold text-text-secondary">Enquiries</h1>
        </header>
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <p className="text-sm text-danger">{loadError}</p>
          <button
            type="button"
            onClick={loadContacts}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90"
          >
            Retry
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.25em] text-text-muted">Inbox</p>
          <h1 className="text-2xl font-semibold text-text-secondary">Enquiries</h1>
          <p className="text-sm text-text-muted">
            Triage incoming requests — new leads, follow-ups, and press enquiries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              unreadCount > 0
                ? 'bg-accent/10 text-accent'
                : 'bg-surface-muted text-text-muted'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                unreadCount > 0 ? 'bg-accent' : 'bg-text-muted/50'
              }`}
            />
            {unreadCount} unread
          </span>
          <span className="inline-flex items-center rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-text-secondary">
            {enquiries.length} total
          </span>
        </div>
      </header>

      <div className="grid gap-4 rounded-3xl border border-border/60 bg-surface/70 p-3 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:p-4">
        {/* LIST PANE */}
        <div
          className={`${
            readingMobile ? 'hidden lg:flex' : 'flex'
          } h-[calc(100vh-220px)] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface`}
        >
          {/* Search */}
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
                placeholder="Search subject, from, or to…"
                className="h-9 w-full rounded-xl border border-border/60 bg-background pl-9 pr-9 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-muted hover:text-text-secondary"
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
              ) : null}
            </div>
          </div>

          {/* List */}
          <ul className="flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filtered.length === 0 ? (
              <li className="p-6 text-center text-sm text-text-muted">
                {searchTerm ? 'No mails match your search.' : 'Inbox zero — nothing to triage.'}
              </li>
            ) : (
              filtered.map((enquiry) => {
                const { name, email } = parseSender(enquiry.from)
                const isActive = selected?.id === enquiry.id
                const hue = hashHue(email)
                return (
                  <li key={enquiry.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(enquiry)}
                      className={`relative flex w-full items-start gap-3 border-b border-border/40 px-3 py-3 text-left transition hover:bg-surface-muted/40 ${
                        isActive ? 'bg-accent/10 hover:bg-accent/15' : ''
                      }`}
                    >
                      {!enquiry.read ? (
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
                        {initials(name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={`min-w-0 flex-1 truncate text-sm ${
                              enquiry.read
                                ? 'font-normal text-text-secondary'
                                : 'font-semibold text-text-primary'
                            }`}
                          >
                            {name}
                          </p>
                          <span
                            className={`shrink-0 text-[11px] ${
                              enquiry.read ? 'text-text-muted' : 'font-semibold text-accent'
                            }`}
                          >
                            {formatListTime(enquiry.receivedAt)}
                          </span>
                        </div>
                        <p
                          className={`mt-0.5 truncate text-sm ${
                            enquiry.read
                              ? 'font-normal text-text-secondary/80'
                              : 'font-semibold text-text-primary'
                          }`}
                        >
                          {enquiry.subject}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-text-muted">
                          {bodyPreview(enquiry.body)}
                        </p>
                      </div>

                      {!enquiry.read ? (
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
          } h-[calc(100vh-220px)] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface`}
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold text-text-primary">
                    {selected.subject}
                  </h2>
                  <p className="truncate text-[11px] text-text-muted">
                    To {selected.to} · {formatFullTime(selected.receivedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleMarkAsUnread}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:border-accent/60 hover:text-accent"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    className="h-3.5 w-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8.5v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8M3 8.5 12 14l9-5.5M3 8.5v-.2a2 2 0 0 1 1-1.7L12 2l8 4.6a2 2 0 0 1 1 1.7v.2"
                    />
                  </svg>
                  Mark unread
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-danger transition hover:border-danger/60 hover:bg-danger/10"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    className="h-3.5 w-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </button>
              </div>

              <div className="flex flex-col gap-3 border-b border-border/60 p-4">
                {(() => {
                  const { name, email } = parseSender(selected.from)
                  const hue = hashHue(email)
                  return (
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: `hsl(${hue} 60% 50%)` }}
                      >
                        {initials(name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-text-primary">
                          {name}
                        </p>
                        <p className="truncate text-[11px] text-text-muted">{email}</p>
                      </div>
                    </div>
                  )
                })()}
              </div>

              <div className="flex-1 overflow-y-auto p-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-text-secondary">
                  {selected.body}
                </pre>
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
                    d="M3 8.5v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8M3 8.5 12 14l9-5.5M3 8.5v-.2a2 2 0 0 1 1-1.7L12 2l8 4.6a2 2 0 0 1 1 1.7v.2"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-text-secondary">Select a mail</p>
              <p className="text-xs text-text-muted">
                Pick an enquiry from the list to read its contents.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default EnquiryPage
