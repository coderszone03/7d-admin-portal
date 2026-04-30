import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import Modal from '../../components/common/Modal'
import {
  createBlogCategory,
  deleteBlogCategory,
  fetchBlogCategories,
  searchBlogCategories,
  updateBlogCategory,
  type BlogCategory,
} from '../../lib/api/blog'

const MAX_NAME_LENGTH = 100

const primaryButtonClasses =
  'inline-flex h-11 items-center justify-center rounded-lg bg-[#6366f1] px-5 text-sm font-semibold text-white shadow-[0_8px_18px_-12px_rgba(99,102,241,0.7)] transition hover:bg-[#5457d8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6366f1] disabled:cursor-not-allowed disabled:bg-[#6366f1]/60 disabled:shadow-none'

const secondaryButtonClasses =
  'inline-flex h-11 items-center justify-center rounded-lg border border-border/60 px-4 text-sm font-semibold text-text-secondary transition hover:border-[#6366f1] hover:text-[#6366f1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6366f1]/40 disabled:cursor-not-allowed disabled:opacity-60'

const dangerButtonClasses =
  'inline-flex h-11 items-center justify-center rounded-lg bg-danger px-4 text-sm font-semibold text-white transition hover:bg-danger/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger/50 disabled:cursor-not-allowed disabled:opacity-60'

type FormMode = 'create' | 'edit'

const BlogCategoriesPage = () => {
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const [isModalOpen, setModalOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null)
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'0' | '1'>('1')
  const [errors, setErrors] = useState<{ name?: string; form?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<BlogCategory | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearchTerm(searchInput.trim())
    }, 300)
    return () => window.clearTimeout(handle)
  }, [searchInput])

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

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

  const loadCategories = async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const data = searchTerm
        ? await searchBlogCategories(searchTerm)
        : await fetchBlogCategories()
      setCategories(data)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to load categories.')
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
        const data = searchTerm
          ? await searchBlogCategories(searchTerm)
          : await fetchBlogCategories()
        if (!isMounted) return
        setCategories(data)
      } catch (err) {
        if (!isMounted) return
        setLoadError(err instanceof Error ? err.message : 'Unable to load categories.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    })()
    return () => {
      isMounted = false
    }
  }, [searchTerm])

  const extractApiError = (err: unknown, fallback: string) => {
    const anyErr = err as any
    return (
      anyErr?.response?.data?.message ??
      anyErr?.response?.data?.error ??
      anyErr?.message ??
      fallback
    )
  }

  const resetForm = () => {
    setName('')
    setStatus('1')
    setErrors({})
    setEditingCategory(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setFormMode('create')
    setModalOpen(true)
  }

  const handleOpenEdit = (category: BlogCategory) => {
    resetForm()
    setFormMode('edit')
    setEditingCategory(category)
    setName(category.name)
    setStatus(category.status ?? '1')
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    if (isSubmitting) return
    setModalOpen(false)
    resetForm()
  }

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value)
    setErrors((prev) => ({ ...prev, name: undefined }))
  }

  const validate = () => {
    const nextErrors: typeof errors = {}
    const trimmed = name.trim()
    if (!trimmed) nextErrors.name = 'Category name is required.'
    else if (trimmed.length < 2) nextErrors.name = 'Category name must be at least 2 characters.'
    else if (trimmed.length > MAX_NAME_LENGTH)
      nextErrors.name = `Category name must be at most ${MAX_NAME_LENGTH} characters.`
    return nextErrors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatusMessage(null)
    const nextErrors = validate()
    if (nextErrors.name) {
      setErrors(nextErrors)
      return
    }
    setIsSubmitting(true)
    try {
      const trimmed = name.trim()
      if (formMode === 'create') {
        await createBlogCategory({ name: trimmed, status })
        setStatusMessage(`Added "${trimmed}" successfully.`)
      } else if (editingCategory) {
        await updateBlogCategory(editingCategory.id, { name: trimmed, status })
        setStatusMessage(`Updated "${trimmed}" successfully.`)
      }
      setModalOpen(false)
      resetForm()
      await loadCategories()
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        form: extractApiError(
          err,
          formMode === 'create'
            ? 'Could not create category. Please try again.'
            : 'Could not update category. Please try again.',
        ),
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRequestDelete = (category: BlogCategory) => {
    setDeleteError(null)
    setDeleteTarget(category)
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
      await deleteBlogCategory(deleteTarget.id)
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      setStatusMessage(`Removed "${deleteTarget.name}".`)
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(extractApiError(err, 'Could not delete category. Please try again.'))
    } finally {
      setIsDeleting(false)
    }
  }

  const totalCount = categories.length
  const activeCount = useMemo(
    () => categories.filter((c) => c.status === '1').length,
    [categories],
  )

  return (
    <section className="space-y-6">
      <header className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-text-muted">Blog</p>
            <h1 className="text-2xl font-semibold text-text-secondary">Categories</h1>
            <p className="text-sm text-text-muted">
              Organise your editorial themes and manage the taxonomy that powers your content.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className={`${primaryButtonClasses} gap-2`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
            </svg>
            Add category
          </button>
        </div>
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
      </header>

      <div className="space-y-5">
        <header className="flex flex-col items-start justify-between gap-3 rounded-3xl border border-border/60 bg-surface/70 px-6 py-4 shadow-sm sm:flex-row sm:items-center">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              Category directory
            </h2>
            <p className="text-xs text-text-muted/80">
              Edit or remove categories, or add a new editorial theme.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
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
                placeholder="Search by name…"
                className="h-9 w-56 rounded-xl border border-border/60 bg-background pl-9 pr-9 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
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
            <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-text-secondary">
              {totalCount} total · {activeCount} active
            </span>
          </div>
        </header>

        {isLoading ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-surface p-4"
              >
                <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-surface-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 animate-pulse rounded-full bg-surface-muted" />
                  <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-surface-muted" />
                </div>
              </li>
            ))}
          </ul>
        ) : loadError ? (
          <div className="rounded-3xl border border-danger/40 bg-danger/10 p-8 text-center text-sm text-danger">
            {loadError}
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/60 bg-surface/60 p-10 text-center text-sm text-text-muted">
            <p className="font-medium text-text-secondary">
              {searchTerm ? 'No categories match your search' : 'No categories yet'}
            </p>
            <p className="mt-1 text-xs">
              {searchTerm
                ? 'Try a different keyword.'
                : 'Create your first editorial theme to get started.'}
            </p>
            {!searchTerm ? (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent/90"
              >
                Add category
              </button>
            ) : null}
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <li
                key={category.id}
                className="group relative flex items-center gap-3 rounded-2xl border border-border/60 bg-surface p-4 transition hover:border-[#6366f1]/60 hover:shadow-[0_18px_35px_-24px_rgba(99,102,241,0.55)]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-sm font-semibold uppercase text-text-muted">
                  {category.name.charAt(0) || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-text-secondary">
                      {category.name}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${
                        category.status === '1'
                          ? 'bg-success/15 text-success'
                          : 'bg-surface-muted text-text-muted'
                      }`}
                    >
                      {category.status === '1' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div
                  className="relative shrink-0"
                  ref={openMenuId === category.id ? menuRef : undefined}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenuId((curr) => (curr === category.id ? null : category.id))
                    }
                    data-open={openMenuId === category.id}
                    aria-label={`Actions for ${category.name}`}
                    aria-haspopup="menu"
                    aria-expanded={openMenuId === category.id}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition hover:bg-surface-muted hover:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/40 data-[open=true]:bg-surface-muted data-[open=true]:text-accent"
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
                  {openMenuId === category.id ? (
                    <div
                      role="menu"
                      className="absolute right-0 top-10 z-20 min-w-[140px] overflow-hidden rounded-xl border border-border/60 bg-surface shadow-lg"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setOpenMenuId(null)
                          handleOpenEdit(category)
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-text-secondary transition hover:bg-surface-muted/60 hover:text-[#6366f1]"
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
                          handleRequestDelete(category)
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
            ))}
          </ul>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} className="max-w-lg">
        <button
          type="button"
          onClick={handleCloseModal}
          className="absolute right-4 top-4 rounded-full p-1 text-text-muted transition hover:text-text-secondary disabled:opacity-50"
          aria-label="Close category modal"
          disabled={isSubmitting}
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
        <div className="mb-6 space-y-2">
          <h2 className="text-xl font-semibold text-text-secondary">
            {formMode === 'create' ? 'Add category' : 'Edit category'}
          </h2>
          <p className="text-sm text-text-muted">
            {formMode === 'create'
              ? 'Create a new editorial theme for your blog posts.'
              : 'Update this category name or toggle its availability.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="category-name" className="text-xs font-semibold uppercase text-text-muted">
                Category name
              </label>
              <span className="text-[10px] font-medium text-text-muted">
                {name.length}/{MAX_NAME_LENGTH}
              </span>
            </div>
            <input
              id="category-name"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Design, Engineering, Strategy…"
              maxLength={MAX_NAME_LENGTH}
              className="h-11 w-full rounded-lg border border-border/60 bg-background/70 px-4 text-sm text-text-secondary outline-none transition focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20"
              disabled={isSubmitting}
              autoFocus
            />
            {errors.name ? (
              <p className="text-xs font-medium text-danger">{errors.name}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-text-muted">Status</label>
            <div className="inline-flex items-center gap-1 rounded-xl border border-border/60 bg-background/70 p-1">
              <button
                type="button"
                onClick={() => setStatus('1')}
                disabled={isSubmitting}
                className={`h-8 rounded-lg px-3 text-xs font-medium transition ${
                  status === '1' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatus('0')}
                disabled={isSubmitting}
                className={`h-8 rounded-lg px-3 text-xs font-medium transition ${
                  status === '0' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                Inactive
              </button>
            </div>
          </div>

          {errors.form ? (
            <p className="rounded-xl border border-danger/50 bg-danger/10 px-3 py-2 text-xs text-danger">
              {errors.form}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCloseModal}
              className={secondaryButtonClasses}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className={primaryButtonClasses} disabled={isSubmitting}>
              {isSubmitting
                ? formMode === 'create'
                  ? 'Saving…'
                  : 'Updating…'
                : formMode === 'create'
                  ? 'Save category'
                  : 'Update category'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(deleteTarget)} onClose={handleCancelDelete} className="max-w-md">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-secondary">Delete category</h2>
          <p className="text-sm text-text-muted">
            Are you sure you want to remove{' '}
            <span className="font-semibold text-text-secondary">{deleteTarget?.name}</span>? Posts
            in this category may become uncategorised.
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
              {isDeleting ? 'Deleting…' : 'Delete category'}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

export default BlogCategoriesPage
