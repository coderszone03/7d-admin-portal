import { useEffect, useMemo, useRef, useState } from 'react'
import type { BlogPost } from '../../components/blog/types'
import BlogPostFormModal from '../../components/blog/BlogPostFormModal'
import Modal from '../../components/common/Modal'
import {
  createBlogPost,
  deleteBlogPost,
  fetchBlogCategories,
  fetchBlogPosts,
  updateBlogPost,
  type BlogCategory,
} from '../../lib/api/blog'

const secondaryButtonClasses =
  'inline-flex h-10 items-center justify-center rounded-lg border border-border/60 px-4 text-sm font-semibold text-text-secondary transition hover:border-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-60'

const dangerButtonClasses =
  'inline-flex h-10 items-center justify-center rounded-lg bg-error px-4 text-sm font-semibold text-white transition hover:bg-error/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error/50 disabled:cursor-not-allowed disabled:opacity-60'

const BlogPostsPage = () => {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [activePostId, setActivePostId] = useState<string | null>(null)
  const [isFormOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [postBeingEdited, setPostBeingEdited] = useState<BlogPost | null>(null)
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(6)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [popularFilter, setPopularFilter] = useState<'all' | 'popular'>('all')
  const [togglingPopularId, setTogglingPopularId] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearchTerm(searchInput.trim())
      setPage(1)
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

  useEffect(() => {
    let isMounted = true

    const loadCategories = async () => {
      try {
        const data = await fetchBlogCategories()
        if (!isMounted) return
        setCategories(data)
      } catch {
        if (!isMounted) return
        setCategories([])
      }
    }

    loadCategories()

    return () => {
      isMounted = false
    }
  }, [])

  const loadPosts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { items, total } = await fetchBlogPosts({
        page,
        pageSize,
        categoryId: selectedCategoryId === 'all' ? null : selectedCategoryId,
        search: searchTerm || undefined,
      })
      setPosts(items)
      setTotalCount(total)
      setActivePostId((previous) => {
        if (previous && items.some((item) => item.id === previous)) {
          return previous
        }
        return items[0]?.id ?? null
      })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load blog posts.')
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
        const { items, total } = await fetchBlogPosts({
          page,
          pageSize,
          categoryId: selectedCategoryId === 'all' ? null : selectedCategoryId,
          search: searchTerm || undefined,
        })
        if (!isMounted) return
        setPosts(items)
        setTotalCount(total)
        setActivePostId((previous) => {
          if (previous && items.some((item) => item.id === previous)) {
            return previous
          }
          return items[0]?.id ?? null
        })
      } catch (loadError) {
        if (!isMounted) return
        setError(loadError instanceof Error ? loadError.message : 'Unable to load blog posts.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    })()
    return () => {
      isMounted = false
    }
  }, [page, pageSize, selectedCategoryId, searchTerm])

  const visiblePosts = useMemo(
    () =>
      popularFilter === 'popular'
        ? posts.filter((p) => p.isPopular)
        : posts.filter((p) => !p.isPopular),
    [posts, popularFilter],
  )

  const activePost = useMemo(
    () =>
      visiblePosts.find((post) => post.id === activePostId) ??
      visiblePosts[0] ??
      null,
    [activePostId, visiblePosts],
  )

  const handleOpenCreate = () => {
    setFormMode('create')
    setPostBeingEdited(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (post: BlogPost) => {
    setFormMode('edit')
    setPostBeingEdited(post)
    setFormOpen(true)
  }

  const handleCloseForm = () => {
    setFormOpen(false)
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

  const handleSubmitPost = async (post: BlogPost) => {
    setError(null)
    setStatusMessage(null)
    if (formMode === 'edit' && postBeingEdited) {
      await updateBlogPost(postBeingEdited.id, post)
      setStatusMessage(`Updated "${post.title}" successfully.`)
    } else {
      await createBlogPost(post)
      setStatusMessage(`Added "${post.title}" successfully.`)
      setPage(1)
    }
    await loadPosts()
  }

  const handleTogglePopular = async (post: BlogPost) => {
    const next = !post.isPopular
    // Optimistic update so the pill flips immediately.
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, isPopular: next } : p)),
    )
    setTogglingPopularId(post.id)
    setError(null)
    setStatusMessage(null)
    try {
      await updateBlogPost(post.id, { ...post, isPopular: next })
      setStatusMessage(
        next
          ? `Marked "${post.title}" as popular.`
          : `Removed "${post.title}" from popular.`,
      )
    } catch (err) {
      // Roll back on failure.
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, isPopular: post.isPopular } : p)),
      )
      setError(extractApiError(err, 'Could not update popular status. Please try again.'))
    } finally {
      setTogglingPopularId(null)
    }
  }

  const handleRequestDelete = (post: BlogPost) => {
    setDeleteError(null)
    setDeleteTarget(post)
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
      await deleteBlogPost(deleteTarget.id)
      setStatusMessage(`Removed "${deleteTarget.title}".`)
      setDeleteTarget(null)
      await loadPosts()
    } catch (err) {
      setDeleteError(extractApiError(err, 'Could not delete the post. Please try again.'))
    } finally {
      setIsDeleting(false)
    }
  }

  const contentsHeadings = (activePost?.sections ?? []).filter(
    (block) => block.type === 'heading' && block.heading && block.heading.trim(),
  )

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((totalCount || posts.length || 1) / pageSize)),
    [pageSize, posts.length, totalCount],
  )

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    setPage(1)
  }

  const handlePageChange = (direction: -1 | 1) => {
    setPage((current) => {
      const next = current + direction
      if (next < 1) return 1
      if (next > totalPages) return totalPages
      return next
    })
  }

  const goToPage = (targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages) return
    setPage(targetPage)
  }

  const pageNumbers = useMemo<Array<number | 'ellipsis'>>(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const result: Array<number | 'ellipsis'> = [1]
    if (page > 3) result.push('ellipsis')
    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)
    for (let i = start; i <= end; i += 1) result.push(i)
    if (page < totalPages - 2) result.push('ellipsis')
    result.push(totalPages)
    return result
  }, [page, totalPages])

  const formatShortDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(
        new Date(iso),
      )
    } catch {
      return '—'
    }
  }

  const placeholderThumb = (title: string) => {
    const initial = (title || 'B').trim().charAt(0).toUpperCase()
    return initial
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-surface p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.25em] text-text-muted">Blog</p>
          <h1 className="text-2xl font-semibold text-text-secondary">Posts</h1>
          <p className="max-w-2xl text-sm text-text-muted">
            Create case-study style articles with cover images, structured headings, and rich content blocks.
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
          Add post
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2.2fr)]">
        <div className="space-y-4 rounded-3xl border border-border/60 bg-surface/80 p-5">
          {/* Search */}
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
              placeholder="Search posts by title…"
              className="h-10 w-full rounded-xl border border-border/60 bg-background pl-9 pr-9 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
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

          {/* Popular filter toggle */}
          <div
            role="tablist"
            aria-label="Filter posts"
            className="inline-flex items-center gap-1 rounded-2xl border border-border/60 bg-surface p-1"
          >
            <button
              role="tab"
              type="button"
              aria-selected={popularFilter === 'all'}
              onClick={() => setPopularFilter('all')}
              className={`inline-flex h-8 items-center gap-1.5 rounded-xl px-3 text-[11px] font-semibold transition ${
                popularFilter === 'all'
                  ? 'bg-accent text-white shadow-[0_8px_18px_-12px_rgba(99,102,241,0.7)]'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Standard
            </button>
            <button
              role="tab"
              type="button"
              aria-selected={popularFilter === 'popular'}
              onClick={() => setPopularFilter('popular')}
              className={`inline-flex h-8 items-center gap-1.5 rounded-xl px-3 text-[11px] font-semibold transition ${
                popularFilter === 'popular'
                  ? 'bg-accent text-white shadow-[0_8px_18px_-12px_rgba(99,102,241,0.7)]'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-3 w-3"
              >
                <path d="M12 2l2.4 6.6H21l-5.3 3.85L17.8 19 12 15.1 6.2 19l2.1-6.55L3 8.6h6.6z" />
              </svg>
              Popular
            </button>
          </div>

          {/* Category chips + total count */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                Categories
              </span>
              <span className="text-[11px] text-text-muted">
                {totalCount} {totalCount === 1 ? 'post' : 'posts'}
              </span>
            </div>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => handleSelectCategory('all')}
                className={[
                  'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                  selectedCategoryId === 'all'
                    ? 'border-accent/70 bg-accent/10 text-accent'
                    : 'border-border/60 bg-surface text-text-secondary hover:border-accent/60 hover:text-accent',
                ].join(' ')}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleSelectCategory(category.id)}
                  className={[
                    'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                    selectedCategoryId === category.id
                      ? 'border-accent/70 bg-accent/10 text-accent'
                      : 'border-border/60 bg-surface text-text-secondary hover:border-accent/60 hover:text-accent',
                  ].join(' ')}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <p className="rounded-2xl border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">
              {error}
            </p>
          ) : null}

          {/* List / loading / empty */}
          {isLoading ? (
            <ul className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-surface px-3 py-3"
                >
                  <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-surface-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 animate-pulse rounded-full bg-surface-muted" />
                    <div className="h-2.5 w-1/2 animate-pulse rounded-full bg-surface-muted" />
                  </div>
                </li>
              ))}
            </ul>
          ) : visiblePosts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-surface px-4 py-10 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-text-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  className="h-5 w-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h10" />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-text-secondary">
                  {popularFilter === 'popular'
                    ? 'No popular posts yet'
                    : searchTerm || selectedCategoryId !== 'all'
                      ? 'No posts match these filters'
                      : 'No standard posts yet'}
                </p>
                <p className="text-xs text-text-muted">
                  {popularFilter === 'popular'
                    ? 'Mark a post as popular from its menu to feature it here.'
                    : searchTerm || selectedCategoryId !== 'all'
                      ? 'Try a different search or category.'
                      : 'Create a post or check the Popular tab.'}
                </p>
              </div>
              {popularFilter !== 'popular' && !searchTerm && selectedCategoryId === 'all' ? (
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent/90"
                >
                  Add post
                </button>
              ) : null}
            </div>
          ) : (
            <ul className="space-y-2">
              {visiblePosts.map((post) => {
                const isActive = activePost?.id === post.id
                return (
                  <li
                    key={post.id}
                    onClick={() => setActivePostId(post.id)}
                    className={[
                      'group relative flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 transition',
                      isActive
                        ? 'border-accent/70 bg-accent/5'
                        : 'border-border/60 bg-surface hover:border-accent/60 hover:bg-accent/5',
                    ].join(' ')}
                  >
                    {isActive ? (
                      <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-accent" />
                    ) : null}

                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-surface-muted">
                      {post.coverImageUrl ? (
                        <img
                          src={post.coverImageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.onerror = null
                            target.style.display = 'none'
                          }}
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-base font-semibold text-text-muted">
                          {placeholderThumb(post.title)}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-sm font-medium text-text-secondary">
                          {post.title}
                        </p>
                        {post.isPopular ? (
                          <span
                            aria-label="Popular post"
                            className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-accent"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-2.5 w-2.5"
                            >
                              <path d="M12 2l2.4 6.6H21l-5.3 3.85L17.8 19 12 15.1 6.2 19l2.1-6.55L3 8.6h6.6z" />
                            </svg>
                            Popular
                          </span>
                        ) : null}
                        <span
                          className={[
                            'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]',
                            post.status === 1
                              ? 'bg-success/15 text-success'
                              : 'bg-surface-muted text-text-muted',
                          ].join(' ')}
                        >
                          {post.status === 1 ? 'Live' : 'Draft'}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-text-muted">
                        {post.authorName || 'Unknown'} · {post.readTimeMinutes} min · Updated{' '}
                        {formatShortDate(post.updatedAt)}
                      </p>
                      {post.tags.length ? (
                        <p className="mt-1 truncate text-[10px] text-text-muted/80">
                          {post.tags.map((tag) => `#${tag}`).join(' ')}
                        </p>
                      ) : null}
                    </div>

                    {/* Kebab menu */}
                    <div
                      className="shrink-0"
                      ref={openMenuId === post.id ? menuRef : undefined}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenMenuId((curr) => (curr === post.id ? null : post.id))}
                        data-open={openMenuId === post.id}
                        aria-label={`Actions for ${post.title}`}
                        aria-haspopup="menu"
                        aria-expanded={openMenuId === post.id}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted hover:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/40 data-[open=true]:bg-surface-muted data-[open=true]:text-accent"
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
                      {openMenuId === post.id ? (
                        <div
                          role="menu"
                          className="absolute right-2 top-10 z-20 min-w-[140px] overflow-hidden rounded-xl border border-border/60 bg-surface shadow-lg"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setOpenMenuId(null)
                              handleOpenEdit(post)
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-text-secondary transition hover:bg-surface-muted/60 hover:text-accent"
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
                            disabled={togglingPopularId === post.id}
                            onClick={() => {
                              setOpenMenuId(null)
                              handleTogglePopular(post)
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-text-secondary transition hover:bg-surface-muted/60 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill={post.isPopular ? 'currentColor' : 'none'}
                              stroke="currentColor"
                              strokeWidth={1.5}
                              strokeLinejoin="round"
                              className="h-3.5 w-3.5"
                            >
                              <path d="M12 2l2.4 6.6H21l-5.3 3.85L17.8 19 12 15.1 6.2 19l2.1-6.55L3 8.6h6.6z" />
                            </svg>
                            {togglingPopularId === post.id
                              ? 'Updating…'
                              : post.isPopular
                                ? 'Unmark popular'
                                : 'Mark as popular'}
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setOpenMenuId(null)
                              handleRequestDelete(post)
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-error transition hover:bg-error/10"
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
                )
              })}
            </ul>
          )}

          {/* Pagination */}
          {posts.length > 0 && totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-border/40 pt-3">
              <button
                type="button"
                onClick={() => handlePageChange(-1)}
                disabled={page <= 1}
                aria-label="Previous page"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-text-secondary disabled:cursor-not-allowed disabled:opacity-40 hover:border-accent/60 hover:text-accent"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  className="h-3.5 w-3.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <div className="flex items-center gap-1">
                {pageNumbers.map((n, i) =>
                  n === 'ellipsis' ? (
                    <span key={`e-${i}`} className="px-1 text-xs text-text-muted">
                      …
                    </span>
                  ) : (
                    <button
                      key={n}
                      type="button"
                      onClick={() => goToPage(n)}
                      className={[
                        'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition',
                        n === page
                          ? 'bg-accent text-white shadow-[0_8px_18px_-12px_rgba(99,102,241,0.7)]'
                          : 'border border-border/60 text-text-secondary hover:border-accent/60 hover:text-accent',
                      ].join(' ')}
                    >
                      {n}
                    </button>
                  ),
                )}
              </div>
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                disabled={page >= totalPages}
                aria-label="Next page"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-text-secondary disabled:cursor-not-allowed disabled:opacity-40 hover:border-accent/60 hover:text-accent"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  className="h-3.5 w-3.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          ) : null}
        </div>

        <div className="space-y-5 ">
          <div className="rounded-3xl border border-border/60 bg-surface p-6 text-text-secondary">
            {/* Compact horizontal meta strip — always shown above the article */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-surface-muted/60 px-3 py-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-[10px] font-semibold text-white">
                  7D
                </div>
                <span className="text-xs font-medium text-text-secondary">
                  {activePost?.authorName || 'Team 7D Design'}
                </span>
                {activePost?.authorRole ? (
                  <span className="text-[11px] text-text-muted">· {activePost.authorRole}</span>
                ) : null}
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-surface-muted/60 px-3 py-1.5 text-[11px] text-text-muted">
                <span className="inline-block h-1 w-6 rounded-full bg-gradient-to-r from-orange-400 to-purple-500" />
                {activePost?.readTimeMinutes || 2} min read
              </div>
              {contentsHeadings.length ? (
                <details className="group relative">
                  <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-full bg-surface-muted/60 px-3 py-1.5 text-[11px] font-medium text-text-secondary hover:bg-surface-muted">
                    Contents ({contentsHeadings.length})
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      className="h-3 w-3 transition group-open:rotate-180"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <ul className="absolute left-0 top-9 z-10 min-w-[200px] space-y-1 rounded-2xl border border-border/60 bg-surface p-3 text-sm text-text-secondary/80 shadow-lg">
                    {contentsHeadings.map((block) => (
                      <li key={block.id}>{block.heading}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>

            <div className="flex h-[75vh] flex-col overflow-hidden">
              <article
                className="flex-1 space-y-4 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <h1 className="text-3xl font-semibold leading-tight text-text-secondary">
                  {activePost?.title || 'Your blog title will appear here'}
                </h1>
                <p className="max-w-3xl text-sm text-text-muted">
                  {activePost?.excerpt ||
                    'Use the “Add post” button to create a long-form, case-study style article.'}
                </p>

                {activePost?.coverImageUrl ? (
                  <div className="mt-4 overflow-hidden rounded-3xl border border-border/60 bg-surface-muted/80">
                    <img
                      src={activePost.coverImageUrl}
                      alt=""
                      className="h-60 w-full object-cover"
                    />
                  </div>
                ) : null}

                <div className="mt-6">
                  {(activePost?.sections ?? []).map((block) => {
                    if (block.type === 'heading') {
                      if (!block.heading) return null
                      return (
                        <h2
                          key={block.id}
                          className="mt-10 text-lg font-semibold tracking-[0.16em] text-text-secondary"
                        >
                          {block.heading}
                        </h2>
                      )
                    }

                    if (block.type === 'paragraph') {
                      if (!block.text) return null
                      return (
                        <div
                          key={block.id}
                          className="mt-4 max-w-3xl text-sm leading-relaxed text-text-secondary/80 [&_p]:my-2 [&_a]:text-accent [&_a]:underline [&_strong]:font-semibold [&_em]:italic"
                          dangerouslySetInnerHTML={{ __html: block.text }}
                        />
                      )
                    }

                    if (block.type === 'list') {
                      if (!block.text) return null
                      return (
                        <div
                          key={block.id}
                          className="mt-4 text-sm text-text-secondary/80 [&_ul]:ml-5 [&_ul]:list-disc [&_ol]:ml-5 [&_ol]:list-decimal [&_li]:my-1 [&_a]:text-accent [&_a]:underline"
                          dangerouslySetInnerHTML={{ __html: block.text }}
                        />
                      )
                    }

                    if (block.type === 'image') {
                      if (!block.imageUrl) return null
                      return (
                        <div
                          key={block.id}
                          className="mt-6 overflow-hidden rounded-3xl border border-border/60 bg-surface-muted/80"
                        >
                          <img
                            src={block.imageUrl}
                            alt={block.alt ?? ''}
                            className="w-full object-cover"
                          />
                        </div>
                      )
                    }

                    return null
                  })}
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>

      <BlogPostFormModal
        isOpen={isFormOpen}
        mode={formMode}
        initialPost={postBeingEdited}
        categories={categories}
        onClose={handleCloseForm}
        onSubmit={handleSubmitPost}
      />

      <Modal isOpen={Boolean(deleteTarget)} onClose={handleCancelDelete} className="max-w-md">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-secondary">Delete post</h2>
          <p className="text-sm text-text-muted">
            Are you sure you want to remove{' '}
            <span className="font-semibold text-text-secondary">{deleteTarget?.title}</span>? This
            action cannot be undone.
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
              {isDeleting ? 'Deleting…' : 'Delete post'}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

export default BlogPostsPage
