import { useEffect, useMemo, useRef, useState } from 'react'
import type { CaseStudy } from '../../components/caseStudies/types'
import CaseStudyFormModal from '../../components/caseStudies/CaseStudyFormModal'
import Modal from '../../components/common/Modal'
import {
  createCaseStudy,
  deleteCaseStudy,
  fetchCaseStudies,
  updateCaseStudy,
} from '../../lib/api/caseStudies'

const secondaryButtonClasses =
  'inline-flex h-10 items-center justify-center rounded-lg border border-border/60 px-4 text-sm font-semibold text-text-secondary transition hover:border-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-60'

const dangerButtonClasses =
  'inline-flex h-10 items-center justify-center rounded-lg bg-error px-4 text-sm font-semibold text-white transition hover:bg-error/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error/50 disabled:cursor-not-allowed disabled:opacity-60'

const CaseStudiesPage = () => {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isFormOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [itemBeingEdited, setItemBeingEdited] = useState<CaseStudy | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<CaseStudy | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [popularFilter, setPopularFilter] = useState<'all' | 'popular'>('all')
  const [togglingPopularId, setTogglingPopularId] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearchTerm(searchInput.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(handle)
  }, [searchInput])

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const listScrollRef = useRef<HTMLDivElement>(null)

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

  const loadCaseStudies = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { items, total } = await fetchCaseStudies({
        page: 1,
        pageSize,
        search: searchTerm || undefined,
      })
      setCaseStudies(items)
      setTotalCount(total)
      setPage(1)
      setActiveId((previous) => {
        if (previous && items.some((item) => item.id === previous)) {
          return previous
        }
        return items[0]?.id ?? null
      })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load case studies.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    const isFirstPage = page === 1
    if (isFirstPage) setIsLoading(true)
    else setIsLoadingMore(true)
    ;(async () => {
      setError(null)
      try {
        const { items, total } = await fetchCaseStudies({
          page,
          pageSize,
          search: searchTerm || undefined,
        })
        if (!isMounted) return
        setCaseStudies((prev) => (isFirstPage ? items : [...prev, ...items]))
        setTotalCount(total)
        setActiveId((previous) => {
          if (previous && items.some((item) => item.id === previous)) {
            return previous
          }
          return isFirstPage ? items[0]?.id ?? null : previous
        })
      } catch (loadError) {
        if (!isMounted) return
        setError(loadError instanceof Error ? loadError.message : 'Unable to load case studies.')
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
  }, [page, pageSize, searchTerm])

  const visibleItems = useMemo(
    () =>
      popularFilter === 'popular'
        ? caseStudies.filter((c) => c.isPopular)
        : caseStudies,
    [caseStudies, popularFilter],
  )

  const activeItem = useMemo(
    () =>
      visibleItems.find((item) => item.id === activeId) ??
      visibleItems[0] ??
      null,
    [activeId, visibleItems],
  )

  const handleOpenCreate = () => {
    setFormMode('create')
    setItemBeingEdited(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (item: CaseStudy) => {
    setFormMode('edit')
    setItemBeingEdited(item)
    setFormOpen(true)
  }

  const handleCloseForm = () => {
    setFormOpen(false)
  }

  const extractApiError = (err: unknown, fallback: string) => {
    const anyErr = err as any
    return (
      anyErr?.response?.data?.message ??
      anyErr?.response?.data?.error ??
      anyErr?.message ??
      fallback
    )
  }

  const handleSubmit = async (item: CaseStudy) => {
    setError(null)
    setStatusMessage(null)
    if (formMode === 'edit' && itemBeingEdited) {
      await updateCaseStudy(itemBeingEdited.id, item)
      setStatusMessage(`Updated "${item.title}" successfully.`)
    } else {
      await createCaseStudy(item)
      setStatusMessage(`Added "${item.title}" successfully.`)
      setPage(1)
    }
    await loadCaseStudies()
  }

  const handleTogglePopular = async (item: CaseStudy) => {
    const next = !item.isPopular
    setCaseStudies((prev) =>
      prev.map((c) => (c.id === item.id ? { ...c, isPopular: next } : c)),
    )
    setTogglingPopularId(item.id)
    setError(null)
    setStatusMessage(null)
    try {
      await updateCaseStudy(item.id, { ...item, isPopular: next })
      setStatusMessage(
        next
          ? `Marked "${item.title}" as featured.`
          : `Removed "${item.title}" from featured.`,
      )
    } catch (err) {
      setCaseStudies((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, isPopular: item.isPopular } : c)),
      )
      setError(extractApiError(err, 'Could not update popular status. Please try again.'))
    } finally {
      setTogglingPopularId(null)
    }
  }

  const handleRequestDelete = (item: CaseStudy) => {
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
      await deleteCaseStudy(deleteTarget.id)
      setStatusMessage(`Removed "${deleteTarget.title}".`)
      setDeleteTarget(null)
      await loadCaseStudies()
    } catch (err) {
      setDeleteError(extractApiError(err, 'Could not delete the case study. Please try again.'))
    } finally {
      setIsDeleting(false)
    }
  }

  const contentsHeadings = (activeItem?.sections ?? []).filter(
    (block) => block.type === 'heading' && block.heading && block.heading.trim(),
  )

  const hasMore = caseStudies.length < totalCount

  const handleLoadMore = () => {
    if (isLoadingMore || isLoading || !hasMore) return
    setPage((curr) => curr + 1)
  }

  const handleListScroll = () => {
    const el = listScrollRef.current
    if (!el || isLoadingMore || isLoading || !hasMore) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    if (distanceFromBottom < 80) {
      handleLoadMore()
    }
  }

  const formatShortDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(
        new Date(iso),
      )
    } catch {
      return '—'
    }
  }

  const placeholderThumb = (title: string) => {
    const initial = (title || 'C').trim().charAt(0).toUpperCase()
    return initial
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-surface p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.25em] text-text-muted">Blog</p>
          <h1 className="text-2xl font-semibold text-text-secondary">Case Studies</h1>
          <p className="max-w-2xl text-sm text-text-muted">
            Publish long-form case studies with cover images, thumbnail cards, structured headings, and rich content blocks.
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
          Add case study
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2.2fr)] lg:items-stretch">
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
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search case studies by title…"
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

          {/* Popular filter toggle */}
          <div
            role="tablist"
            aria-label="Filter case studies"
            className="inline-flex items-center gap-1 rounded-2xl border border-border/60 bg-surface p-1"
          >
            <button
              role="tab"
              type="button"
              aria-selected={popularFilter === 'all'}
              onClick={() => setPopularFilter('all')}
              className={`inline-flex h-8 items-center gap-1.5 rounded-xl px-3 text-[11px] font-semibold transition ${
                popularFilter === 'all'
                  ? 'bg-accent text-white shadow-[0_8px_18px_-12px_rgba(99,102,241,0.7)]'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Standard
            </button>
            <button
              role="tab"
              type="button"
              aria-selected={popularFilter === 'popular'}
              onClick={() => setPopularFilter('popular')}
              className={`inline-flex h-8 items-center gap-1.5 rounded-xl px-3 text-[11px] font-semibold transition ${
                popularFilter === 'popular'
                  ? 'bg-accent text-white shadow-[0_8px_18px_-12px_rgba(99,102,241,0.7)]'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-3 w-3"
              >
                <path d="M12 2l2.4 6.6H21l-5.3 3.85L17.8 19 12 15.1 6.2 19l2.1-6.55L3 8.6h6.6z" />
              </svg>
              Featured
            </button>
          </div>

          <div className="flex items-center justify-end">
            <span className="text-[11px] text-text-muted">
              {totalCount} {totalCount === 1 ? 'case study' : 'case studies'}
            </span>
          </div>

          {error ? (
            <p className="rounded-2xl border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">
              {error}
            </p>
          ) : null}

          {/* Scrollable list region */}
          <div
            ref={listScrollRef}
            onScroll={handleListScroll}
            className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
          {/* List / loading / empty */}
          {isLoading ? (
            <ul className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-surface px-3 py-3"
                >
                  <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-surface-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 animate-pulse rounded-full bg-surface-muted" />
                    <div className="h-2.5 w-1/2 animate-pulse rounded-full bg-surface-muted" />
                  </div>
                </li>
              ))}
            </ul>
          ) : visibleItems.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-surface px-4 py-10 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-text-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  className="h-5 w-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h10" />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-text-secondary">
                  {popularFilter === 'popular'
                    ? 'No featured case studies yet'
                    : searchTerm
                      ? 'No case studies match your search'
                      : 'No case studies yet'}
                </p>
                <p className="text-xs text-text-muted">
                  {popularFilter === 'popular'
                    ? 'Mark a case study as featured from its menu to highlight it here.'
                    : searchTerm
                      ? 'Try a different search term.'
                      : 'Create your first case study to get started.'}
                </p>
              </div>
              {popularFilter !== 'popular' && !searchTerm ? (
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent/90"
                >
                  Add case study
                </button>
              ) : null}
            </div>
          ) : (
            <ul className="space-y-2">
              {visibleItems.map((item) => {
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

                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-surface-muted">
                      {item.coverImageUrl ? (
                        <img
                          src={item.coverImageUrl}
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
                          {placeholderThumb(item.title)}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-sm font-medium text-text-secondary">
                          {item.title}
                        </p>
                        {item.isPopular ? (
                          <span
                            aria-label="Featured case study"
                            className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-accent"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-2.5 w-2.5"
                            >
                              <path d="M12 2l2.4 6.6H21l-5.3 3.85L17.8 19 12 15.1 6.2 19l2.1-6.55L3 8.6h6.6z" />
                            </svg>
                            Featured
                          </span>
                        ) : null}
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
                        {item.authorName || 'Unknown'} · {item.readTimeMinutes} min · Updated{' '}
                        {formatShortDate(item.updatedAt)}
                      </p>
                      {item.tags.length ? (
                        <p className="mt-1 truncate text-[10px] text-text-muted/80">
                          {item.tags.map((tag) => `#${tag}`).join(' ')}
                        </p>
                      ) : null}
                    </div>

                    {/* Kebab menu */}
                    <div
                      className="shrink-0"
                      ref={openMenuId === item.id ? menuRef : undefined}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenMenuId((curr) => (curr === item.id ? null : item.id))}
                        data-open={openMenuId === item.id}
                        aria-label={`Actions for ${item.title}`}
                        aria-haspopup="menu"
                        aria-expanded={openMenuId === item.id}
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
                            disabled={togglingPopularId === item.id}
                            onClick={() => {
                              setOpenMenuId(null)
                              handleTogglePopular(item)
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-text-secondary transition hover:bg-surface-muted/60 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill={item.isPopular ? 'currentColor' : 'none'}
                              stroke="currentColor"
                              strokeWidth={1.5}
                              strokeLinejoin="round"
                              className="h-3.5 w-3.5"
                            >
                              <path d="M12 2l2.4 6.6H21l-5.3 3.85L17.8 19 12 15.1 6.2 19l2.1-6.55L3 8.6h6.6z" />
                            </svg>
                            {togglingPopularId === item.id
                              ? 'Updating…'
                              : item.isPopular
                                ? 'Unmark featured'
                                : 'Mark as featured'}
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

          {/* Load-more sentinel inside scroll region */}
          {hasMore ? (
            <div className="flex items-center justify-center py-3 text-[11px] text-text-muted">
              {isLoadingMore ? 'Loading more…' : (
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

          {/* Footer count — pinned below scroll region */}
          {caseStudies.length > 0 ? (
            <div className="flex items-center justify-between border-t border-border/40 pt-3 text-[11px] text-text-muted">
              <span>
                Showing{' '}
                <span className="font-semibold text-text-secondary">{visibleItems.length}</span> of{' '}
                <span className="font-semibold text-text-secondary">{totalCount}</span>
              </span>
              {isLoadingMore ? <span>Loading…</span> : null}
            </div>
          ) : null}
        </div>

        <div className="flex max-h-[840px] min-h-0 flex-col lg:h-full">
          <div className="flex flex-1 min-h-0 flex-col rounded-3xl border border-border/60 bg-surface p-6 text-text-secondary">
            {/* Compact horizontal meta strip — always shown above the article */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-surface-muted/60 px-3 py-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-[10px] font-semibold text-white">
                  7D
                </div>
                <span className="text-xs font-medium text-text-secondary">
                  {activeItem?.authorName || 'Team 7D Design'}
                </span>
                {activeItem?.authorRole ? (
                  <span className="text-[11px] text-text-muted">· {activeItem.authorRole}</span>
                ) : null}
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-surface-muted/60 px-3 py-1.5 text-[11px] text-text-muted">
                <span className="inline-block h-1 w-6 rounded-full bg-gradient-to-r from-orange-400 to-purple-500" />
                {activeItem?.readTimeMinutes || 2} min read
              </div>
              {contentsHeadings.length ? (
                <details className="group relative">
                  <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-full bg-surface-muted/60 px-3 py-1.5 text-[11px] font-medium text-text-secondary hover:bg-surface-muted">
                    Contents ({contentsHeadings.length})
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      className="h-3 w-3 transition group-open:rotate-180"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <ul className="absolute left-0 top-9 z-10 min-w-[200px] space-y-1 rounded-2xl border border-border/60 bg-surface p-3 text-sm text-text-secondary/80 shadow-lg">
                    {contentsHeadings.map((block) => (
                      <li key={block.id}>{block.heading}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>

            <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
              <article
                className="flex-1 space-y-4 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <h1 className="text-3xl font-semibold leading-tight text-text-secondary">
                  {activeItem?.title || 'Your case study title will appear here'}
                </h1>
                <p className="max-w-3xl text-sm text-text-muted">
                  {activeItem?.excerpt ||
                    'Use the “Add case study” button to create a long-form case study.'}
                </p>

                {activeItem?.coverImageUrl ? (
                  <div className="mt-4 overflow-hidden rounded-3xl border border-border/60 bg-surface-muted/80">
                    <img
                      src={activeItem.coverImageUrl}
                      alt=""
                      className="h-60 w-full object-cover"
                    />
                  </div>
                ) : null}

                <div className="mt-6">
                  {(activeItem?.sections ?? []).map((block) => {
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
                          <img
                            src={block.imageUrl}
                            alt={block.alt ?? ''}
                            className="w-full object-cover"
                          />
                        </div>
                      )
                    }

                    return null
                  })}
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>

      <CaseStudyFormModal
        isOpen={isFormOpen}
        mode={formMode}
        initialCaseStudy={itemBeingEdited}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
      />

      <Modal isOpen={Boolean(deleteTarget)} onClose={handleCancelDelete} className="max-w-md">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-secondary">Delete case study</h2>
          <p className="text-sm text-text-muted">
            Are you sure you want to remove{' '}
            <span className="font-semibold text-text-secondary">{deleteTarget?.title}</span>? This
            action cannot be undone.
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
              className={secondaryButtonClasses}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className={dangerButtonClasses}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Delete case study'}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

export default CaseStudiesPage
