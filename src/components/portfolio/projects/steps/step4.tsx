import { useCallback, type ChangeEvent } from 'react'
import { MEDIA_UPLOAD_MIME_TYPES, type ProjectDetailsFormValues } from '../types'

const MEDIA_ACCEPT = MEDIA_UPLOAD_MIME_TYPES.join(',')

type MockupUploadsStepProps = {
  values: ProjectDetailsFormValues
  onLandscapeMockupChange: (preview: string | null) => void
  onWebsiteMockupChange: (preview: string | null) => void
  onWebsiteFieldChange: (
    field: 'websiteUrl' | 'websiteTitle' | 'websiteDescription',
    value: string,
  ) => void
  onWebsiteVisibilityToggle: () => void
  errors: {
    landscapeMockup?: string
    websiteMockup?: string
    websiteUrl?: string
    websiteTitle?: string
    websiteDescription?: string
  }
}

const Step4 = ({
  values,
  onLandscapeMockupChange,
  onWebsiteMockupChange,
  onWebsiteFieldChange,
  onWebsiteVisibilityToggle,
  errors,
}: MockupUploadsStepProps) => {
  const landscapeMockupPreview = values.landscapeMockupPreview
  const websiteMockupPreview = values.websiteMockupPreview
  const websiteUrl = values.websiteUrl
  const websiteTitle = values.websiteTitle
  const websiteDescription = values.websiteDescription
  const isWebsiteEnabled = values.isWebsiteEnabled

  const handleLocalMockupChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>, setPreview: (value: string | null) => void) => {
      const file = event.target.files?.[0]
      if (!file) {
        setPreview(null)
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        setPreview(typeof reader.result === 'string' ? reader.result : null)
      }
      reader.readAsDataURL(file)
    },
    [],
  )

  return (
    <div className="space-y-5 pb-16">
      <div className="space-y-0.5">
        <h3 className="text-lg font-semibold text-text-secondary">Mockup uploads</h3>
        <p className="text-sm text-text-muted">
          Add extended visuals and website context that support this case study.
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-border/45 bg-background/25 p-3.5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-muted">
          Landscape mockup <span className="text-danger">*</span>
        </p>
        <div
          className={[
            'relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed bg-background/30 p-4 text-center transition',
            landscapeMockupPreview ? 'border-border/40 bg-background/40' : 'border-border/55 hover:border-accent/50',
            errors.landscapeMockup ? 'border-error/60' : '',
          ].join(' ')}
        >
          {landscapeMockupPreview ? (
            <>
              <img
                src={landscapeMockupPreview}
                alt="Landscape mockup preview"
                className="h-32 w-full rounded-2xl object-cover shadow-[0_18px_32px_-28px_rgba(15,17,21,0.85)]"
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onLandscapeMockupChange(null)}
                  className="inline-flex items-center rounded-xl border border-border/60 px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-error/70 hover:text-error"
                >
                  Remove
                </button>
                <label
                  htmlFor="landscape-mockup-upload"
                  className="inline-flex cursor-pointer items-center rounded-xl bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/20"
                >
                  Replace
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5 9 10l4 4 5-5 3 3" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12 3 17.25A2.25 2.25 0 0 0 5.25 19.5h13.5A2.25 2.25 0 0 0 21 17.25V6.75A2.25 2.25 0 0 0 18.75 4.5H12" />
                  </svg>
                </span>
                <p className="text-sm font-medium text-text-secondary">Drag & drop or click to upload</p>
                <p className="text-xs text-text-muted">Ideal for wide hero or presentation frames.</p>
              </div>
              <label
                htmlFor="landscape-mockup-upload"
                className="inline-flex cursor-pointer items-center rounded-xl border border-border/60 px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-accent/60 hover:text-accent"
              >
                Browse files
              </label>
            </>
          )}
          <input
            id="landscape-mockup-upload"
            type="file"
            accept={MEDIA_ACCEPT}
            className="hidden"
            onChange={(event) =>
              handleLocalMockupChange(event, (preview) => onLandscapeMockupChange(preview))
            }
          />
        </div>
        {errors.landscapeMockup ? (
          <p className="text-xs text-error">{errors.landscapeMockup}</p>
        ) : null}
      </div>

      <div className="space-y-3 rounded-2xl border border-border/45 bg-background/25 p-3.5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-muted">
          Website mockup <span className="text-danger">*</span>
        </p>
        <div
          className={[
            'relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed bg-background/30 p-4 text-center transition',
            websiteMockupPreview ? 'border-border/40 bg-background/40' : 'border-border/55 hover:border-accent/50',
            errors.websiteMockup ? 'border-error/60' : '',
          ].join(' ')}
        >
          {websiteMockupPreview ? (
            <>
              <img
                src={websiteMockupPreview}
                alt="Website mockup preview"
                className="h-32 w-full rounded-2xl object-cover shadow-[0_18px_32px_-28px_rgba(15,17,21,0.85)]"
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onWebsiteMockupChange(null)}
                  className="inline-flex items-center rounded-xl border border-border/60 px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-error/70 hover:text-error"
                >
                  Remove
                </button>
                <label
                  htmlFor="website-mockup-upload"
                  className="inline-flex cursor-pointer items-center rounded-xl bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/20"
                >
                  Replace
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5h16.5v15H3.75z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5" />
                  </svg>
                </span>
                <p className="text-sm font-medium text-text-secondary">Upload a website frame</p>
                <p className="text-xs text-text-muted">Show the live experience or key page layout.</p>
              </div>
              <label
                htmlFor="website-mockup-upload"
                className="inline-flex cursor-pointer items-center rounded-xl border border-border/60 px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-accent/60 hover:text-accent"
              >
                Browse files
              </label>
            </>
          )}
          <input
            id="website-mockup-upload"
            type="file"
            accept={MEDIA_ACCEPT}
            className="hidden"
            onChange={(event) =>
              handleLocalMockupChange(event, (preview) => onWebsiteMockupChange(preview))
            }
          />
        </div>
        {errors.websiteMockup ? (
          <p className="text-xs text-error">{errors.websiteMockup}</p>
        ) : null}
      </div>

      <div className="space-y-3 rounded-2xl border border-border/45 bg-background/25 p-3.5">
        <div className="mt-0.5 grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
          <div className="space-y-2.5">
            <div className="space-y-1">
              <label htmlFor="website-url" className="text-xs font-medium text-text-secondary">
                Live site URL <span className="text-danger">*</span>
              </label>
              <input
                id="website-url"
                type="url"
                value={websiteUrl}
                onChange={(event) => onWebsiteFieldChange('websiteUrl', event.target.value)}
                placeholder="https://example.com"
                className={[
                  'h-10 w-full rounded-2xl border bg-background/40 px-3 text-sm text-text-secondary outline-none transition',
                  'border-border/50 focus:border-accent/60 focus:ring-2 focus:ring-accent/15',
                  errors.websiteUrl ? 'border-error/60 focus:border-error focus:ring-error/30' : '',
                ].join(' ')}
              />
              {errors.websiteUrl ? (
                <p className="text-[11px] text-error">{errors.websiteUrl}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label htmlFor="website-title" className="text-xs font-medium text-text-secondary">
                Website title <span className="text-danger">*</span>
              </label>
              <input
                id="website-title"
                value={websiteTitle}
                onChange={(event) => onWebsiteFieldChange('websiteTitle', event.target.value)}
                placeholder="e.g. Lumen Health portal"
                className={[
                  'h-10 w-full rounded-2xl border bg-background/40 px-3 text-sm text-text-secondary outline-none transition',
                  'border-border/50 focus:border-accent/60 focus:ring-2 focus:ring-accent/15',
                  errors.websiteTitle ? 'border-error/60 focus:border-error focus:ring-error/30' : '',
                ].join(' ')}
              />
              {errors.websiteTitle ? (
                <p className="text-[11px] text-error">{errors.websiteTitle}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="website-description"
                className="text-xs font-medium text-text-secondary"
              >
                Website description <span className="text-danger">*</span>
              </label>
              <textarea
                id="website-description"
                value={websiteDescription}
                onChange={(event) => onWebsiteFieldChange('websiteDescription', event.target.value)}
                placeholder="Describe the live experience, key flows, or KPIs for this site."
                rows={2}
                className={[
                  'w-full rounded-2xl border bg-background/40 px-3 py-2 text-sm text-text-secondary outline-none transition',
                  'border-border/50 focus:border-accent/60 focus:ring-2 focus:ring-accent/15',
                  errors.websiteDescription
                    ? 'border-error/60 focus:border-error focus:ring-error/30'
                    : '',
                ].join(' ')}
              />
              {errors.websiteDescription ? (
                <p className="text-[11px] text-error">{errors.websiteDescription}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col justify-between gap-2.5 rounded-2xl bg-background/40 p-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-text-secondary">Website visibility</p>
              <p className="text-[11px] text-text-muted">
                Control whether this live site appears as a primary link on the project card.
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-xl bg-background/60 px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6H6.75A2.25 2.25 0 0 0 4.5 8.25v9A2.25 2.25 0 0 0 6.75 19.5h9A2.25 2.25 0 0 0 18 17.25V13.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 4.5H19.5V9.75" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 14.25 19.5 4.5" />
                  </svg>
                </span>
                <p className="truncate text-[11px] text-text-secondary">
                  {websiteUrl.trim() ? websiteUrl.trim() : 'No live URL added yet'}
                </p>
              </div>
              {websiteUrl.trim() ? (
                <span className="hidden rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent sm:inline-flex">
                  Live preview
                </span>
              ) : null}
            </div>
            {websiteUrl.trim() && isWebsiteEnabled ? (
              <div className="mt-2 overflow-hidden rounded-xl border border-border/60 bg-background/60">
                <iframe
                  src={websiteUrl}
                  title="Live site preview"
                  loading="lazy"
                  className="h-32 w-full border-0"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                />
              </div>
            ) : null}
            <button
              type="button"
              onClick={onWebsiteVisibilityToggle}
              className="inline-flex items-center justify-between rounded-2xl bg-background px-3 py-2 text-[11px] font-medium text-text-secondary ring-1 ring-border/60 transition hover:ring-accent/40"
            >
              <span className="flex flex-col gap-0.5 text-left">
                <span>{isWebsiteEnabled ? 'Visible on project card' : 'Hidden from project card'}</span>
                <span className="text-[10px] text-text-muted">
                  {isWebsiteEnabled ? 'Users can click through to the live site.' : 'Link kept for internal reference only.'}
                </span>
              </span>
              <span
                className={[
                  'relative inline-flex h-6 w-11 items-center rounded-full border text-[10px] font-semibold transition-colors',
                  isWebsiteEnabled
                    ? 'border-emerald-500 bg-emerald-500/90 text-white'
                    : 'border-border bg-background text-text-muted',
                ].join(' ')}
                aria-hidden="true"
              >
                <span
                  className={[
                    'absolute h-5 w-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform',
                    isWebsiteEnabled ? 'translate-x-[22px]' : 'translate-x-0.5',
                  ].join(' ')}
                />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Step4
