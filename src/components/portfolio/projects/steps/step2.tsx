import { MAX_OVERVIEW_LENGTH, type ProjectDetailsFormValues } from '../types'

type OverviewFieldKey = 'overviewDescription' | 'scopeOfWork' | 'industries'

type ProjectOverviewStepProps = {
  values: ProjectDetailsFormValues
  errors: Partial<Record<OverviewFieldKey, string>>
  onFieldChange: <K extends OverviewFieldKey>(field: K, value: ProjectDetailsFormValues[K]) => void
}

const Step2 = ({ values, errors, onFieldChange }: ProjectOverviewStepProps) => {
  const overviewLength = values.overviewDescription.trim().length

  return (
    <div className="pb-24">
      <div className="space-y-0.5">
        <h3 className="text-lg font-semibold text-text-secondary">Project overview</h3>
        <p className="text-sm text-text-muted">
          Longer-form overview copy, scope of work, and key industries for this project.
        </p>
      </div>

      <div className="mt-6 w-full space-y-5 rounded-2xl border border-border/45 bg-background/25 p-5 sm:p-6">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-text-secondary">Project overview</p>
          <p className="text-xs text-text-muted">
            Summarize the objectives, approach, or transformation in a few short paragraphs and note where the work shows up.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="project-overview-description"
              className="text-sm font-medium text-text-secondary"
            >
              Overview description <span className="text-danger">*</span>
            </label>
            <textarea
              id="project-overview-description"
              value={values.overviewDescription}
              onChange={(event) =>
                onFieldChange('overviewDescription', event.target.value.slice(0, MAX_OVERVIEW_LENGTH))
              }
              placeholder="Summarize the objectives, approach, or transformation in up to two short paragraphs."
              rows={4}
              maxLength={MAX_OVERVIEW_LENGTH}
              className={[
                'w-full rounded-2xl border border-border/50 bg-background/40 px-4 py-3 text-sm text-text-secondary shadow-sm outline-none transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
                'focus:border-accent/60 focus:ring-2 focus:ring-accent/15',
                errors.overviewDescription ? 'border-error/60 focus:border-error focus:ring-error/30' : '',
              ].join(' ')}
            />
            <div className="flex items-center justify-between text-xs text-text-muted">
              {errors.overviewDescription ? <p className="text-error">{errors.overviewDescription}</p> : <span />}
              <p>
                {overviewLength}/{MAX_OVERVIEW_LENGTH}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="project-scope"
                className="text-sm font-medium text-text-secondary"
              >
                Scope of work <span className="text-danger">*</span>
              </label>
              <input
                id="project-scope"
                value={values.scopeOfWork}
                onChange={(event) => onFieldChange('scopeOfWork', event.target.value)}
                placeholder="e.g. Brand identity, landing page, launch video"
                className={[
                  'h-12 w-full rounded-2xl border border-border/50 bg-background/40 px-4 text-sm text-text-secondary shadow-sm outline-none transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
                  'focus:border-accent/60 focus:ring-2 focus:ring-accent/15',
                  errors.scopeOfWork ? 'border-error/60 focus:border-error focus:ring-error/30' : '',
                ].join(' ')}
              />
              {errors.scopeOfWork ? <p className="text-xs text-error">{errors.scopeOfWork}</p> : null}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="project-industries"
                className="text-sm font-medium text-text-secondary"
              >
                Industries <span className="text-danger">*</span>
              </label>
              <input
                id="project-industries"
                value={values.industries}
                onChange={(event) => onFieldChange('industries', event.target.value)}
                placeholder="e.g. Renewable energy, SaaS, healthtech"
                className={[
                  'h-12 w-full rounded-2xl border border-border/50 bg-background/40 px-4 text-sm text-text-secondary shadow-sm outline-none transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
                  'focus:border-accent/60 focus:ring-2 focus:ring-accent/15',
                  errors.industries ? 'border-error/60 focus:border-error focus:ring-error/30' : '',
                ].join(' ')}
              />
              {errors.industries ? <p className="text-xs text-error">{errors.industries}</p> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Step2
