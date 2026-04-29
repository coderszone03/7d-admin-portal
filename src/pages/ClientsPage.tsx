import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import Modal from '../components/common/Modal'
import {
  createClient,
  deleteClient,
  fetchClients,
  updateClient,
  type ApiClient,
} from '../lib/api/clients'

type Client = ApiClient

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const FILE_TYPE_WHITELIST = ['image/png', 'image/jpeg', 'image/jpg']
const ITEMS_PER_PAGE = 5
const MAX_NAME_LENGTH = 100
const MAX_DESCRIPTION_LENGTH = 300

const primaryButtonClasses =
  'inline-flex h-11 items-center justify-center rounded-lg bg-[#6366f1] px-5 text-sm font-semibold text-white shadow-[0_8px_18px_-12px_rgba(99,102,241,0.7)] transition hover:bg-[#5457d8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6366f1] disabled:cursor-not-allowed disabled:bg-[#6366f1]/60 disabled:shadow-none'

const secondaryButtonClasses =
  'inline-flex h-11 items-center justify-center rounded-lg border border-border/60 px-4 text-sm font-semibold text-text-secondary transition hover:border-[#6366f1] hover:text-[#6366f1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6366f1]/40 disabled:cursor-not-allowed disabled:opacity-60'

const dangerButtonClasses =
  'inline-flex h-11 items-center justify-center rounded-lg bg-danger px-4 text-sm font-semibold text-white transition hover:bg-danger/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger/50 disabled:cursor-not-allowed disabled:opacity-60'

type FormMode = 'create' | 'edit'

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setModalOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<{
    name?: string
    description?: string
    logo?: string
    form?: string
  }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
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

  const loadClients = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchClients()
      setClients(data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load clients.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await fetchClients()
        if (!isMounted) return
        setClients(data)
      } catch (loadError) {
        if (!isMounted) return
        setError(loadError instanceof Error ? loadError.message : 'Unable to load clients.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    })()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(clients.length / ITEMS_PER_PAGE))
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [clients, currentPage])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(clients.length / ITEMS_PER_PAGE)),
    [clients],
  )

  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    return clients.slice(start, end)
  }, [clients, currentPage])

  const resetForm = () => {
    setName('')
    setDescription('')
    setLogoFile(null)
    setLogoPreview(null)
    setErrors({})
    setEditingClient(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleOpenCreateModal = () => {
    resetForm()
    setFormMode('create')
    setModalOpen(true)
  }

  const handleOpenEditModal = (target: Client) => {
    resetForm()
    setFormMode('edit')
    setEditingClient(target)
    setName(target.name)
    setDescription(target.description ?? '')
    setLogoPreview(target.logoUrl || null)
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

  const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value)
    setErrors((prev) => ({ ...prev, description: undefined }))
  }

  const isTypeAllowed = (file: File) => {
    const mime = file.type.toLowerCase()
    const extension = file.name.split('.').pop()?.toLowerCase()
    return (
      FILE_TYPE_WHITELIST.includes(mime) ||
      (extension ? ['png', 'jpg', 'jpeg'].includes(extension) : false)
    )
  }

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const file = input.files?.[0] ?? null

    if (!file) {
      setLogoFile(null)
      if (formMode === 'create') setLogoPreview(null)
      setErrors((prev) => ({ ...prev, logo: undefined }))
      return
    }

    if (!isTypeAllowed(file)) {
      setLogoFile(null)
      setErrors((prev) => ({ ...prev, logo: 'Logo must be a JPG or PNG image.' }))
      input.value = ''
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setLogoFile(null)
      setErrors((prev) => ({ ...prev, logo: 'Logo must be 2MB or smaller.' }))
      input.value = ''
      return
    }

    setLogoFile(file)
    setErrors((prev) => ({ ...prev, logo: undefined }))

    const reader = new FileReader()
    reader.onload = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const nextErrors: typeof errors = {}
    const trimmedName = name.trim()
    const trimmedDescription = description.trim()

    if (!trimmedName) {
      nextErrors.name = 'Client name is required.'
    } else if (trimmedName.length < 2) {
      nextErrors.name = 'Client name must be at least 2 characters.'
    } else if (trimmedName.length > MAX_NAME_LENGTH) {
      nextErrors.name = `Client name must be at most ${MAX_NAME_LENGTH} characters.`
    }

    if (!trimmedDescription) {
      nextErrors.description = 'Description is required.'
    } else if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
      nextErrors.description = `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters.`
    }

    if (formMode === 'create') {
      if (!logoFile) {
        nextErrors.logo = 'Client logo is required.'
      } else if (!isTypeAllowed(logoFile)) {
        nextErrors.logo = 'Logo must be a JPG or PNG image.'
      } else if (logoFile.size > MAX_FILE_SIZE) {
        nextErrors.logo = 'Logo must be 2MB or smaller.'
      }
    } else if (logoFile) {
      if (!isTypeAllowed(logoFile)) {
        nextErrors.logo = 'Logo must be a JPG or PNG image.'
      } else if (logoFile.size > MAX_FILE_SIZE) {
        nextErrors.logo = 'Logo must be 2MB or smaller.'
      }
    }

    return nextErrors
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatusMessage(null)
    const validationErrors = validate()

    if (
      validationErrors.name ||
      validationErrors.description ||
      validationErrors.logo
    ) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const trimmedName = name.trim()
      const trimmedDescription = description.trim()

      if (formMode === 'create') {
        if (!logoFile) {
          setErrors((prev) => ({ ...prev, logo: 'Client logo is required.' }))
          setIsSubmitting(false)
          return
        }
        await createClient({
          name: trimmedName,
          description: trimmedDescription,
          logo: logoFile,
        })
        setStatusMessage(`Added ${trimmedName} successfully.`)
      } else if (editingClient) {
        await updateClient(editingClient.id, {
          name: trimmedName,
          description: trimmedDescription,
          logo: logoFile,
        })
        setStatusMessage(`Updated ${trimmedName} successfully.`)
      }

      setModalOpen(false)
      resetForm()
      await loadClients()
      if (formMode === 'create') {
        setCurrentPage(1)
      }
    } catch (err) {
      console.error(err)
      setErrors((prev) => ({
        ...prev,
        form: extractApiError(
          err,
          formMode === 'create'
            ? 'Could not create client. Please try again.'
            : 'Could not update client. Please try again.',
        ),
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRequestDelete = (target: Client) => {
    setDeleteTarget(target)
  }

  const handleCancelDelete = () => {
    if (isDeleting) return
    setDeleteTarget(null)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    setStatusMessage(null)
    try {
      await deleteClient(deleteTarget.id)
      setClients((prev) => prev.filter((item) => item.id !== deleteTarget.id))
      setStatusMessage(`Removed ${deleteTarget.name}.`)
      setDeleteTarget(null)
    } catch (err) {
      console.error(err)
      setError(extractApiError(err, 'Could not delete client. Please try again.'))
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <section className="space-y-6">
      <header className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-text-secondary">Clients</h1>
            <p className="text-sm text-text-muted">
              Maintain a polished gallery of client partners and their brand assets.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
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
            Add client
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
              Client directory
            </h2>
            <p className="text-xs text-text-muted/80">
              Browse a curated bar of partner logos for quick reference.
            </p>
          </div>
          <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-text-secondary">
            {clients.length} total
          </span>
        </header>
        {isLoading ? (
          <div className="rounded-3xl border border-border/60 bg-surface/60 p-8 text-center text-sm text-text-muted">
            <p>Loading clients…</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-danger/40 bg-danger/10 p-8 text-center text-sm text-danger">
            {error}
          </div>
        ) : clients.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/60 bg-surface/60 p-8 text-center text-sm text-text-muted">
            No clients yet. Add your first partner to start building the directory.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto pt-2">
              <div className="grid min-w-[660px] grid-cols-5 gap-4">
                {paginatedClients.map((item) => (
                  <article
                    key={item.id}
                    className="group relative flex h-full flex-col items-center gap-4 rounded-3xl border border-border/60 bg-surface px-4 py-5 text-center shadow-sm transition hover:border-[#6366f1]/70 hover:shadow-[0_18px_35px_-20px_rgba(99,102,241,0.65)]"
                  >
                    <div
                      className="absolute right-1 top-3"
                      ref={openMenuId === item.id ? menuRef : undefined}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenuId((curr) => (curr === item.id ? null : item.id))
                        }}
                        data-open={openMenuId === item.id}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-transparent text-text-muted transition duration-150 hover:bg-surface-muted/70 hover:text-text-secondary data-[open=true]:bg-surface-muted/70 data-[open=true]:text-[#6366f1]"
                        aria-label={`Actions for ${item.name}`}
                        aria-haspopup="menu"
                        aria-expanded={openMenuId === item.id}
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
                          className="absolute left-full top-0 z-20 ml-2 min-w-[140px] overflow-hidden rounded-xl border border-border/60 bg-surface shadow-lg"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setOpenMenuId(null)
                              handleOpenEditModal(item)
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
                              handleRequestDelete(item)
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
                    <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl  transition">
                      <img
                        src={item.logoUrl}
                        alt={item.name}
                        className="h-full w-full object-contain bg-white"
                      />
                      <span className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-text-secondary">{item.name}</p>
                      <p
                        className={`line-clamp-2 min-h-[2.2em] text-[11px] ${
                          item.description ? 'text-text-muted' : 'italic text-text-muted/60'
                        }`}
                        title={item.description || undefined}
                      >
                        {item.description || 'No description'}
                      </p>
                      <p className="text-[11px] text-text-muted">Added {formatDate(item.uploadedAt)}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center justify-between gap-3 text-xs text-text-muted sm:flex-row">
              <p>
                Showing{' '}
                <span className="font-semibold text-text-secondary">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-text-secondary">
                  {Math.min(currentPage * ITEMS_PER_PAGE, clients.length)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-text-secondary">{clients.length}</span> clients
              </p>
              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex h-9 items-center rounded-lg border border-border/60 px-3 font-medium text-text-secondary transition hover:border-accent/60 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="rounded-full border border-border/60 px-3 py-1 font-medium text-text-secondary">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex h-9 items-center rounded-lg border border-border/60 px-3 font-medium text-text-secondary transition hover:border-accent/60 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} className="max-w-xl">
        <button
          type="button"
          onClick={handleCloseModal}
          className="absolute right-4 top-4 rounded-full p-1 text-text-muted transition hover:text-text-secondary disabled:opacity-50"
          aria-label="Close client modal"
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
            {formMode === 'create' ? 'Add client' : 'Edit client'}
          </h2>
          <p className="text-sm text-text-muted">
            {formMode === 'create'
              ? 'Upload the brand mark, add a short description, and give the client a recognizable name.'
              : 'Update the client details or replace the logo with a fresh brand asset.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="space-y-2">
            <label htmlFor="client-name" className="text-xs font-semibold uppercase text-text-muted">
              Client name
            </label>
            <input
              id="client-name"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Acme Corporation"
              maxLength={MAX_NAME_LENGTH}
              className="h-11 w-full rounded-lg border border-border/60 bg-background/70 px-4 text-sm text-text-secondary shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] outline-none transition focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20"
              disabled={isSubmitting}
            />
            {errors.name ? (
              <p className="text-xs font-medium text-danger">{errors.name}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="client-description"
                className="text-xs font-semibold uppercase text-text-muted"
              >
                Description
              </label>
              <span className="text-[11px] text-text-muted/80">
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
            <textarea
              id="client-description"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="A short summary about this client."
              maxLength={MAX_DESCRIPTION_LENGTH}
              rows={3}
              className="w-full rounded-lg border border-border/60 bg-background/70 px-4 py-3 text-sm text-text-secondary shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] outline-none transition focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20"
              disabled={isSubmitting}
            />
            {errors.description ? (
              <p className="text-xs font-medium text-danger">{errors.description}</p>
            ) : null}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase text-text-muted">
              Client logo
              {formMode === 'edit' ? (
                <span className="ml-2 text-[10px] font-medium normal-case text-text-muted/80">
                  (leave empty to keep current)
                </span>
              ) : null}
            </p>
            <div className="relative flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border/60 bg-background/70 p-6 text-center transition hover:border-accent/50 focus-within:border-accent/60 focus-within:bg-background/80">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-inner">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Client logo preview"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    className="h-10 w-10 text-text-muted"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2.5M3 16.5l4.5-4.5a1.414 1.414 0 0 1 2 0L15 15m-12 1.5 3-3a1.414 1.414 0 0 1 2 0L17 15m0 0 3-3m-7.5-8.25h-3A2.25 2.25 0 0 0 7.25 6v0A2.25 2.25 0 0 0 9.5 8.25h3A2.25 2.25 0 0 0 14.75 6v0A2.25 2.25 0 0 0 12.5 3.75Z" />
                  </svg>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-text-secondary">
                  {formMode === 'edit' ? 'Replace the logo' : 'Drag & drop your logo'}
                </p>
                <p className="text-xs text-text-muted">JPG or PNG, up to 2MB.</p>
              </div>
              <label className="group relative inline-flex cursor-pointer items-center gap-2 overflow-hidden rounded-full border border-border/60 bg-surface px-4 py-2 text-xs font-semibold text-text-secondary shadow-sm transition hover:border-[#6366f1] hover:text-[#6366f1]">
                <span className="relative z-10">Browse files</span>
                <span className="absolute inset-0 bg-gradient-to-r from-[#6366f1]/15 via-[#6366f1]/10 to-transparent opacity-0 transition group-hover:opacity-100" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                  onChange={handleLogoChange}
                  className="hidden"
                  disabled={isSubmitting}
                />
              </label>
            </div>
            {errors.logo ? (
              <p className="text-xs font-medium text-danger">{errors.logo}</p>
            ) : null}
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
                  ? 'Save client'
                  : 'Update client'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(deleteTarget)} onClose={handleCancelDelete} className="max-w-md">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-secondary">Delete client</h2>
          <p className="text-sm text-text-muted">
            Are you sure you want to remove{' '}
            <span className="font-semibold text-text-secondary">{deleteTarget?.name}</span>? This
            action cannot be undone.
          </p>
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
              {isDeleting ? 'Deleting…' : 'Delete client'}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

export default ClientsPage
