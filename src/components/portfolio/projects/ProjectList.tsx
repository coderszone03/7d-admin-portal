import { Fragment, useState } from 'react'
import Modal from '../../common/Modal'
import { getCategoryLabel, type Project } from './types'

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

// const noop = () => {}

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
  const [activeProject, setActiveProject] = useState<Project | null>(null)

  const handleOpenDetails = (project: Project) => {
    setActiveProject(project)
  }

  const handleCloseDetails = () => {
    setActiveProject(null)
  }

  if (!totalCount) {
    return (
      <div className="rounded-3xl border border-dashed border-border/60 bg-surface/70 p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
          </svg>
        </div>
        <h3 className="mt-6 text-lg font-semibold text-text-primary">No projects yet</h3>
        <p className="mt-2 text-sm text-text-muted">
          Build your portfolio by adding case studies, campaigns, and showcase work. Start with
          &quot;Add project&quot;.
        </p>
      </div>
    )
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(startItem + itemsPerPage - 1, totalCount)

  // Group projects into an alternating 2 / 1 / 2 / 1 row pattern:
  // even-indexed rows hold two cards, odd-indexed rows hold one full-width card.
  const rows: Project[][] = []
  let cursor = 0
  let rowIdx = 0
  while (cursor < projects.length) {
    const size = rowIdx % 2 === 0 ? 2 : 1
    rows.push(projects.slice(cursor, cursor + size))
    cursor += size
    rowIdx += 1
  }

  return (
    <div className="space-y-6">
      <ul className="space-y-6">
        {rows.map((row, rowIndex) => (
          <li key={rowIndex} className="flex flex-col gap-6 md:flex-row">
            {row.map((project) => (
              <div
                key={project.id}
                className="group relative flex h-72 flex-1 basis-0 flex-col overflow-hidden rounded-[32px] border border-border/60 bg-surface/95 shadow-[0_26px_60px_-42px_rgba(15,17,21,0.9)] transition-all duration-500 hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-glow md:hover:flex-[1.6]"
              >
                {/* Background thumbnail with overlay */}
                <div className="absolute inset-0">
                  <img
                    src={project.thumbnailUrl}
                    alt={`${project.title} thumbnail`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    onError={(e) => {
                      // Fallback to a generic placeholder or hide the image
                      const target = e.target as HTMLImageElement;
                      target.onerror = null; // Prevent infinite loop
                      // You could replace with a generic placeholder image or hide it
                      // target.src = '/path/to/placeholder.svg';
                      target.style.display = 'none'; // Hide the broken image icon
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80 dark:from-black/30 dark:via-black/55 dark:to-black/90" />
                </div>

                {/* Top meta row: year + category + created date */}
                <div className="relative z-10 flex items-center justify-between px-5 pt-4 text-[11px] font-semibold text-white/90">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-black/70 px-2.5 py-1 uppercase tracking-wide transition-colors duration-500 group-hover:bg-surface/80 group-hover:text-text-primary">
                      <span className="mr-1 h-1.5 w-1.5 rounded-full bg-accent" />
                      {project.year}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 uppercase tracking-[0.16em] transition-colors duration-500 group-hover:bg-surface/60 group-hover:text-text-secondary">
                      {getCategoryLabel(project.category)}
                    </span>
                  </div>
                  <time
                    className="text-[11px] text-white/75 transition-colors duration-500 group-hover:text-text-muted"
                    dateTime={project.createdAt}
                  >
                    {formatDate(project.createdAt)}
                  </time>
                </div>

                {/* Content row: minimal by default, richer details on hover */}
                <div className="relative z-10 mt-auto px-5 pb-4 pt-4">
                  <div>
                    <p className="line-clamp-1 text-base font-semibold text-white transition-colors duration-500 group-hover:text-text-primary">
                      {project.title}
                    </p>
                  </div>

                  {/* Hover-only extra details + actions */}
                  <div className="pointer-events-none mt-3 max-h-0 opacity-0 transition-all duration-500 group-hover:pointer-events-auto group-hover:max-h-52 group-hover:opacity-100">
                    <div className="rounded-2xl border border-white/10 bg-black/80 p-4 text-[12px] text-white/95 shadow-[0_22px_55px_-30px_rgba(0,0,0,0.95)] backdrop-blur-md dark:bg-slate-950/95">
                      {project.shortDescription ? (
                        <p className="line-clamp-2 text-[13px] font-medium text-white">
                          {project.shortDescription}
                        </p>
                      ) : null}

                      {project.overviewDescription ? (
                        <p className="mt-1 line-clamp-2 text-[11px] text-white/80">
                          {project.overviewDescription}
                        </p>
                      ) : null}

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {project.scopeOfWork ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-0.5 text-[11px]">
                            <span className="font-semibold text-white">Scope</span>
                            <span className="max-w-[180px] truncate text-white/80">
                              {project.scopeOfWork}
                            </span>
                          </span>
                        ) : null}
                        {project.keywords.slice(0, 2).map((keyword) => (
                          <span
                            key={keyword}
                            className="inline-flex items-center rounded-full bg-white/10 px-3 py-0.5 text-[11px] font-medium text-white/85"
                          >
                            #{keyword}
                          </span>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(project)}
                          className="inline-flex items-center rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground shadow-[0_12px_30px_-20px_rgba(129,140,248,0.9)] transition-transform transition-colors hover:-translate-y-0.5 hover:bg-accent/90 hover:shadow-[0_16px_40px_-22px_rgba(129,140,248,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                        >
                          More details
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditProject(project)}
                            className="inline-flex items-center rounded-full border border-white/40 px-3 py-1 text-[11px] font-semibold text-white transition hover:border-accent/70 hover:bg-white/10 hover:text-accent"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteProject(project)}
                            className="inline-flex items-center rounded-full border border-error/70 px-3 py-1 text-[11px] font-semibold text-error-foreground transition hover:bg-error/20"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </li>
        ))}
      </ul>

      {activeProject ? (
        <Modal
          isOpen={Boolean(activeProject)}
          onClose={handleCloseDetails}
          className="max-h-[90vh] max-w-5xl overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-text-muted">
                  Project
                </p>
                <h2 className="mt-1 text-xl font-semibold text-text-primary">
                  {activeProject.title}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    <span className="font-semibold text-text-secondary">{activeProject.year}</span>
                  </span>
                  <span className="inline-flex items-center rounded-full bg-surface-muted px-2.5 py-1 font-medium text-text-secondary">
                    {getCategoryLabel(activeProject.category)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-text-muted">
                      Created
                    </span>
                    <time
                      dateTime={activeProject.createdAt}
                      className="text-[11px] text-text-secondary"
                    >
                      {formatDate(activeProject.createdAt)}
                    </time>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-text-muted">
                      Updated
                    </span>
                    <time
                      dateTime={activeProject.updatedAt}
                      className="text-[11px] text-text-secondary"
                    >
                      {formatDate(activeProject.updatedAt)}
                    </time>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseDetails}
                className="rounded-full p-1.5 text-text-muted transition hover:bg-surface-muted hover:text-text-secondary"
                aria-label="Close project details"
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

            <div className="grid gap-5 md:grid-cols-[1.1fr_1.1fr]">
              <div className="space-y-3">
                <div className="overflow-hidden rounded-2xl border border-border/60 bg-surface-muted">
                  <img
                    src={activeProject.thumbnailUrl}
                    alt={`${activeProject.title} thumbnail`}
                    className="h-56 w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.onerror = null
                      target.style.display = 'none'
                    }}
                  />
                </div>
                {activeProject.clientMockupUrl ? (
                  <div className="overflow-hidden rounded-2xl border border-border/60 bg-surface-muted">
                    <img
                      src={activeProject.clientMockupUrl}
                      alt={`${activeProject.title} client mockup`}
                      className="h-40 w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.onerror = null
                        target.style.display = 'none'
                      }}
                    />
                  </div>
                ) : null}
              </div>
              <div className="space-y-3 text-sm text-text-secondary">
                {activeProject.shortDescription ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                      Summary
                    </p>
                    <p className="mt-1 text-sm">{activeProject.shortDescription}</p>
                  </div>
                ) : null}
                {activeProject.overviewDescription ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                      Overview
                    </p>
                    <p className="mt-1 text-sm whitespace-pre-line">
                      {activeProject.overviewDescription}
                    </p>
                  </div>
                ) : null}
                {activeProject.scopeOfWork ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                      Scope of work
                    </p>
                    <p className="mt-1 text-sm">{activeProject.scopeOfWork}</p>
                  </div>
                ) : null}
                {activeProject.industries ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                      Industries
                    </p>
                    <p className="mt-1 text-sm">{activeProject.industries}</p>
                  </div>
                ) : null}
                {activeProject.keywords.length ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                      Keywords
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {activeProject.keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-text-secondary"
                        >
                          #{keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Brand identity (colors, badge, brand title/description) */}
            {(activeProject.primaryColor ||
              activeProject.secondaryColor ||
              activeProject.accentColor ||
              activeProject.badgeName ||
              activeProject.brandTitle ||
              activeProject.brandDescription) ? (
              <section className="space-y-3 rounded-2xl border border-border/60 bg-surface-muted/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                  Brand identity
                </p>
                <div className="grid gap-4 md:grid-cols-[0.9fr_1.6fr]">
                  <div className="space-y-3">
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
                  </div>
                  <div className="space-y-2 text-sm text-text-secondary">
                    {activeProject.brandTitle ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                          Brand title
                        </p>
                        <p className="mt-0.5 text-sm font-medium">{activeProject.brandTitle}</p>
                      </div>
                    ) : null}
                    {activeProject.brandDescription ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                          Brand description
                        </p>
                        <p className="mt-0.5 text-sm whitespace-pre-line">
                          {activeProject.brandDescription}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
            ) : null}

            {/* Website card */}
            {(activeProject.websiteUrl ||
              activeProject.websiteTitle ||
              activeProject.websiteDescription) ? (
              <section className="space-y-2 rounded-2xl border border-border/60 bg-surface-muted/40 p-4">
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

            {/* Testimonial card */}
            {(activeProject.testimonialFeedback ||
              activeProject.testimonialClientName) ? (
              <section className="space-y-2 rounded-2xl border border-border/60 bg-surface-muted/40 p-4">
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

            {/* All mockup images */}
            {(activeProject.brandingMockupUrl ||
              activeProject.brandingMockupSecondaryUrl ||
              activeProject.landscapeMockupUrl ||
              activeProject.websiteMockupUrl ||
              activeProject.footerMockupUrl) ? (
              <section className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                  Mockups
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Branding mockup', src: activeProject.brandingMockupUrl },
                    { label: 'Branding mockup (secondary)', src: activeProject.brandingMockupSecondaryUrl },
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
                          alt={`${activeProject.title} ${item.label.toLowerCase()}`}
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

            <div className="mt-2 flex flex-col gap-2 border-t border-border/60 pt-3 text-xs sm:flex-row sm:items-center sm:justify-between">
              <p className="text-text-muted">
                Manage this project or close to return to the gallery.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onEditProject(activeProject)
                    handleCloseDetails()
                  }}
                  className="inline-flex items-center rounded-xl border border-border/60 px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-accent/60 hover:text-accent"
                >
                  Edit project
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteProject(activeProject)
                    handleCloseDetails()
                  }}
                  className="inline-flex items-center rounded-xl border border-error/60 px-3 py-1.5 text-xs font-semibold text-error transition hover:border-error hover:bg-error/10"
                >
                  Delete project
                </button>
                <button
                  type="button"
                  onClick={handleCloseDetails}
                  className="inline-flex items-center rounded-xl border border-border/60 px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-accent/60 hover:text-accent"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}

      <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-surface/70 px-5 py-4 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing <span className="font-semibold text-text-secondary">{startItem}</span> –{' '}
          <span className="font-semibold text-text-secondary">{endItem}</span> of{' '}
          <span className="font-semibold text-text-secondary">{totalCount}</span> projects
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center rounded-xl border border-border/60 px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-accent/60 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <div className="flex items-center gap-2 rounded-xl border border-border/60 px-3 py-1.5 text-xs font-semibold text-text-secondary">
            {Array.from({ length: totalPages }).map((_, index) => {
              const page = index + 1
              const isActive = page === currentPage
              return (
                <Fragment key={page}>
                  <button
                    type="button"
                    onClick={() => onPageChange(page)}
                    disabled={isActive}
                    className={[
                      'h-8 w-8 rounded-lg transition',
                      isActive
                        ? 'bg-accent/20 text-accent shadow-[0_6px_18px_-18px_rgba(99,102,241,0.9)]'
                        : 'hover:bg-background/40',
                      'disabled:cursor-default', // Removed redundant disabled:text-accent
                    ].join(' ')}
                  >
                    {page}
                  </button>
                </Fragment>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center rounded-xl border border-border/60 px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-accent/60 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProjectList
