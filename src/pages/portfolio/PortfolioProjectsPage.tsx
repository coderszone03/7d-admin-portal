import { useEffect, useMemo, useState } from 'react'
import ProjectFormModal from '../../components/portfolio/projects/ProjectFormModal'
import ProjectList from '../../components/portfolio/projects/ProjectList'
import {
  PROJECT_KEYWORD_OPTIONS,
  type Project,
  type ProjectDetailsStepPayload,
} from '../../components/portfolio/projects/types'
import {
  createPortfolio,
  deletePortfolio,
  fetchPortfolios,
  updatePortfolio,
} from '../../lib/api/portfolio'
import Modal from '../../components/common/Modal'

const ITEMS_PER_PAGE = 6

const secondaryButtonClasses =
  'inline-flex h-11 items-center justify-center rounded-lg border border-border/60 px-4 text-sm font-semibold text-text-secondary transition hover:border-[#6366f1] hover:text-[#6366f1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6366f1]/40 disabled:cursor-not-allowed disabled:opacity-60'

const dangerButtonClasses =
  'inline-flex h-11 items-center justify-center rounded-lg bg-danger px-4 text-sm font-semibold text-white transition hover:bg-danger/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger/50 disabled:cursor-not-allowed disabled:opacity-60'

const PortfolioProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isFormOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [projectBeingEdited, setProjectBeingEdited] = useState<Project | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const loadProjects = async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const data = await fetchPortfolios()
      setProjects(data)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to load portfolio projects.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      setIsLoading(true)
      setLoadError(null)
      try {
        const data = await fetchPortfolios()
        if (!isMounted) return
        setProjects(data)
      } catch (err) {
        if (!isMounted) return
        setLoadError(err instanceof Error ? err.message : 'Unable to load portfolio projects.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    })()
    return () => {
      isMounted = false
    }
  }, [])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(projects.length / ITEMS_PER_PAGE)),
    [projects.length],
  )

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    return projects.slice(start, end)
  }, [currentPage, projects])

  const handleOpenCreate = () => {
    setFormMode('create')
    setProjectBeingEdited(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (project: Project) => {
    setFormMode('edit')
    setProjectBeingEdited(project)
    setFormOpen(true)
  }

  const handleCloseForm = () => {
    setFormOpen(false)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
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

  const handleSubmit = async (payload: ProjectDetailsStepPayload) => {
    setStatusMessage(null)
    if (formMode === 'edit' && projectBeingEdited) {
      await updatePortfolio(projectBeingEdited.id, payload)
      setStatusMessage(`Updated "${payload.title}" successfully.`)
    } else {
      await createPortfolio(payload)
      setStatusMessage(`Added "${payload.title}" successfully.`)
      setCurrentPage(1)
    }
    await loadProjects()
  }

  const handleRequestDelete = (project: Project) => {
    setDeleteError(null)
    setDeleteTarget(project)
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
      await deletePortfolio(deleteTarget.id)
      setProjects((prev) => prev.filter((item) => item.id !== deleteTarget.id))
      setStatusMessage(`Removed "${deleteTarget.title}".`)
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(extractApiError(err, 'Could not delete the project. Please try again.'))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.25em] text-text-muted">Portfolio</p>
          <h2 className="text-3xl font-semibold text-text-primary">Projects</h2>
          <p className="max-w-2xl text-sm text-text-muted">
            Maintain a curated library of client stories, launches, and campaigns. Organize
            projects with consistent metadata for a polished portfolio in both themes.
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
          Add project
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

      {isLoading ? (
        <div className="rounded-3xl border border-border/60 bg-surface/60 p-8 text-center text-sm text-text-muted">
          Loading portfolio projects…
        </div>
      ) : loadError ? (
        <div className="rounded-3xl border border-danger/40 bg-danger/10 p-8 text-center text-sm text-danger">
          {loadError}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 bg-surface/60 p-8 text-center text-sm text-text-muted">
          No projects yet. Add your first case study to start building the portfolio.
        </div>
      ) : (
        <ProjectList
          projects={paginatedProjects}
          totalCount={projects.length}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={handlePageChange}
          onEditProject={handleOpenEdit}
          onDeleteProject={handleRequestDelete}
        />
      )}

      <ProjectFormModal
        isOpen={isFormOpen}
        mode={formMode}
        initialProject={projectBeingEdited}
        keywordOptions={PROJECT_KEYWORD_OPTIONS}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
      />

      <Modal isOpen={Boolean(deleteTarget)} onClose={handleCancelDelete} className="max-w-md">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-secondary">Delete project</h2>
          <p className="text-sm text-text-muted">
            Are you sure you want to remove{' '}
            <span className="font-semibold text-text-secondary">{deleteTarget?.title}</span>? This
            action cannot be undone.
          </p>
          {deleteError ? (
            <p className="rounded-xl border border-danger/50 bg-danger/10 px-3 py-2 text-xs text-danger">
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
              {isDeleting ? 'Deleting…' : 'Delete project'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default PortfolioProjectsPage
