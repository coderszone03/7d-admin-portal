import { useRef } from 'react'
import { MEDIA_UPLOAD_MIME_TYPES, type ProjectDetailsFormValues, type ProjectMediaField } from '../types'

type ProjectMediaStepProps = {
  values: ProjectDetailsFormValues
  errors: {
    clientMockup?: string
    brandingMockup?: string
    brandingMockupSecondary?: string
    badgeName?: string
    brandTitle?: string
    brandDescription?: string
  }
  fileInputResetKeys: Record<ProjectMediaField, number>
  onAssetChange: (field: ProjectMediaField, file: File | null) => void
  onAssetRemove: (field: ProjectMediaField) => void
  onColorChange: (field: 'primaryColor' | 'secondaryColor' | 'accentColor', value: string) => void
  onFieldChange: <
    K extends 'badgeName' | 'brandTitle' | 'brandDescription',
  >(field: K, value: ProjectDetailsFormValues[K]) => void
}

const MEDIA_ACCEPT = MEDIA_UPLOAD_MIME_TYPES.join(',')

const Step3 = ({
  values,
  errors,
  fileInputResetKeys,
  onAssetChange,
  onAssetRemove,
  onColorChange,
  onFieldChange,
}: ProjectMediaStepProps) => {
  const primaryColor = values.primaryColor
  const secondaryColor = values.secondaryColor
  const accentColor = values.accentColor
  const badgeName = values.badgeName
  const brandTitle = values.brandTitle
  const brandDescription = values.brandDescription

  const primaryColorInputRef = useRef<HTMLInputElement | null>(null)
  const secondaryColorInputRef = useRef<HTMLInputElement | null>(null)
  const accentColorInputRef = useRef<HTMLInputElement | null>(null)

  const getPreview = (field: ProjectMediaField) =>
    field === 'clientMockup'
      ? values.clientMockupPreview
      : field === 'brandingMockup'
        ? values.brandingMockupPreview
        : values.brandingMockupSecondaryPreview

  return (
    <div className="space-y-6 pb-24">
      <div className="space-y-0.5">
        <h3 className="text-lg font-semibold text-text-secondary">Branding media</h3>
        <p className="text-sm text-text-muted">
          Client mockup, branding frames, color palette, and supporting brand information.
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-text-secondary">
            Client project mockup <span className="text-danger">*</span>
          </h3>
          <p className="text-sm text-text-muted">
            Upload the primary client-facing frame for this project. GIF uploads are supported.
          </p>
          <p className="text-xs text-text-muted">PNG, JPG, or GIF up to 2MB.</p>
        </div>

        {(() => {
          const field: ProjectMediaField = 'clientMockup'
          const preview = getPreview(field)
          const hasPreview = Boolean(preview)
          const inputId = `project-${field}-upload`
          const error = errors[field]

          return (
            <div
              className={[
                'relative flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-border/55 bg-background/30 p-6 text-center transition',
                hasPreview ? 'border-border/40 bg-background/40' : 'hover:border-accent/50',
                error ? 'border-error/60' : '',
              ].join(' ')}
            >
              {hasPreview ? (
                <>
                  <img
                    src={preview ?? ''}
                    alt="Client project mockup preview"
                    className="h-48 w-full rounded-2xl object-cover shadow-[0_20px_38px_-30px_rgba(15,17,21,0.85)]"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onAssetRemove(field)}
                      className="inline-flex items-center rounded-xl border border-border/60 px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-error/70 hover:text-error"
                    >
                      Remove
                    </button>
                    <label
                      htmlFor={inputId}
                      className="inline-flex cursor-pointer items-center rounded-xl bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/20"
                    >
                      Replace
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col items-center gap-2">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
                      </svg>
                    </span>
                    <p className="text-sm font-medium text-text-secondary">Drag & drop or click to upload</p>
                    <p className="text-xs text-text-muted">PNG, JPG, or GIF up to 2MB</p>
                  </div>
                  <label
                    htmlFor={inputId}
                    className="inline-flex cursor-pointer items-center rounded-xl border border-border/60 px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-accent/60 hover:text-accent"
                  >
                    Browse files
                  </label>
                </>
              )}
              <input
                id={inputId}
                key={`${field}-${fileInputResetKeys[field]}`}
                type="file"
                accept={MEDIA_ACCEPT}
                className="hidden"
                onChange={(event) => onAssetChange(field, event.target.files?.[0] ?? null)}
              />

              {error ? <p className="mt-2 text-xs text-error">{error}</p> : null}
            </div>
          )
        })()}
        </div>

        <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-text-secondary">
            Branding system mockup <span className="text-danger">*</span>
          </p>
          <p className="text-xs text-text-muted">
            Use two frames to showcase your branding system (logo sheets, toolkit spreads, and supporting brand imagery).
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {(['brandingMockup', 'brandingMockupSecondary'] as ProjectMediaField[]).map((field, index) => {
            const preview = getPreview(field)
            const hasPreview = Boolean(preview)
            const inputId = `project-${field}-upload`
            const error = errors[field]
            const title = `Mockup ${index + 1}`

            return (
              <div key={field} className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-text-secondary">{title}</p>
                  <p className="text-xs text-text-muted">PNG, JPG, or GIF up to 2MB.</p>
                </div>

                <div
                  className={[
                    'relative flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-border/55 bg-background/30 p-6 text-center transition',
                    hasPreview ? 'border-border/40 bg-background/40' : 'hover:border-accent/50',
                    error ? 'border-error/60' : '',
                  ].join(' ')}
                >
                  {hasPreview ? (
                    <>
                      <img
                        src={preview ?? ''}
                        alt={`${title} preview`}
                        className="h-48 w-full rounded-2xl object-cover shadow-[0_20px_38px_-30px_rgba(15,17,21,0.85)]"
                      />
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onAssetRemove(field)}
                          className="inline-flex items-center rounded-xl border border-border/60 px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-error/70 hover:text-error"
                        >
                          Remove
                        </button>
                        <label
                          htmlFor={inputId}
                          className="inline-flex cursor-pointer items-center rounded-xl bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/20"
                        >
                          Replace
                        </label>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col items-center gap-2">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
                          </svg>
                        </span>
                        <p className="text-sm font-medium text-text-secondary">Drag & drop or click to upload</p>
                        <p className="text-xs text-text-muted">PNG, JPG, or GIF up to 2MB</p>
                      </div>
                      <label
                        htmlFor={inputId}
                        className="inline-flex cursor-pointer items-center rounded-xl border border-border/60 px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-accent/60 hover:text-accent"
                      >
                        Browse files
                      </label>
                    </>
                  )}
                  <input
                    id={inputId}
                    key={`${field}-${fileInputResetKeys[field]}`}
                    type="file"
                    accept={MEDIA_ACCEPT}
                    className="hidden"
                    onChange={(event) => onAssetChange(field, event.target.files?.[0] ?? null)}
                  />
                </div>

                {error ? <p className="mt-2 text-xs text-error">{error}</p> : null}
              </div>
            )
          })}
        </div>

        <div className="mt-6 space-y-4 rounded-2xl border border-border/45 bg-background/25 p-4">
          <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-text-secondary">
              Brand identity{' '}
              <span className="text-xs font-semibold text-emerald-400">(optional)</span>
            </p>
            <p className="text-xs text-text-muted">
              Curate a quick palette for this project. These colors are for reference only and won’t affect the live site.
            </p>
          </div>
            <span className="hidden rounded-full bg-background/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted sm:inline-flex">
              Visual palette
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-background/60 px-3 py-2">
            <div className="flex items-center gap-2">
              <span
                className="h-7 w-7 rounded-full border border-border/60 shadow-sm"
                style={{ backgroundColor: primaryColor }}
              />
              <span
                className="h-7 w-7 rounded-full border border-border/60 shadow-sm"
                style={{ backgroundColor: secondaryColor }}
              />
              <span
                className="h-7 w-7 rounded-full border border-border/60 shadow-sm"
                style={{ backgroundColor: accentColor }}
              />
            </div>
            <span className="ml-auto text-[11px] uppercase tracking-[0.16em] text-text-muted">
              Live preview
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="group flex flex-col gap-2 rounded-2xl bg-background/60 p-3 shadow-sm ring-0 transition hover:-translate-y-[1px] hover:shadow-md hover:ring-1 hover:ring-accent/30">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-text-secondary">Primary</span>
                <span className="text-[11px] uppercase tracking-wide text-text-muted">{primaryColor}</span>
              </div>
              <button
                type="button"
                onClick={() => primaryColorInputRef.current?.click()}
                className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/80 px-2.5 py-1.5 text-[11px] font-medium text-text-secondary group-hover:border-accent/50"
              >
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="h-5 w-5 rounded-full border border-border/60 shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <span>Pick color</span>
                </span>
                <span className="text-[9px] uppercase tracking-[0.16em] text-text-muted">HEX</span>
              </button>
              <input
                type="color"
                value={primaryColor}
                onChange={(event) => onColorChange('primaryColor', event.target.value)}
                ref={primaryColorInputRef}
                className="h-0 w-0 opacity-0"
              />
            </label>

            <label className="group flex flex-col gap-2 rounded-2xl bg-background/60 p-3 shadow-sm ring-0 transition hover:-translate-y-[1px] hover:shadow-md hover:ring-1 hover:ring-accent/30">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-text-secondary">Secondary</span>
                <span className="text-[11px] uppercase tracking-wide text-text-muted">{secondaryColor}</span>
              </div>
              <button
                type="button"
                onClick={() => secondaryColorInputRef.current?.click()}
                className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/80 px-2.5 py-1.5 text-[11px] font-medium text-text-secondary group-hover:border-accent/50"
              >
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="h-5 w-5 rounded-full border border-border/60 shadow-sm"
                    style={{ backgroundColor: secondaryColor }}
                  />
                  <span>Pick color</span>
                </span>
                <span className="text-[9px] uppercase tracking-[0.16em] text-text-muted">HEX</span>
              </button>
              <input
                type="color"
                value={secondaryColor}
                onChange={(event) => onColorChange('secondaryColor', event.target.value)}
                ref={secondaryColorInputRef}
                className="h-0 w-0 opacity-0"
              />
            </label>

            <label className="group flex flex-col gap-2 rounded-2xl bg-background/60 p-3 shadow-sm ring-0 transition hover:-translate-y-[1px] hover:shadow-md hover:ring-1 hover:ring-accent/30">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-text-secondary">Accent</span>
                <span className="text-[11px] uppercase tracking-wide text-text-muted">{accentColor}</span>
              </div>
              <button
                type="button"
                onClick={() => accentColorInputRef.current?.click()}
                className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/80 px-2.5 py-1.5 text-[11px] font-medium text-text-secondary group-hover:border-accent/50"
              >
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="h-5 w-5 rounded-full border border-border/60 shadow-sm"
                    style={{ backgroundColor: accentColor }}
                  />
                  <span>Pick color</span>
                </span>
                <span className="text-[9px] uppercase tracking-[0.16em] text-text-muted">HEX</span>
              </button>
              <input
                type="color"
                value={accentColor}
                onChange={(event) => onColorChange('accentColor', event.target.value)}
                ref={accentColorInputRef}
                className="h-0 w-0 opacity-0"
              />
            </label>
          </div>
        </div>

        <div className="mt-6 space-y-3 rounded-2xl border border-border/45 bg-background/25 p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-text-secondary">
              Brand information <span className="text-danger">*</span>
            </p>
            <p className="text-xs text-text-muted">
              Capture the core brand story that pairs with these mockups. This content helps keep your portfolio entries consistent.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="brand-badge-name" className="text-xs font-medium text-text-secondary">
                Badge name <span className="text-danger">*</span>
              </label>
              <input
                id="brand-badge-name"
                value={badgeName}
                onChange={(event) => onFieldChange('badgeName', event.target.value)}
                placeholder="e.g. Brand case study"
                className={[
                  'h-10 w-full rounded-2xl border bg-background/40 px-3 text-sm text-text-secondary outline-none transition',
                  'border-border/50 focus:border-accent/60 focus:ring-2 focus:ring-accent/15',
                  errors.badgeName ? 'border-error/60 focus:border-error focus:ring-error/30' : '',
                ].join(' ')}
              />
              {errors.badgeName ? (
                <p className="text-[11px] text-error">{errors.badgeName}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label htmlFor="brand-title" className="text-xs font-medium text-text-secondary">
                Title <span className="text-danger">*</span>
              </label>
              <input
                id="brand-title"
                value={brandTitle}
                onChange={(event) => onFieldChange('brandTitle', event.target.value)}
                placeholder="e.g. Vertex brand identity system"
                className={[
                  'h-10 w-full rounded-2xl border bg-background/40 px-3 text-sm text-text-secondary outline-none transition',
                  'border-border/50 focus:border-accent/60 focus:ring-2 focus:ring-accent/15',
                  errors.brandTitle ? 'border-error/60 focus:border-error focus:ring-error/30' : '',
                ].join(' ')}
              />
              {errors.brandTitle ? (
                <p className="text-[11px] text-error">{errors.brandTitle}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label htmlFor="brand-description" className="text-xs font-medium text-text-secondary">
                Description <span className="text-danger">*</span>
              </label>
              <textarea
                id="brand-description"
                value={brandDescription}
                onChange={(event) => onFieldChange('brandDescription', event.target.value)}
                placeholder="Summarize how this identity expresses the brand and where it’s used."
                rows={3}
                className={[
                  'w-full rounded-2xl border bg-background/40 px-3 py-2 text-sm text-text-secondary outline-none transition',
                  'border-border/50 focus:border-accent/60 focus:ring-2 focus:ring-accent/15',
                  errors.brandDescription
                    ? 'border-error/60 focus:border-error focus:ring-error/30'
                    : '',
                ].join(' ')}
              />
              {errors.brandDescription ? (
                <p className="text-[11px] text-error">{errors.brandDescription}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}

export default Step3
