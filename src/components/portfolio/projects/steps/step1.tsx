import { useMemo, useState, type ChangeEvent, type KeyboardEvent } from 'react'

import {
  MAX_DESCRIPTION_LENGTH,
  MAX_KEYWORDS,
  PROJECT_CATEGORY_OPTIONS,
  type ProjectDetailsFormValues,
  type ProjectKeywordOption,
} from '../types'

type FieldErrorKey = 'title' | 'year' | 'category' | 'shortDescription' | 'thumbnail' | 'keywords'

type ProjectDetailsStepProps = {
  values: ProjectDetailsFormValues
  errors: Partial<Record<FieldErrorKey, string>>
  keywordOptions: ProjectKeywordOption[]
  isKeywordLimitReached: boolean
  fileInputResetKey: number
  onFieldChange: <K extends 'title' | 'year' | 'category' | 'shortDescription'>(
    field: K,
    value: ProjectDetailsFormValues[K],
  ) => void
  onKeywordsToggle: (keyword: string) => void
  onThumbnailChange: (file: File | null) => void
  onThumbnailRemove: () => void
}

const Step1 = ({
  values,
  errors,
  keywordOptions,
  isKeywordLimitReached,
  fileInputResetKey,
  onFieldChange,
  onKeywordsToggle,
  onThumbnailChange,
  onThumbnailRemove,
}: ProjectDetailsStepProps) => {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 15 }, (_, index) => String(currentYear - index))
  const [keywordSearch, setKeywordSearch] = useState('')
  const descriptionLength = values.shortDescription.trim().length

  const selectedKeywordOptions = useMemo(() => {
    return values.keywords.map((value) => {
      const match = keywordOptions.find((option) => option.value === value)
      return match ?? { value, label: value }
    })
  }, [keywordOptions, values.keywords])

  const filteredKeywordOptions = useMemo(() => {
    const term = keywordSearch.trim().toLowerCase()

    return keywordOptions.filter((option) => {
      if (values.keywords.includes(option.value)) {
        return false
      }

      if (!term) {
        return true
      }

      return (
        option.label.toLowerCase().includes(term) ||
        option.value.toLowerCase().includes(term)
      )
    })
  }, [keywordOptions, keywordSearch, values.keywords])

  const handleThumbnailInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    onThumbnailChange(file)
  }

  const handleKeywordInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()

    if (isKeywordLimitReached || !filteredKeywordOptions.length) {
      return
    }

    const firstOption = filteredKeywordOptions[0]
    onKeywordsToggle(firstOption.value)
    setKeywordSearch('')
  }

  const handleSelectKeyword = (value: string) => {
    if (isKeywordLimitReached) {
      return
    }
    onKeywordsToggle(value)
    setKeywordSearch('')
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="space-y-0.5">
        <h3 className="text-lg font-semibold text-text-secondary">Project details</h3>
        <p className="text-sm text-text-muted">
          Title, category, short description, thumbnail, and keywords for this project.
        </p>
      </div>

      <div className="space-y-8">
        {/* Row 1: Title, Category, Year */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="project-title" className="text-sm font-medium text-text-secondary">
              Title <span className="text-danger">*</span>
            </label>
            <input
              id="project-title"
              value={values.title}
              onChange={(event) => onFieldChange('title', event.target.value)}
              placeholder="e.g. Horizon Rebrand Campaign"
              maxLength={120}
              className={[
                'h-12 w-full rounded-2xl bg-background/40 px-4 text-sm text-text-secondary shadow-sm outline-none transition dark:bg-slate-900 dark:text-slate-100',
                errors.title
                  ? 'border border-danger/60 focus:border-danger focus:ring-2 focus:ring-danger/30'
                  : 'border border-border/50 focus:border-accent/60 focus:ring-2 focus:ring-accent/15',
              ].join(' ')}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="project-category" className="text-sm font-medium text-text-secondary">
              Category <span className="text-danger">*</span>
            </label>
            <select
              id="project-category"
              value={values.category}
              onChange={(event) =>
                onFieldChange('category', event.target.value as ProjectDetailsFormValues['category'])
              }
              className={[
                'h-12 w-full appearance-none rounded-2xl bg-background/40 px-4 text-sm text-text-secondary shadow-sm outline-none transition dark:bg-slate-900 dark:text-slate-100',
                errors.category
                  ? 'border border-danger/60 focus:border-danger focus:ring-2 focus:ring-danger/30'
                  : 'border border-border/50 focus:border-accent/60 focus:ring-2 focus:ring-accent/15',
              ].join(' ')}
            >
              <option value="">Select a category</option>
              {PROJECT_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="project-year" className="text-sm font-medium text-text-secondary">
              Year <span className="text-danger">*</span>
            </label>
            <select
              id="project-year"
              value={values.year}
              onChange={(event) => onFieldChange('year', event.target.value)}
              className={[
                'h-12 w-full rounded-2xl bg-background/40 px-4 text-sm text-text-secondary shadow-sm outline-none transition dark:bg-slate-900 dark:text-slate-100',
                errors.year
                  ? 'border border-danger/60 focus:border-danger focus:ring-2 focus:ring-danger/30'
                  : 'border border-border/50 focus:border-accent/60 focus:ring-2 focus:ring-accent/15',
              ].join(' ')}
            >
              <option value="">Select year</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Short description, Keywords */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="project-short-description"
              className="text-sm font-medium text-text-secondary"
            >
              Short description <span className="text-danger">*</span>
            </label>
            <textarea
              id="project-short-description"
              value={values.shortDescription}
              onChange={(event) =>
                onFieldChange(
                  'shortDescription',
                  event.target.value.slice(0, MAX_DESCRIPTION_LENGTH),
                )
              }
              placeholder="Summarize the impact, scope, or outcome in a few concise sentences."
              rows={15}
              maxLength={MAX_DESCRIPTION_LENGTH}
              className={[
                'w-full rounded-2xl bg-background/40 px-4 py-3 text-sm text-text-secondary shadow-sm outline-none transition dark:bg-slate-900 dark:text-slate-100',
                errors.shortDescription
                  ? 'border border-danger/60 focus:border-danger focus:ring-2 focus:ring-danger/30'
                  : 'border border-border/50 focus:border-accent/60 focus:ring-2 focus:ring-accent/15',
              ].join(' ')}
            />
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span />
              <p>
                {descriptionLength}/{MAX_DESCRIPTION_LENGTH}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-text-secondary">
                Keywords <span className="text-error">*</span>
              </p>
              <p className="text-xs text-text-muted">
                Choose up to {MAX_KEYWORDS} tags to improve search and filtering. These display as
                pills on hover cards.
              </p>
            </div>

            <div className="space-y-3">
              <div
                className={[
                  'flex flex-wrap gap-2 rounded-2xl border bg-background/25 px-4 py-3',
                  errors.keywords ? 'border-danger/60' : 'border-border/45',
                ].join(' ')}
              >
                {selectedKeywordOptions.length ? (
                  selectedKeywordOptions.map((keyword) => (
                    <span
                      key={keyword.value}
                      className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent"
                    >
                      {keyword.label}
                      <button
                        type="button"
                        onClick={() => onKeywordsToggle(keyword.value)}
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent/70 text-white transition hover:bg-accent/90"
                        aria-label={`Remove ${keyword.label}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 8 8M6 14l8-8" />
                        </svg>
                      </button>
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-text-muted">No keywords selected yet.</p>
                )}
              </div>

              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <circle cx="11" cy="11" r="7" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m20 20-2-2" />
                </svg>
                <input
                  type="search"
                  value={keywordSearch}
                  onChange={(event) => setKeywordSearch(event.target.value)}
                  onKeyDown={handleKeywordInputKeyDown}
                  placeholder="Search keywords"
                  className={[
                    'h-11 w-full rounded-2xl bg-background/35 pl-11 pr-4 text-sm text-text-secondary outline-none transition dark:bg-slate-900 dark:text-slate-100',
                    errors.keywords
                      ? 'border border-danger/60 focus:border-danger focus:ring-2 focus:ring-danger/30'
                      : 'border border-border/50 focus:border-accent/60 focus:ring-2 focus:ring-accent/15',
                  ].join(' ')}
                />
              </div>

              <div className="no-scrollbar max-h-52 overflow-y-auto rounded-2xl border border-border/45 bg-background/25 dark:border-slate-700 dark:bg-slate-900/70">
                {filteredKeywordOptions.length ? (
                  <ul className="divide-y divide-border/40">
                    {filteredKeywordOptions.map((keyword) => (
                      <li key={keyword.value}>
                        <button
                          type="button"
                          onClick={() => handleSelectKeyword(keyword.value)}
                          disabled={isKeywordLimitReached}
                          className={[
                            'flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition',
                            'hover:bg-accent/10',
                            isKeywordLimitReached ? 'cursor-not-allowed opacity-60' : '',
                          ].join(' ')}
                        >
                          <span className="text-text-secondary">{keyword.label}</span>
                          <span className="text-xs uppercase tracking-wide text-text-muted">
                            {keyword.value}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-6 text-center text-xs text-text-muted">
                    No keywords match “{keywordSearch.trim() || '…'}”.
                  </div>
                )}
              </div>

              {isKeywordLimitReached ? (
                <p className="text-xs text-text-muted">
                  You’ve reached the limit of {MAX_KEYWORDS} keywords for this project.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Row 3: Thumbnail */}
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-secondary">
              Thumbnail image <span className="text-danger">*</span>
            </p>
            <p className="text-xs text-text-muted">
              Upload a 2MB JPG or PNG. This preview appears in the portfolio grid.
            </p>
          </div>
          <div
            className={[
              'relative flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed bg-background/30 p-6 text-center transition dark:bg-slate-900/70',
              values.thumbnailPreview ? 'bg-background/40 dark:bg-slate-900' : '',
              errors.thumbnail
                ? 'border-danger/60 dark:border-danger/60'
                : 'border-border/50 hover:border-accent/50 dark:border-slate-700',
            ].join(' ')}
          >
            {values.thumbnailPreview ? (
              <>
                <img
                  src={values.thumbnailPreview}
                  alt="Project thumbnail preview"
                  className="h-40 w-full max-w-xs rounded-2xl object-cover shadow-[0_16px_28px_-24px_rgba(15,17,21,0.65)]"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onThumbnailRemove}
                    className="inline-flex items-center rounded-xl border border-border/60 px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-error/70 hover:text-error"
                  >
                    Remove
                  </button>
                  <label
                    htmlFor="project-thumbnail"
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5 9 10l4 4 5-5 3 3"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 12 3 17.25a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 17.25V6.75A2.25 2.25 0 0 0 18.75 4.5H12"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 12 9 9.75 11.25 12"
                      />
                    </svg>
                  </span>
                  <p className="text-sm font-medium text-text-secondary">
                    Drag & drop or click to upload
                  </p>
                  <p className="text-xs text-text-muted">PNG or JPG up to 2MB</p>
                </div>
                <label
                  htmlFor="project-thumbnail"
                  className="inline-flex cursor-pointer items-center rounded-xl border border-border/60 px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-accent/60 hover:text-accent"
                >
                  Browse files
                </label>
              </>
            )}
            <input
              id="project-thumbnail"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              key={fileInputResetKey}
              className="hidden"
              onChange={handleThumbnailInput}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Step1
