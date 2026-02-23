import { useCallback, type ChangeEvent } from 'react'
import { MEDIA_UPLOAD_MIME_TYPES, type ProjectDetailsFormValues } from '../types'

const MEDIA_ACCEPT = MEDIA_UPLOAD_MIME_TYPES.join(',')

type TestimonialFooterStepProps = {
  values: ProjectDetailsFormValues
  onFieldChange: <
    K extends 'testimonialFeedback' | 'testimonialClientName' | 'testimonialDesignation',
  >(field: K, value: ProjectDetailsFormValues[K]) => void
  onFooterMockupChange: (preview: string | null) => void
}

const Step5 = ({ values, onFieldChange, onFooterMockupChange }: TestimonialFooterStepProps) => {
  const { testimonialFeedback, testimonialClientName, testimonialDesignation, footerMockupPreview } =
    values

  const handleFooterMockupChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) {
        onFooterMockupChange(null)
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        onFooterMockupChange(typeof reader.result === 'string' ? reader.result : null)
      }
      reader.readAsDataURL(file)
    },
    [onFooterMockupChange],
  )

  return (
    <div className="space-y-6 pb-16">
      <div className="space-y-0.5">
        <h3 className="text-lg font-semibold text-text-secondary">Testimonials & footer mockup</h3>
        <p className="text-sm text-text-muted">
          Capture client feedback and a footer brand strip to round out this case study.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-border/45 bg-background/25 p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-muted">Testimonial</p>
          <p className="text-[11px] text-text-muted">
            Short feedback from your client that highlights impact, collaboration, or outcomes.
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="testimonial-feedback" className="text-xs font-medium text-text-secondary">
              Feedback
            </label>
            <textarea
              id="testimonial-feedback"
              value={testimonialFeedback}
              onChange={(event) => onFieldChange('testimonialFeedback', event.target.value)}
              placeholder="“Seven Design helped us launch a cohesive brand system that lifted conversions and internal confidence.”"
              rows={3}
              className="w-full rounded-2xl border border-border/50 bg-background/40 px-3 py-2 text-sm text-text-secondary outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/15"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="testimonial-client-name" className="text-xs font-medium text-text-secondary">
                Client name
              </label>
              <input
                id="testimonial-client-name"
                value={testimonialClientName}
                onChange={(event) => onFieldChange('testimonialClientName', event.target.value)}
                placeholder="e.g. Priya Menon"
                className="h-10 w-full rounded-2xl border border-border/50 bg-background/40 px-3 text-sm text-text-secondary outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/15"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="testimonial-designation" className="text-xs font-medium text-text-secondary">
                Designation
              </label>
              <input
                id="testimonial-designation"
                value={testimonialDesignation}
                onChange={(event) => onFieldChange('testimonialDesignation', event.target.value)}
                placeholder="e.g. VP of Marketing, Lumen Health"
                className="h-10 w-full rounded-2xl border border-border/50 bg-background/40 px-3 text-sm text-text-secondary outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/15"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-border/45 bg-background/25 p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-muted">Footer brand mockup</p>
          <p className="text-[11px] text-text-muted">
            Add a thin footer strip or brand bar used across the case study (logos, partner marks, or brand lockups).
          </p>
        </div>

        <div
          className={[
            'relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border/55 bg-background/30 p-4 text-center transition',
            footerMockupPreview ? 'border-border/40 bg-background/40' : 'hover:border-accent/50',
          ].join(' ')}
        >
          {footerMockupPreview ? (
            <>
              <img
                src={footerMockupPreview}
                alt="Footer brand mockup preview"
                className="h-20 w-full rounded-xl object-cover shadow-[0_16px_30px_-26px_rgba(15,17,21,0.85)]"
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onFooterMockupChange(null)}
                  className="inline-flex items-center rounded-xl border border-border/60 px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-error/70 hover:text-error"
                >
                  Remove
                </button>
                <label
                  htmlFor="footer-mockup-upload"
                  className="inline-flex cursor-pointer items-center rounded-xl bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/20"
                >
                  Replace
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5h16M4 12h16M4 7.5h10" />
                  </svg>
                </span>
                <p className="text-sm font-medium text-text-secondary">Upload a footer brand strip</p>
                <p className="text-xs text-text-muted">PNG or JPG up to 2MB, ideally wide and short.</p>
              </div>
              <label
                htmlFor="footer-mockup-upload"
                className="inline-flex cursor-pointer items-center rounded-xl border border-border/60 px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-accent/60 hover:text-accent"
              >
                Browse files
              </label>
            </>
          )}
          <input
            id="footer-mockup-upload"
            type="file"
            accept={MEDIA_ACCEPT}
            className="hidden"
            onChange={handleFooterMockupChange}
          />
        </div>
      </div>
    </div>
  )
}

export default Step5
