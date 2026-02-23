import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import Modal from '../components/common/Modal'

type Client = {
  id: string
  name: string
  logoUrl: string
  uploadedAt: string
}

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const FILE_TYPE_WHITELIST = ['image/png', 'image/jpeg', 'image/jpg']
const ITEMS_PER_PAGE = 5

const createPlaceholderLogo = (name: string) => {
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
  const palette = ['6366f1', '22d3ee', 'f97316', '10b981', 'ef4444', 'a855f7']
  const color = palette[name.length % palette.length]

  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><defs><linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23${color}' stop-opacity='0.85'/><stop offset='100%' stop-color='%23${color}' stop-opacity='1'/></linearGradient></defs><rect width='160' height='160' rx='36' fill='url(%23grad)'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='Inter, Arial, sans-serif' font-size='64' fill='%23ffffff' font-weight='700'>${initials}</text></svg>`
}

const seedClients: Client[] = [
  'Apex Solutions',
  'Nimbus Labs',
  'Orbit Media',
  'Lumen Health',
  'Verve Creative',
  'Sync Digital',
  'Northwind Partners',
  'Aurora Ventures',
].map((name, index) => ({
  id: `seed-${index}`,
  name,
  logoUrl: createPlaceholderLogo(name),
  uploadedAt: new Date(Date.now() - index * 86400000).toISOString(),
}))

const primaryButtonClasses =
  'inline-flex h-11 items-center justify-center rounded-lg bg-[#6366f1] px-5 text-sm font-semibold text-white shadow-[0_8px_18px_-12px_rgba(99,102,241,0.7)] transition hover:bg-[#5457d8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6366f1] disabled:cursor-not-allowed disabled:bg-[#6366f1]/60 disabled:shadow-none'

const secondaryButtonClasses =
  'inline-flex h-11 items-center justify-center rounded-lg border border-border/60 px-4 text-sm font-semibold text-text-secondary transition hover:border-[#6366f1] hover:text-[#6366f1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6366f1]/40'

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>(seedClients)
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setModalOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ name?: string; logo?: string; form?: string }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    setLogoFile(null)
    setLogoPreview(null)
    setErrors({})
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleOpenModal = () => {
    resetForm()
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    resetForm()
  }

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value)
    setErrors((prev) => ({ ...prev, name: undefined }))
  }

  const isTypeAllowed = (file: File) => {
    const mime = file.type.toLowerCase()
    const extension = file.name.split('.').pop()?.toLowerCase()
    return FILE_TYPE_WHITELIST.includes(mime) || (extension ? ['png', 'jpg', 'jpeg'].includes(extension) : false)
  }

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const file = input.files?.[0] ?? null

    if (!file) {
      setLogoFile(null)
      setLogoPreview(null)
      setErrors((prev) => ({ ...prev, logo: undefined }))
      return
    }

    if (!isTypeAllowed(file)) {
      setLogoFile(null)
      setLogoPreview(null)
      setErrors((prev) => ({ ...prev, logo: 'Logo must be a JPG or PNG image.' }))
      input.value = ''
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setLogoFile(null)
      setLogoPreview(null)
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
    if (!name.trim()) {
      nextErrors.name = 'Client name is required.'
    } else if (name.trim().length < 2) {
      nextErrors.name = 'Client name must be at least 2 characters.'
    }

    if (!logoFile) {
      nextErrors.logo = 'Client logo is required.'
    } else {
      if (!isTypeAllowed(logoFile)) {
        nextErrors.logo = 'Logo must be a JPG or PNG image.'
      } else if (logoFile.size > MAX_FILE_SIZE) {
        nextErrors.logo = 'Logo must be 2MB or smaller.'
      }
    }

    return nextErrors
  }

  const readFileAsDataURL = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatusMessage(null)
    const validationErrors = validate()

    if (validationErrors.name || validationErrors.logo) {
      setErrors(validationErrors)
      return
    }

    if (!logoFile) {
      setErrors((prev) => ({ ...prev, logo: 'Client logo is required.' }))
      return
    }

    try {
      const logoUrl = await readFileAsDataURL(logoFile)
      const client: Client = {
        id: crypto.randomUUID?.() ?? `client-${Date.now()}`,
        name: name.trim(),
        logoUrl,
        uploadedAt: new Date().toISOString(),
      }

      setClients((prev) => [client, ...prev])
      setCurrentPage(1)
      setStatusMessage(`Added ${client.name} successfully.`)
      setModalOpen(false)
      resetForm()
    } catch (error) {
      console.error(error)
      setErrors((prev) => ({
        ...prev,
        form: 'Something went wrong while uploading the logo. Please try again.',
      }))
    }
  }

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate)
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
          <button type="button" onClick={handleOpenModal} className={`${primaryButtonClasses} gap-2`}>
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
        {clients.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/60 bg-surface/60 p-8 text-center text-sm text-text-muted">
            No clients yet. Add your first partner to start building the directory.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <div className="grid min-w-[660px] grid-cols-5 gap-4">
                {paginatedClients.map((client) => (
                  <article
                    key={client.id}
                    className="group flex h-full flex-col items-center gap-4 rounded-3xl border border-border/60 bg-surface px-4 py-5 text-center shadow-sm transition hover:-translate-y-1 hover:border-[#6366f1]/70 hover:shadow-[0_18px_35px_-20px_rgba(99,102,241,0.65)]"
                  >
                    <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-background/70 transition group-hover:border-[#6366f1]/70">
                      <img
                        src={client.logoUrl}
                        alt={client.name}
                        className="h-full w-full object-contain"
                      />
                      <span className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-text-secondary">{client.name}</p>
                      <p className="text-[11px] text-text-muted">Added {formatDate(client.uploadedAt)}</p>
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
          className="absolute right-4 top-4 rounded-full p-1 text-text-muted transition hover:text-text-secondary"
          aria-label="Close add client modal"
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
          <h2 className="text-xl font-semibold text-text-secondary">Add client</h2>
          <p className="text-sm text-text-muted">
            Upload the brand mark and give the client a recognizable name.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7" noValidate>
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
              className="h-11 w-full rounded-lg border border-border/60 bg-background/70 px-4 text-sm text-text-secondary shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] outline-none transition focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20"
            />
            {errors.name ? (
              <p className="text-xs font-medium text-danger">{errors.name}</p>
            ) : null}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase text-text-muted">Client logo</p>
            <div className="relative flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border/60 bg-background/70 p-6 text-center transition hover:border-accent/50 focus-within:border-accent/60 focus-within:bg-background/80">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-surface-muted/70 shadow-inner">
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
                <p className="text-sm font-medium text-text-secondary">Drag & drop your logo</p>
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
            >
              Cancel
            </button>
            <button
              type="submit"
              className={primaryButtonClasses}
            >
              Save client
            </button>
          </div>
        </form>
      </Modal>
    </section>
  )
}

export default ClientsPage
