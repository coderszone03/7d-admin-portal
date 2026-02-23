import { useEffect, useMemo, useState } from 'react'
import type { BlogPost } from '../../components/blog/types'
import BlogPostFormModal from '../../components/blog/BlogPostFormModal'
import { fetchBlogCategories, type BlogCategory } from '../../lib/api/blog'

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
  const [isLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  // useEffect(() => {
  //   let isMounted = true

  //   const loadPosts = async () => {
  //     setIsLoading(true)
  //     setError(null)
  //     try {
  //       const { items, total } = await fetchBlogPosts({
  //         page,
  //         pageSize,
  //         categoryId: selectedCategoryId === 'all' ? null : selectedCategoryId,
  //       })
  //       if (!isMounted) {
  //         return
  //       }
  //       if (!items.length) {
  //         const seed = buildSeedPost()
  //         setPosts([seed])
  //         setActivePostId(seed.id)
  //         setTotalCount(1)
  //         return
  //       }
  //       setPosts(items)
  //       setTotalCount(total)
  //       setActivePostId((previous) => {
  //         if (previous && items.some((item) => item.id === previous)) {
  //           return previous
  //         }
  //         return items[0]?.id ?? null
  //       })
  //     } catch (loadError) {
  //       if (!isMounted) {
  //         return
  //       }
  //       setError(loadError instanceof Error ? loadError.message : 'Unable to load blog posts.')
  //       const seed = buildSeedPost()
  //       setPosts([seed])
  //       setActivePostId(seed.id)
  //       setTotalCount(1)
  //     } finally {
  //       if (isMounted) {
  //         setIsLoading(false)
  //       }
  //     }
  //   }

  //   loadPosts()

  //   return () => {
  //     isMounted = false
  //   }
  // }, [page, pageSize, selectedCategoryId])

  const activePost = useMemo(
    () => posts.find((post) => post.id === activePostId) ?? posts[0] ?? null,
    [activePostId, posts],
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

  const handleSubmitPost = (post: BlogPost) => {
    setError(null)
    setPosts((previous) => {
      const existingIndex = previous.findIndex((item) => item.id === post.id)
      if (existingIndex === -1) {
        const next = [post, ...previous]
        setTotalCount((current) => current + 1)
        return next
      }
      const next = [...previous]
      next[existingIndex] = post
      return next
    })
    setActivePostId(post.id)
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2.2fr)]">
        <div className="space-y-5 rounded-3xl border border-border/60 bg-surface/80 p-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectCategory('all')}
                  className={[
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
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
                      'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                      selectedCategoryId === category.id
                        ? 'border-accent/70 bg-accent/10 text-accent'
                        : 'border-border/60 bg-surface text-text-secondary hover:border-accent/60 hover:text-accent',
                    ].join(' ')}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
              <div className="text-xs text-text-muted">
                Page {page} of {totalPages}
              </div>
            </div>

            {error ? (
              <p className="rounded-2xl border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">
                {error}
              </p>
            ) : null}

            {isLoading ? (
              <p className="text-xs text-text-muted">Loading posts…</p>
            ) : null}
          </div>

          <div className="mt-3 space-y-3">
            <ul className="space-y-2 text-sm">
              {posts.map((post) => (
                <li
                  key={post.id}
                  className={[
                    'flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-3 py-3',
                    activePost?.id === post.id
                      ? 'border-accent/80 bg-accent/5 text-text-secondary'
                      : 'border-border/60 bg-surface text-text-secondary hover:border-accent/60 hover:bg-accent/5',
                  ].join(' ')}
                  onClick={() => setActivePostId(post.id)}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{post.title}</p>
                    <p className="mt-0.5 truncate text-xs text-text-muted">
                      {post.authorName} · {post.readTimeMinutes} mins read
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-text-muted">
                    {post.tags.length ? (
                      <span className="hidden max-w-[140px] truncate sm:inline">
                        {post.tags.map((tag) => `#${tag}`).join(' ')}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleOpenEdit(post)
                      }}
                      className="rounded-full border border-border/60 px-2.5 py-1 text-[11px] font-semibold text-text-secondary hover:border-accent/60 hover:text-accent"
                    >
                      Edit
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-xs text-text-muted">
              <p>
                Showing page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(-1)}
                  disabled={page <= 1}
                  className="rounded-full border border-border/60 px-3 py-1.5 text-[11px] font-semibold text-text-secondary disabled:cursor-not-allowed disabled:opacity-50 hover:border-accent/60 hover:text-accent"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(1)}
                  disabled={page >= totalPages}
                  className="rounded-full border border-border/60 px-3 py-1.5 text-[11px] font-semibold text-text-secondary disabled:cursor-not-allowed disabled:opacity-50 hover:border-accent/60 hover:text-accent"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 ">
          <div className="rounded-3xl border border-border/60 bg-[#111111] p-6 text-white">
            <div className="flex h-[75vh] flex-col gap-6 overflow-hidden lg:flex-row">
              <aside className="w-full max-w-xs space-y-4 lg:w-64 lg:flex-none ">
                <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500">
                    <span className="text-sm font-semibold text-white">7D</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                      Written by
                    </p>
                    <p className="text-sm font-medium text-white">
                      {activePost?.authorName || 'Team 7D Design'}
                    </p>
                    <p className="text-[11px] text-white/60">
                      {activePost?.authorRole || 'Content Team'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 rounded-2xl bg-white/5 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                    Contents
                  </p>
                  <ul className="space-y-1 text-sm text-white/80">
                    {contentsHeadings.map((block) => (
                      <li key={block.id}>{block.heading}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2 rounded-2xl bg-white/5 p-3 text-[11px] text-white/70">
                  <p>
                    <span className="inline-block h-1 w-10 rounded-full bg-gradient-to-r from-orange-400 to-purple-500" />
                  </p>
                  <p>{activePost?.readTimeMinutes || 2} mins read</p>
                </div>
              </aside>

              <article className="flex-1 space-y-4 overflow-y-auto pr-1">
                <h1 className="text-3xl font-semibold leading-tight text-white">
                  {activePost?.title || 'Your blog title will appear here'}
                </h1>
                <p className="max-w-3xl text-sm text-white/70">
                  {activePost?.excerpt ||
                    'Use the “Add post” button to create a long-form, case-study style article.'}
                </p>

                {activePost?.coverImageUrl ? (
                  <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-black/40">
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
                          className="mt-10 text-lg font-semibold tracking-[0.16em] text-white"
                        >
                          {block.heading}
                        </h2>
                      )
                    }

                    if (block.type === 'paragraph') {
                      if (!block.text) return null
                      return (
                        <p
                          key={block.id}
                          className="mt-4 max-w-3xl text-sm leading-relaxed text-white/80 whitespace-pre-line"
                        >
                          {block.text}
                        </p>
                      )
                    }

                    if (block.type === 'list') {
                      if (!block.text) return null
                      const items = block.text
                        .split('\n')
                        .map((line) => line.trim())
                        .filter(Boolean)
                      if (!items.length) return null

                      const ListTag = (block.ordered ? 'ol' : 'ul') as 'ol' | 'ul'

                      return (
                        <ListTag
                          key={block.id}
                          className={`mt-4 ml-5 space-y-1 text-sm text-white/80 ${
                            block.ordered ? 'list-decimal' : 'list-disc'
                          }`}
                        >
                          {items.map((item, index) => (
                            <li key={`${block.id}-${index}`}>{item}</li>
                          ))}
                        </ListTag>
                      )
                    }

                    if (block.type === 'image') {
                      if (!block.imageUrl) return null
                      return (
                        <div
                          key={block.id}
                          className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-black/40"
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
        onClose={handleCloseForm}
        onSubmit={handleSubmitPost}
      />
    </section>
  )
}

export default BlogPostsPage
