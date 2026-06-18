import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import Modal from '../components/common/Modal'
import TestimonialFormModal from '../components/testimonials/TestimonialFormModal'
import type {
  Testimonial,
  TestimonialFormPayload,
} from '../components/testimonials/types'
import { DEFAULT_TESTIMONIAL_CATEGORIES } from '../components/testimonials/types'
import {
  createTestimonial,
  deleteTestimonial,
  fetchTestimonials,
  fetchTestimonialCategories,
  updateTestimonial,
} from '../lib/api/testimonials'

const PAGE_SIZE = 10

type CategoryFilter = 'all' | Testimonial['category']
type StatusFilter = 'all' | 0 | 1

const formatShortDate = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(
      new Date(iso),
    )
  } catch {
    return '—'
  }
}

const formatDate = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso))
  } catch {
    return '—'
  }
}

const TestimonialsPage = () => {
  const [items, setItems] = useState<Testimonial[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categories, setCategories] = useState<string[]>(
    DEFAULT_TESTIMONIAL_CATEGORIES,
  )

  const [activeId, setActiveId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const listScrollRef = useRef<HTMLDivElement>(null)

  const [isFormOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingItem, setEditingItem] = useState<Testimonial | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Debounce search input → searchTerm.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearchTerm(searchInput.trim())
      setPage(1)
    }, 250)
    return () => window.clearTimeout(handle)
  }, [searchInput])

  const loadCategories = async () => {
    try {
      const list = await fetchTestimonialCategories()
      setCategories(list)
    } catch {
      // Non-fatal — fall back to the defaults already in state.
    }
  }

  useEffect(() => {
    void loadCategories()
  }, [])

  // Close kebab menu on outside click / escape.
  useEffect(() => {
    if (!openMenuId) return
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenuId(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [openMenuId])

  // Fetch on filter / page change. Append on page > 1.
  useEffect(() => {
    let isMounted = true
    const isFirstPage = page === 1
    if (isFirstPage) setIsLoading(true)
    else setIsLoadingMore(true)
    ;(async () => {
      setError(null)
      try {
        const { items: nextItems, total } = await fetchTestimonials({
          page,
          pageSize: PAGE_SIZE,
          search: searchTerm || undefined,
          category: categoryFilter,
          status: statusFilter,
        })
        if (!isMounted) return
        setItems((prev) => (isFirstPage ? nextItems : [...prev, ...nextItems]))
        setTotalCount(total)
        setActiveId((previous) => {
          if (previous && nextItems.some((item) => item.id === previous)) return previous
          return isFirstPage ? nextItems[0]?.id ?? null : previous
        })
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Unable to load testimonials.')
      } finally {
        if (isMounted) {
          setIsLoading(false)
          setIsLoadingMore(false)
        }
      }
    })()
    return () => {
      isMounted = false
    }
  }, [page, searchTerm, categoryFilter, statusFilter])

  const hasMore = items.length < totalCount

  const handleLoadMore = () => {
    if (isLoadingMore || isLoading || !hasMore) return
    setPage((curr) => curr + 1)
  }

  const handleListScroll = () => {
    const el = listScrollRef.current
    if (!el || isLoadingMore || isLoading || !hasMore) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    if (distanceFromBottom < 80) handleLoadMore()
  }

  const refreshFromFirstPage = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { items: nextItems, total } = await fetchTestimonials({
        page: 1,
        pageSize: PAGE_SIZE,
        search: searchTerm || undefined,
        category: categoryFilter,
        status: statusFilter,
      })
      setItems(nextItems)
      setTotalCount(total)
      setPage(1)
      setActiveId((previous) => {
        if (previous && nextItems.some((item) => item.id === previous)) return previous
        return nextItems[0]?.id ?? null
      })
      void loadCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load testimonials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setFormMode('create')
    setEditingItem(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (item: Testimonial) => {
    setFormMode('edit')
    setEditingItem(item)
    setFormOpen(true)
  }

  const handleSubmit = async (payload: TestimonialFormPayload) => {
    setStatusMessage(null)
    if (formMode === 'edit' && editingItem) {
      await updateTestimonial(editingItem.id, payload)
      setStatusMessage(`Updated "${payload.name}".`)
    } else {
      await createTestimonial(payload)
      setStatusMessage(`Added "${payload.name}".`)
    }
    await refreshFromFirstPage()
  }

  const handleRequestDelete = (item: Testimonial) => {
    setDeleteError(null)
    setDeleteTarget(item)
  }

  const handleCancelDelete = () => {
    if (isDeleting) return
    setDeleteTarget(null)
    setDeleteError(null)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await deleteTestimonial(deleteTarget.id)
      setStatusMessage(`Removed "${deleteTarget.name}".`)
      setDeleteTarget(null)
      await refreshFromFirstPage()
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Could not delete the testimonial.',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const activeItem = useMemo(
    () => items.find((i) => i.id === activeId) ?? items[0] ?? null,
    [items, activeId],
  )

  const statusOptions: Array<{ value: StatusFilter; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 1, label: 'Live' },
    { value: 0, label: 'Drafts' },
  ]

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-surface p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.25em] text-text-muted">Testimonials</p>
          <h1 className="text-2xl font-semibold text-text-primary">Client voices</h1>
          <p className="max-w-2xl text-sm text-text-muted">
            Curate the testimonials that rotate through the homepage deck. Lower display
            order shows first.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_28px_-20px_rgba(99,102,241,0.9)] transition hover:bg-accent/90"
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
            </svg>
          </span>
          Add testimonial
        </button>
      </header>

      {statusMessage ? (
        <div className="inline-flex items-center gap-2 rounded-xl border border-success/40 bg-success/10 px-4 py-2 text-xs font-medium text-success">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-4 w-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          {statusMessage}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)] lg:items-stretch">
        {/* LEFT — list */}
        <div className="flex max-h-[840px] flex-col gap-4 rounded-3xl border border-border/60 bg-surface/80 p-5">
          {/* Search */}
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
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
              placeholder="Search by name, role, or quote…"
              className="h-10 w-full rounded-xl border border-border/60 bg-background pl-9 pr-9 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
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

          {/* Filters */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                Filters
              </span>
              <span className="text-[11px] text-text-muted">
                {totalCount} {totalCount === 1 ? 'testimonial' : 'testimonials'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => {
                    setStatusFilter(option.value)
                    setPage(1)
                  }}
                  className={[
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                    statusFilter === option.value
                      ? 'border-accent/70 bg-accent/10 text-accent'
                      : 'border-border/60 bg-surface text-text-secondary hover:border-accent/60 hover:text-accent',
                  ].join(' ')}
                >
                  {option.label}
                </button>
              ))}
              <span className="mx-1 hidden h-6 w-px bg-border/60 sm:inline-block" />
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('all')
                  setPage(1)
                }}
                className={[
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                  categoryFilter === 'all'
                    ? 'border-accent/70 bg-accent/10 text-accent'
                    : 'border-border/60 bg-surface text-text-secondary hover:border-accent/60 hover:text-accent',
                ].join(' ')}
              >
                All categories
              </button>
              {categories.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setCategoryFilter(option)
                    setPage(1)
                  }}
                  className={[
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                    categoryFilter === option
                      ? 'border-accent/70 bg-accent/10 text-accent'
                      : 'border-border/60 bg-surface text-text-secondary hover:border-accent/60 hover:text-accent',
                  ].join(' ')}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <p className="rounded-2xl border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">
              {error}
            </p>
          ) : null}

          {/* Scrollable list */}
          <div
            ref={listScrollRef}
            onScroll={handleListScroll}
            className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {isLoading ? (
              <ul className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 rounded-2xl border border-border/60 bg-surface px-3 py-3"
                  >
                    <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-surface-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/2 animate-pulse rounded-full bg-surface-muted" />
                      <div className="h-2.5 w-3/4 animate-pulse rounded-full bg-surface-muted" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-surface px-4 py-10 text-center">
                <p className="text-sm font-medium text-text-secondary">No testimonials yet</p>
                <p className="text-xs text-text-muted">
                  Add a client quote to start populating the homepage deck.
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent/90"
                >
                  Add testimonial
                </button>
              </div>
            ) : (
              <ul className="space-y-2">
                {items.map((item) => {
                  const isActive = activeItem?.id === item.id
                  return (
                    <li
                      key={item.id}
                      onClick={() => setActiveId(item.id)}
                      className={[
                        'group relative flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 transition',
                        isActive
                          ? 'border-accent/70 bg-accent/5'
                          : 'border-border/60 bg-surface hover:border-accent/60 hover:bg-accent/5',
                      ].join(' ')}
                    >
                      {isActive ? (
                        <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-accent" />
                      ) : null}

                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border/60 bg-surface-muted">
                        {item.photoUrl ? (
                          <img
                            src={item.photoUrl}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.onerror = null
                              target.style.display = 'none'
                            }}
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-base font-semibold text-text-muted">
                            {item.name.charAt(0).toUpperCase() || '?'}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="min-w-0 flex-1 truncate text-sm font-medium text-text-secondary">
                            {item.name}
                          </p>
                          <span className="shrink-0 rounded-full bg-surface-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
                            {item.category}
                          </span>
                          <span
                            className={[
                              'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]',
                              item.status === 1
                                ? 'bg-success/15 text-success'
                                : 'bg-surface-muted text-text-muted',
                            ].join(' ')}
                          >
                            {item.status === 1 ? 'Live' : 'Draft'}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-text-muted">
                          {item.role} · #{item.displayOrder} · Updated{' '}
                          {formatShortDate(item.updatedAt)}
                        </p>
                      </div>

                      {/* Kebab */}
                      <div
                        className="shrink-0"
                        ref={openMenuId === item.id ? menuRef : undefined}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId((curr) => (curr === item.id ? null : item.id))
                          }
                          aria-label={`Actions for ${item.name}`}
                          aria-haspopup="menu"
                          aria-expanded={openMenuId === item.id}
                          data-open={openMenuId === item.id}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted hover:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/40 data-[open=true]:bg-surface-muted data-[open=true]:text-accent"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-4 w-4"
                          >
                            <circle cx="12" cy="5" r="1.6" />
                            <circle cx="12" cy="12" r="1.6" />
                            <circle cx="12" cy="19" r="1.6" />
                          </svg>
                        </button>
                        {openMenuId === item.id ? (
                          <div
                            role="menu"
                            className="absolute right-2 top-10 z-20 min-w-[140px] overflow-hidden rounded-xl border border-border/60 bg-surface shadow-lg"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenMenuId(null)
                                handleOpenEdit(item)
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-text-secondary transition hover:bg-surface-muted/60 hover:text-accent"
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
                                  d="M16.862 3.487a2.06 2.06 0 1 1 2.915 2.915L7.5 18.679l-4 1 1-4L16.862 3.487Z"
                                />
                              </svg>
                              Edit
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenMenuId(null)
                                handleRequestDelete(item)
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-error transition hover:bg-error/10"
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
                                  d="M9.75 9.75v6.75m4.5-6.75v6.75M4.5 6.75h15m-1.5 0-.8 12a2.25 2.25 0 0 1-2.244 2.1H9.044a2.25 2.25 0 0 1-2.244-2.1L6 6.75m3.75 0V4.5A1.5 1.5 0 0 1 11.25 3h1.5a1.5 1.5 0 0 1 1.5 1.5v2.25"
                                />
                              </svg>
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            {hasMore ? (
              <div className="flex items-center justify-center py-3 text-[11px] text-text-muted">
                {isLoadingMore ? (
                  'Loading more…'
                ) : (
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="rounded-full border border-border/60 px-3 py-1 text-[11px] font-medium text-text-secondary transition hover:border-accent/60 hover:text-accent"
                  >
                    Load more
                  </button>
                )}
              </div>
            ) : null}
          </div>

          {/* Footer count */}
          {items.length > 0 ? (
            <div className="flex items-center justify-between border-t border-border/40 pt-3 text-[11px] text-text-muted">
              <span>
                Showing{' '}
                <span className="font-semibold text-text-secondary">{items.length}</span> of{' '}
                <span className="font-semibold text-text-secondary">{totalCount}</span>
              </span>
              {isLoadingMore ? <span>Loading…</span> : null}
            </div>
          ) : null}
        </div>

        {/* RIGHT — preview pane (homepage card replica, themed) */}
        <div className="flex max-h-[840px] min-h-0 flex-col lg:h-full">
          <div className="flex-1 min-h-0 overflow-y-auto rounded-3xl border border-border/60 bg-surface p-6 text-text-secondary [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {activeItem ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-muted">
                  <span className="rounded-full bg-surface-muted/80 px-3 py-1 font-medium text-text-secondary">
                    Display order #{activeItem.displayOrder}
                  </span>
                  <span
                    className={[
                      'rounded-full px-3 py-1 font-semibold uppercase tracking-[0.14em]',
                      activeItem.status === 1
                        ? 'bg-success/15 text-success'
                        : 'bg-surface-muted text-text-muted',
                    ].join(' ')}
                  >
                    {activeItem.status === 1 ? 'Live' : 'Draft'}
                  </span>
                  <span>Updated {formatDate(activeItem.updatedAt)}</span>
                </div>

                {/* Card replica — same structure as the public deck, themed to admin tokens */}
                <article className="overflow-hidden rounded-3xl border border-border/60 bg-background shadow-sm">
                  <div className="flex flex-col items-center gap-6 border-b border-dashed border-border/70 px-6 py-8 sm:flex-row sm:items-end sm:gap-10 sm:px-10 sm:py-10">
                    <div className="relative">
                      <span className="absolute inset-0 -translate-x-2 translate-y-2 rounded-full bg-accent/15" aria-hidden />
                      <div className="relative h-32 w-32 overflow-hidden rounded-full border border-border/60 bg-surface-muted sm:h-40 sm:w-40">
                        {activeItem.photoUrl ? (
                          <img
                            src={activeItem.photoUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-3xl font-semibold text-text-muted">
                            {activeItem.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col items-center gap-2 text-center sm:items-start sm:text-left">
                      <h2 className="text-3xl font-semibold uppercase leading-tight tracking-tight text-text-primary sm:text-4xl">
                        {activeItem.name}
                      </h2>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted sm:text-sm">
                        {activeItem.role}
                      </p>
                      <span className="mt-2 inline-flex items-center rounded-full bg-accent/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent sm:text-xs">
                        {activeItem.category}
                      </span>
                    </div>
                  </div>

                  <blockquote className="px-6 py-8 text-sm leading-relaxed text-text-secondary sm:px-10 sm:py-10 sm:text-base">
                    <span className="mr-1 select-none text-2xl font-semibold text-text-muted">“</span>
                    {activeItem.quote}
                    <span className="ml-1 select-none text-2xl font-semibold text-text-muted">”</span>
                  </blockquote>
                </article>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/60 bg-surface-muted/40 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                      Created
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">{formatDate(activeItem.createdAt)}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-surface-muted/40 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                      Category
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">{activeItem.category}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-surface-muted/40 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                      Quote length
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">{activeItem.quote.length} characters</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-text-muted">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    className="h-6 w-6"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25c0-1.243 1.007-2.25 2.25-2.25h13.5c1.243 0 2.25 1.007 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25H7.5L3 21V8.25Z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-text-secondary">Select a testimonial</p>
                <p className="text-xs text-text-muted">
                  Pick one from the list to preview the homepage card.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <TestimonialFormModal
        isOpen={isFormOpen}
        mode={formMode}
        initialTestimonial={editingItem}
        existingCategories={categories}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={handleCancelDelete}
        className="max-w-md"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-secondary">Delete testimonial</h2>
          <p className="text-sm text-text-muted">
            Remove the quote from{' '}
            <span className="font-semibold text-text-secondary">{deleteTarget?.name}</span>?
            This cannot be undone.
          </p>
          {deleteError ? (
            <p className="rounded-xl border border-error/50 bg-error/10 px-3 py-2 text-xs text-error">
              {deleteError}
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCancelDelete}
              disabled={isDeleting}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border/60 px-4 text-sm font-semibold text-text-secondary transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-error px-4 text-sm font-semibold text-white transition hover:bg-error/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

export default TestimonialsPage
