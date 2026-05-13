import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import { getCategoryLabel, PROJECT_CATEGORY_OPTIONS, type Project } from './types'

type ProjectListProps = {
  projects: Project[]
  totalCount: number
  currentPage: number
  totalPages: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onEditProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
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

const ProjectList = ({
  projects,
  totalCount,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onEditProject,
  onDeleteProject,
}: ProjectListProps) => {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | Project['category']>('all')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearchTerm(searchInput.trim().toLowerCase())
    }, 200)
    return () => window.clearTimeout(handle)
  }, [searchInput])

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

  const filtered = useMemo(() => {
    let list = projects
    if (categoryFilter !== 'all') {
      list = list.filter((p) => p.category === categoryFilter)
    }
    if (searchTerm) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm) ||
          p.industries.toLowerCase().includes(searchTerm) ||
          p.scopeOfWork.toLowerCase().includes(searchTerm),
      )
    }
    return list
  }, [projects, searchTerm, categoryFilter])

  const activeProject = useMemo(
    () =>
      filtered.find((p) => p.id === activeProjectId) ?? filtered[0] ?? null,
    [filtered, activeProjectId],
  )

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(startItem + itemsPerPage - 1, totalCount)

  const pageNumbers = useMemo<Array<number | 'ellipsis'>>(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const result: Array<number | 'ellipsis'> = [1]
    if (currentPage > 3) result.push('ellipsis')
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i += 1) result.push(i)
    if (currentPage < totalPages - 2) result.push('ellipsis')
    result.push(totalPages)
    return result
  }, [currentPage, totalPages])

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
      {/* LEFT — list */}
      <div className="space-y-4 rounded-3xl border border-border/60 bg-surface/80 p-5">
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
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setSearchInput(event.target.value)
            }
            placeholder="Search by title, industry, scope…"
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

        {/* Category chips */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
              Categories
            </span>
            <span className="text-[11px] text-text-muted">
              {filtered.length} {filtered.length === 1 ? 'project' : 'projects'}
            </span>
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={[
                'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                categoryFilter === 'all'
                  ? 'border-accent/70 bg-accent/10 text-accent'
                  : 'border-border/60 bg-surface text-text-secondary hover:border-accent/60 hover:text-accent',
              ].join(' ')}
            >
              All
            </button>
            {PROJECT_CATEGORY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setCategoryFilter(option.value)}
                className={[
                  'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                  categoryFilter === option.value
                    ? 'border-accent/70 bg-accent/10 text-accent'
                    : 'border-border/60 bg-surface text-text-secondary hover:border-accent/60 hover:text-accent',
                ].join(' ')}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-surface px-4 py-10 text-center">
            <p className="text-sm font-medium text-text-secondary">
              {searchTerm || categoryFilter !== 'all'
                ? 'No projects match these filters'
                : 'No projects yet'}
            </p>
            <p className="text-xs text-text-muted">
              {searchTerm || categoryFilter !== 'all'
                ? 'Try a different search or category.'
                : 'Add your first case study to start building the portfolio.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((project) => {
              const isActive = activeProject?.id === project.id
              return (
                <li
                  key={project.id}
                  onClick={() => setActiveProjectId(project.id)}
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
                    {project.thumbnailUrl ? (
                      <img
                        src={project.thumbnailUrl}
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
                        {project.title.trim().charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 flex-1 truncate text-sm font-medium text-text-secondary">
                        {project.title}
                      </p>
                      <span className="shrink-0 rounded-full bg-surface-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
                        {getCategoryLabel(project.category)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-text-muted">
                      {project.year} · {project.industries || 'Uncategorised'} · Updated{' '}
                      {formatShortDate(project.updatedAt)}
                    </p>
                  </div>

                  {/* Kebab menu */}
                  <div
                    className="shrink-0"
                    ref={openMenuId === project.id ? menuRef : undefined}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenuId((curr) => (curr === project.id ? null : project.id))
                      }
                      data-open={openMenuId === project.id}
                      aria-label={`Actions for ${project.title}`}
                      aria-haspopup="menu"
                      aria-expanded={openMenuId === project.id}
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
                    {openMenuId === project.id ? (
                      <div
                        role="menu"
                        className="absolute right-2 top-10 z-20 min-w-[140px] overflow-hidden rounded-xl border border-border/60 bg-surface shadow-lg"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setOpenMenuId(null)
                            onEditProject(project)
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
                            onDeleteProject(project)
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-danger transition hover:bg-danger/10"
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

        {/* Pagination */}
        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-border/40 pt-3">
            <p className="text-[11px] text-text-muted">
              Showing{' '}
              <span className="font-semibold text-text-secondary">{startItem}</span>–
              <span className="font-semibold text-text-secondary">{endItem}</span> of{' '}
              <span className="font-semibold text-text-secondary">{totalCount}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                aria-label="Previous page"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-text-secondary disabled:cursor-not-allowed disabled:opacity-40 hover:border-accent/60 hover:text-accent"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  className="h-3.5 w-3.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
                </svg>
              </button>
              {pageNumbers.map((n, i) =>
                n === 'ellipsis' ? (
                  <span key={`e-${i}`} className="px-1 text-xs text-text-muted">
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onPageChange(n)}
                    className={[
                      'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition',
                      n === currentPage
                        ? 'bg-accent text-white shadow-[0_8px_18px_-12px_rgba(99,102,241,0.7)]'
                        : 'border border-border/60 text-text-secondary hover:border-accent/60 hover:text-accent',
                    ].join(' ')}
                  >
                    {n}
                  </button>
                ),
              )}
              <button
                type="button"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                aria-label="Next page"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-text-secondary disabled:cursor-not-allowed disabled:opacity-40 hover:border-accent/60 hover:text-accent"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  className="h-3.5 w-3.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* RIGHT — detail/preview pane (independently scrollable) */}
      <div className="space-y-5">
        <div className="h-[75vh] overflow-y-auto rounded-3xl border border-border/60 bg-surface p-6 text-text-secondary [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {activeProject ? (
            <div className="space-y-5">
              {/* Meta strip — horizontal row on top */}
              <div className="grid gap-3 rounded-2xl bg-surface-muted/60 p-3 text-[11px] text-text-muted sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                    Year
                  </p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {activeProject.year || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                    Category
                  </p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {getCategoryLabel(activeProject.category)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                    Industries
                  </p>
                  <p className="mt-0.5 truncate text-xs text-text-secondary">
                    {activeProject.industries || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                    Scope
                  </p>
                  <p className="mt-0.5 truncate text-xs text-text-secondary">
                    {activeProject.scopeOfWork || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                    Updated
                  </p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {formatDate(activeProject.updatedAt)}
                  </p>
                </div>
              </div>

              {/* Keywords row */}
              {activeProject.keywords.length ? (
                <div className="space-y-2">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                    Keywords
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeProject.keywords.map((k) => (
                      <span
                        key={k}
                        className="inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-text-secondary"
                      >
                        #{k}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <article className="space-y-4">
                <h1 className="text-3xl font-semibold leading-tight text-text-secondary">
                  {activeProject.title}
                </h1>
                <p className="max-w-3xl text-sm text-text-muted">
                  {activeProject.shortDescription ||
                    'Select a project to preview its case study details.'}
                </p>

                {activeProject.thumbnailUrl ? (
                  <div className="mt-4 overflow-hidden rounded-3xl border border-border/60 bg-surface-muted/80">
                    <img
                      src={activeProject.thumbnailUrl}
                      alt=""
                      className="h-60 w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.onerror = null
                        target.style.display = 'none'
                      }}
                    />
                  </div>
                ) : null}

                {activeProject.overviewDescription ? (
                  <section className="mt-6">
                    <h2 className="text-lg font-semibold text-text-secondary">Overview</h2>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-secondary/85">
                      {activeProject.overviewDescription}
                    </p>
                  </section>
                ) : null}

                {activeProject.clientMockupUrl ? (
                  <div className="mt-6 overflow-hidden rounded-3xl border border-border/60 bg-surface-muted/80">
                    <img
                      src={activeProject.clientMockupUrl}
                      alt=""
                      className="w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.onerror = null
                        target.style.display = 'none'
                      }}
                    />
                  </div>
                ) : null}

                {activeProject.brandingMockupUrl ||
                activeProject.brandingMockupSecondaryUrl ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {activeProject.brandingMockupUrl ? (
                      <div className="overflow-hidden rounded-3xl border border-border/60 bg-surface-muted/80">
                        <img
                          src={activeProject.brandingMockupUrl}
                          alt=""
                          className="aspect-square w-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.onerror = null
                            target.style.display = 'none'
                          }}
                        />
                      </div>
                    ) : null}
                    {activeProject.brandingMockupSecondaryUrl ? (
                      <div className="overflow-hidden rounded-3xl border border-border/60 bg-surface-muted/80">
                        <img
                          src={activeProject.brandingMockupSecondaryUrl}
                          alt=""
                          className="aspect-square w-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.onerror = null
                            target.style.display = 'none'
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* Brand identity */}
                {(activeProject.primaryColor ||
                  activeProject.secondaryColor ||
                  activeProject.accentColor ||
                  activeProject.badgeName ||
                  activeProject.brandTitle ||
                  activeProject.brandDescription) ? (
                  <section className="mt-8 space-y-3 rounded-2xl border border-border/60 bg-surface-muted/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                      Brand identity
                    </p>
                    {(activeProject.primaryColor ||
                      activeProject.secondaryColor ||
                      activeProject.accentColor) ? (
                      <div className="space-y-2">
                        <div className="flex overflow-hidden rounded-xl border border-border/60">
                          {activeProject.primaryColor ? (
                            <div
                              className="h-12 flex-1"
                              style={{ backgroundColor: activeProject.primaryColor }}
                              title={`Primary ${activeProject.primaryColor}`}
                            />
                          ) : null}
                          {activeProject.secondaryColor ? (
                            <div
                              className="h-12 flex-1"
                              style={{ backgroundColor: activeProject.secondaryColor }}
                              title={`Secondary ${activeProject.secondaryColor}`}
                            />
                          ) : null}
                          {activeProject.accentColor ? (
                            <div
                              className="h-12 flex-1"
                              style={{ backgroundColor: activeProject.accentColor }}
                              title={`Accent ${activeProject.accentColor}`}
                            />
                          ) : null}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[11px] uppercase tracking-[0.12em] text-text-muted">
                          <span className="truncate">{activeProject.primaryColor || '—'}</span>
                          <span className="truncate">{activeProject.secondaryColor || '—'}</span>
                          <span className="truncate">{activeProject.accentColor || '—'}</span>
                        </div>
                      </div>
                    ) : null}
                    {activeProject.badgeName ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                          Badge
                        </p>
                        <p className="mt-0.5 text-sm text-text-secondary">
                          {activeProject.badgeName}
                        </p>
                      </div>
                    ) : null}
                    {activeProject.brandTitle ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                          Brand title
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-text-secondary">
                          {activeProject.brandTitle}
                        </p>
                      </div>
                    ) : null}
                    {activeProject.brandDescription ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                          Brand description
                        </p>
                        <p className="mt-0.5 whitespace-pre-line text-sm text-text-secondary">
                          {activeProject.brandDescription}
                        </p>
                      </div>
                    ) : null}
                  </section>
                ) : null}

                {/* Website card */}
                {(activeProject.websiteUrl ||
                  activeProject.websiteTitle ||
                  activeProject.websiteDescription) ? (
                  <section className="mt-6 space-y-2 rounded-2xl border border-border/60 bg-surface-muted/40 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                        Website
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                          activeProject.isWebsiteEnabled
                            ? 'bg-success/15 text-success'
                            : 'bg-surface-muted text-text-muted'
                        }`}
                      >
                        {activeProject.isWebsiteEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    {activeProject.websiteTitle ? (
                      <p className="text-sm font-medium text-text-secondary">
                        {activeProject.websiteTitle}
                      </p>
                    ) : null}
                    {activeProject.websiteDescription ? (
                      <p className="text-sm text-text-secondary whitespace-pre-line">
                        {activeProject.websiteDescription}
                      </p>
                    ) : null}
                    {activeProject.websiteUrl ? (
                      <a
                        href={activeProject.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                      >
                        {activeProject.websiteUrl}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.8}
                          className="h-3 w-3"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 17 17 7M9 7h8v8" />
                        </svg>
                      </a>
                    ) : null}
                  </section>
                ) : null}

                {/* Testimonial */}
                {(activeProject.testimonialFeedback ||
                  activeProject.testimonialClientName) ? (
                  <section className="mt-6 space-y-2 rounded-2xl border border-border/60 bg-surface-muted/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                      Testimonial
                    </p>
                    {activeProject.testimonialFeedback ? (
                      <p className="text-sm leading-relaxed text-text-secondary">
                        <span className="mr-1 text-base text-text-muted">“</span>
                        {activeProject.testimonialFeedback}
                        <span className="ml-1 text-base text-text-muted">”</span>
                      </p>
                    ) : null}
                    {(activeProject.testimonialClientName ||
                      activeProject.testimonialDesignation) ? (
                      <div className="pt-1">
                        <p className="text-sm font-medium text-text-secondary">
                          {activeProject.testimonialClientName || '—'}
                        </p>
                        {activeProject.testimonialDesignation ? (
                          <p className="text-[11px] text-text-muted">
                            {activeProject.testimonialDesignation}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </section>
                ) : null}

                {/* Remaining mockups (landscape, website, footer) */}
                {(activeProject.landscapeMockupUrl ||
                  activeProject.websiteMockupUrl ||
                  activeProject.footerMockupUrl) ? (
                  <section className="mt-6 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                      More mockups
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { label: 'Landscape mockup', src: activeProject.landscapeMockupUrl },
                        { label: 'Website mockup', src: activeProject.websiteMockupUrl },
                        { label: 'Footer strip', src: activeProject.footerMockupUrl },
                      ]
                        .filter((item) => Boolean(item.src))
                        .map((item) => (
                          <figure
                            key={item.label}
                            className="overflow-hidden rounded-2xl border border-border/60 bg-surface-muted"
                          >
                            <img
                              src={item.src as string}
                              alt={item.label}
                              className="h-40 w-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.onerror = null
                                target.style.display = 'none'
                              }}
                            />
                            <figcaption className="px-3 py-1.5 text-[11px] text-text-muted">
                              {item.label}
                            </figcaption>
                          </figure>
                        ))}
                    </div>
                  </section>
                ) : null}
              </article>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-text-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="h-6 w-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h10" />
                </svg>
              </div>
              <p className="text-sm font-medium text-text-secondary">Select a project</p>
              <p className="text-xs text-text-muted">
                Pick a project from the list to preview its case study.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectList
