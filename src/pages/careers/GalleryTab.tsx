import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import Modal from '../../components/common/Modal'
import { validateImageDimensions } from '../../components/portfolio/projects/types'
import {
  GALLERY_IMAGE_MIME_TYPES,
  GALLERY_IMAGE_SPEC,
  MAX_ALT_LENGTH,
  MAX_GALLERY_IMAGES,
  MAX_GALLERY_IMAGE_SIZE,
  type CareersGalleryFormPayload,
  type CareersGalleryImage,
} from '../../components/careers/galleryTypes'
import {
  createCareersGalleryImage,
  deleteCareersGalleryImage,
  fetchCareersGallery,
  reorderCareersGallery,
  updateCareersGalleryImage,
} from '../../lib/api/careersGallery'

type EditState = {
  mode: 'create' | 'edit'
  item: CareersGalleryImage | null
  imageFile: File | null
  imagePreview: string | null
  alt: string
  status: 0 | 1
  displayOrder: number
  imageError?: string
  altError?: string
  formError?: string
}

const readFileAsDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })

const GalleryTab = () => {
  const [items, setItems] = useState<CareersGalleryImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const [editState, setEditState] = useState<EditState | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputResetToken = useRef(0)

  const [deleteTarget, setDeleteTarget] = useState<CareersGalleryImage | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const loadItems = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { items: nextItems } = await fetchCareersGallery()
      setItems(nextItems)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load the gallery.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        const { items: nextItems } = await fetchCareersGallery()
        if (!isMounted) return
        setItems(nextItems)
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Unable to load the gallery.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    })()
    return () => {
      isMounted = false
    }
  }, [])

  const isFull = items.length >= MAX_GALLERY_IMAGES

  const handleOpenCreate = () => {
    if (isFull) return
    setEditState({
      mode: 'create',
      item: null,
      imageFile: null,
      imagePreview: null,
      alt: '',
      status: 1,
      displayOrder: items.length + 1,
    })
    fileInputResetToken.current += 1
  }

  const handleOpenEdit = (item: CareersGalleryImage) => {
    setEditState({
      mode: 'edit',
      item,
      imageFile: null,
      imagePreview: item.imageUrl,
      alt: item.alt,
      status: item.status,
      displayOrder: item.displayOrder,
    })
    fileInputResetToken.current += 1
  }

  const handleCloseModal = () => {
    if (isSaving) return
    setEditState(null)
  }

  const handleImageChange = async (file: File | null) => {
    if (!editState) return
    if (!file) {
      setEditState({
        ...editState,
        imageFile: null,
        imagePreview: editState.item?.imageUrl ?? null,
        imageError: undefined,
      })
      fileInputResetToken.current += 1
      return
    }

    const mime = file.type.toLowerCase()
    if (!GALLERY_IMAGE_MIME_TYPES.includes(mime)) {
      setEditState({ ...editState, imageError: 'Image must be PNG, JPG, or WebP.' })
      fileInputResetToken.current += 1
      return
    }
    if (file.size > MAX_GALLERY_IMAGE_SIZE) {
      setEditState({ ...editState, imageError: 'Image must be 3MB or smaller.' })
      fileInputResetToken.current += 1
      return
    }

    const dimensionCheck = await validateImageDimensions(file, GALLERY_IMAGE_SPEC)
    if (!dimensionCheck.ok) {
      setEditState({ ...editState, imageError: dimensionCheck.error })
      fileInputResetToken.current += 1
      return
    }

    try {
      const preview = await readFileAsDataURL(file)
      setEditState({
        ...editState,
        imageFile: file,
        imagePreview: preview,
        imageError: undefined,
      })
    } catch (err) {
      setEditState({
        ...editState,
        imageError: err instanceof Error ? err.message : 'Failed to process image.',
      })
    }
  }

  const handleSave = async () => {
    if (!editState || isSaving) return

    const altTrimmed = editState.alt.trim()
    if (!altTrimmed) {
      setEditState({ ...editState, altError: 'Caption / alt text is required.' })
      return
    }
    if (altTrimmed.length > MAX_ALT_LENGTH) {
      setEditState({
        ...editState,
        altError: `Keep alt text under ${MAX_ALT_LENGTH} characters.`,
      })
      return
    }
    if (editState.mode === 'create' && !editState.imagePreview) {
      setEditState({ ...editState, imageError: 'Upload a 1200×800 image.' })
      return
    }
    if (!Number.isFinite(editState.displayOrder) || editState.displayOrder < 1) {
      setEditState({ ...editState, formError: 'Display order must be 1 or higher.' })
      return
    }

    setIsSaving(true)
    setStatusMessage(null)
    try {
      const payload: CareersGalleryFormPayload = {
        alt: altTrimmed,
        status: editState.status,
        displayOrder: editState.displayOrder,
        imageDataUrl: editState.imageFile ? editState.imagePreview ?? '' : '',
      }
      if (editState.mode === 'create') {
        await createCareersGalleryImage(payload)
        setStatusMessage('Image added to gallery.')
      } else if (editState.item) {
        await updateCareersGalleryImage(editState.item.id, payload)
        setStatusMessage('Image updated.')
      }
      setEditState(null)
      await loadItems()
    } catch (err) {
      setEditState({
        ...editState,
        formError: err instanceof Error ? err.message : 'Unable to save image.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRequestDelete = (item: CareersGalleryImage) => {
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
      await deleteCareersGalleryImage(deleteTarget.id)
      setStatusMessage('Image removed.')
      setDeleteTarget(null)
      await loadItems()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete the image.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDragStart = (id: string) => () => setDraggingId(id)
  const handleDragOver = (id: string) => (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverId(id)
  }
  const handleDragLeave = (id: string) => () => {
    setDragOverId((curr) => (curr === id ? null : curr))
  }
  const handleDragEnd = () => {
    setDraggingId(null)
    setDragOverId(null)
  }
  const handleDrop = (targetId: string) => async (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggingId || draggingId === targetId) {
      handleDragEnd()
      return
    }
    const sorted = items.slice().sort((a, b) => a.displayOrder - b.displayOrder)
    const fromIdx = sorted.findIndex((i) => i.id === draggingId)
    const toIdx = sorted.findIndex((i) => i.id === targetId)
    if (fromIdx === -1 || toIdx === -1) {
      handleDragEnd()
      return
    }
    const reordered = [...sorted]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    const pairs = reordered.map((item, idx) => ({ id: item.id, displayOrder: idx + 1 }))
    handleDragEnd()

    // Optimistic update for immediate visual feedback
    setItems(reordered.map((item, idx) => ({ ...item, displayOrder: idx + 1 })))
    try {
      await reorderCareersGallery(pairs)
      setStatusMessage('Order saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save order.')
      await loadItems()
    }
  }

  const sortedItems = items.slice().sort((a, b) => a.displayOrder - b.displayOrder)
  const visibleCount = sortedItems.filter((i) => i.status === 1).length

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.25em] text-text-muted">
            Public marquee
          </p>
          <p className="text-sm text-text-secondary">
            These images scroll continuously at the top of the public Careers page. Drag to
            reorder. Up to {MAX_GALLERY_IMAGES} images.
          </p>
          <p className="text-[11px] text-text-muted">
            <span className="font-semibold text-text-secondary">{items.length}</span> /{' '}
            {MAX_GALLERY_IMAGES} uploaded ·{' '}
            <span className="font-semibold text-text-secondary">{visibleCount}</span> visible.
            {visibleCount < 3 ? (
              <span className="ml-1 text-warning">
                Add at least 3 visible images for a smooth marquee.
              </span>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          disabled={isFull}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_28px_-20px_rgba(99,102,241,0.9)] transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
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
          {isFull ? 'Gallery full' : 'Add image'}
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

      {error ? (
        <p className="rounded-2xl border border-error/40 bg-error/10 px-4 py-3 text-xs text-error">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/2] animate-pulse rounded-2xl border border-border/60 bg-surface-muted"
            />
          ))}
        </div>
      ) : sortedItems.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-surface px-4 py-12 text-center">
          <p className="text-sm font-medium text-text-secondary">No images yet</p>
          <p className="text-xs text-text-muted">
            Upload at least 3 landscape photos (1200×800) to feed the marquee.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent/90"
          >
            Add image
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedItems.map((item) => {
            const isDragging = draggingId === item.id
            const isDragOver = dragOverId === item.id && draggingId !== item.id
            return (
              <figure
                key={item.id}
                onDragOver={handleDragOver(item.id)}
                onDragLeave={handleDragLeave(item.id)}
                onDrop={handleDrop(item.id)}
                className={[
                  'group relative overflow-hidden rounded-2xl border bg-surface transition',
                  isDragging ? 'opacity-40' : '',
                  isDragOver
                    ? 'border-accent ring-2 ring-accent/40'
                    : 'border-border/60 hover:border-accent/60',
                ].join(' ')}
              >
                <div className="relative aspect-[3/2] w-full overflow-hidden bg-surface-muted">
                  <img src={item.imageUrl} alt={item.alt} className="h-full w-full object-cover" />

                  {/* Drag handle (top-left) */}
                  <button
                    type="button"
                    draggable
                    onDragStart={handleDragStart(item.id)}
                    onDragEnd={handleDragEnd}
                    aria-label={`Reorder ${item.alt}`}
                    title="Drag to reorder"
                    className="absolute left-2 top-2 inline-flex h-7 w-7 cursor-grab items-center justify-center rounded-lg bg-black/55 text-white opacity-0 transition group-hover:opacity-100 active:cursor-grabbing"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-3.5 w-3.5"
                    >
                      <circle cx="9" cy="6" r="1.4" />
                      <circle cx="15" cy="6" r="1.4" />
                      <circle cx="9" cy="12" r="1.4" />
                      <circle cx="15" cy="12" r="1.4" />
                      <circle cx="9" cy="18" r="1.4" />
                      <circle cx="15" cy="18" r="1.4" />
                    </svg>
                  </button>

                  {/* Status badge (top-right) */}
                  <span
                    className={[
                      'absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]',
                      item.status === 1
                        ? 'bg-success/85 text-white'
                        : 'bg-black/55 text-white',
                    ].join(' ')}
                  >
                    {item.status === 1 ? 'Visible' : 'Hidden'}
                  </span>

                  {/* Order badge (bottom-left) */}
                  <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white">
                    #{item.displayOrder}
                  </span>

                  {/* Action buttons (bottom-right, on hover) */}
                  <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      aria-label={`Edit ${item.alt}`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-black/55 text-white transition hover:bg-accent"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        className="h-3.5 w-3.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.862 3.487a2.06 2.06 0 1 1 2.915 2.915L7.5 18.679l-4 1 1-4L16.862 3.487Z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestDelete(item)}
                      aria-label={`Delete ${item.alt}`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-black/55 text-white transition hover:bg-error"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        className="h-3.5 w-3.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.75 9.75v6.75m4.5-6.75v6.75M4.5 6.75h15m-1.5 0-.8 12a2.25 2.25 0 0 1-2.244 2.1H9.044a2.25 2.25 0 0 1-2.244-2.1L6 6.75"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <figcaption className="px-3 py-2 text-[11px] text-text-muted">
                  <span className="block truncate text-text-secondary">{item.alt}</span>
                </figcaption>
              </figure>
            )
          })}
        </div>
      )}

      {/* Edit modal */}
      <Modal
        isOpen={Boolean(editState)}
        onClose={handleCloseModal}
        className="max-w-xl"
      >
        {editState ? (
          <div className="space-y-5">
            <header className="space-y-1">
              <h2 className="text-lg font-semibold text-text-secondary">
                {editState.mode === 'create' ? 'Add image' : 'Edit image'}
              </h2>
              <p className="text-xs text-text-muted">
                Landscape 1200×800 (3:2). Max 3MB. PNG, JPG, or WebP.
              </p>
            </header>

            <div className="space-y-2">
              <div
                className={[
                  'flex flex-col gap-3 rounded-2xl border-2 border-dashed bg-background p-4 sm:flex-row sm:items-center',
                  editState.imagePreview ? 'border-border/40' : 'border-border/60',
                  editState.imageError ? 'border-error/60' : '',
                ].join(' ')}
              >
                <div className="aspect-[3/2] w-full overflow-hidden rounded-xl border border-border/60 bg-surface-muted sm:w-44">
                  {editState.imagePreview ? (
                    <img
                      src={editState.imagePreview}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs text-text-muted">
                      No image
                    </span>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-xs text-text-secondary">
                    {editState.mode === 'create'
                      ? 'Upload a 1200×800 landscape image.'
                      : 'Replace the current image, or leave to keep it.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <label
                      htmlFor="gallery-image"
                      className="inline-flex cursor-pointer items-center rounded-xl border border-border/60 bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-accent hover:text-accent"
                    >
                      {editState.imagePreview ? 'Replace image' : 'Upload image'}
                    </label>
                    {editState.imagePreview && editState.imageFile ? (
                      <button
                        type="button"
                        onClick={() => handleImageChange(null)}
                        className="inline-flex items-center rounded-xl border border-border/60 bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-error/60 hover:text-error"
                      >
                        Revert
                      </button>
                    ) : null}
                  </div>
                  <input
                    id="gallery-image"
                    key={`gallery-image-${fileInputResetToken.current}`}
                    type="file"
                    accept={GALLERY_IMAGE_MIME_TYPES.join(',')}
                    className="hidden"
                    onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>
              {editState.imageError ? (
                <p className="text-xs text-error">{editState.imageError}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
                  Caption / alt text *
                </label>
                <span className="text-[11px] tabular-nums text-text-muted">
                  {editState.alt.length} / {MAX_ALT_LENGTH}
                </span>
              </div>
              <input
                type="text"
                value={editState.alt}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEditState({ ...editState, alt: e.target.value, altError: undefined })
                }
                className="h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="e.g. Studio team after the Diwali launch"
                maxLength={MAX_ALT_LENGTH + 5}
              />
              {editState.altError ? (
                <p className="text-xs text-error">{editState.altError}</p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
                  Visibility
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 0 as const, label: 'Hidden' },
                    { value: 1 as const, label: 'Visible' },
                  ].map((option) => {
                    const isActive = editState.status === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setEditState({ ...editState, status: option.value })
                        }
                        className={[
                          'flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition',
                          isActive
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border/60 bg-surface text-text-secondary hover:border-accent/60 hover:text-accent',
                        ].join(' ')}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
                  Display order
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={editState.displayOrder}
                  onChange={(e) => {
                    const v = Number.parseInt(e.target.value, 10)
                    setEditState({
                      ...editState,
                      displayOrder: Number.isFinite(v) ? v : 1,
                    })
                  }}
                  className="h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>

            {editState.formError ? (
              <p className="rounded-xl border border-error/50 bg-error/10 px-3 py-2 text-xs text-error">
                {editState.formError}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border/60 px-4 text-sm font-semibold text-text-secondary transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving
                  ? 'Saving…'
                  : editState.mode === 'create'
                    ? 'Add image'
                    : 'Save changes'}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Delete confirm */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={handleCancelDelete}
        className="max-w-md"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-secondary">Remove image</h2>
          <p className="text-sm text-text-muted">
            Remove{' '}
            <span className="font-semibold text-text-secondary">{deleteTarget?.alt}</span>?
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

export default GalleryTab
