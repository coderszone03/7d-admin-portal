import { useMemo, useState } from 'react'
import JobPostsTab from './careers/JobPostsTab'
import ApplicantsTab from './careers/ApplicantsTab'
import { JOB_POSTS, type JobPost } from '../assets/constants/jobPosts'
import { APPLICANTS, type Applicant } from '../assets/constants/applicants'

type TabId = 'posts' | 'applicants'

const CareersPage = () => {
  const [posts, setPosts] = useState<JobPost[]>(() => [...JOB_POSTS])
  const [applicants, setApplicants] = useState<Applicant[]>(() => [...APPLICANTS])
  const [activeTab, setActiveTab] = useState<TabId>('posts')
  const [selectedPostId, setSelectedPostId] = useState<string | null>(
    () => JOB_POSTS[0]?.id ?? null,
  )

  const applicantsCountByPost = useMemo(() => {
    const counts: Record<string, number> = {}
    applicants.forEach((a) => {
      counts[a.jobPostId] = (counts[a.jobPostId] ?? 0) + 1
    })
    return counts
  }, [applicants])

  const unreadApplicants = useMemo(
    () => applicants.filter((a) => !a.read).length,
    [applicants],
  )

  const handleJumpToPost = (postId: string) => {
    setSelectedPostId(postId)
    setActiveTab('posts')
  }

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.25em] text-text-muted">
          Careers
        </p>
        <h1 className="text-2xl font-semibold text-text-secondary">
          Roles &amp; applicants
        </h1>
        <p className="text-sm text-text-muted">
          Create job postings and triage the applicants coming in. Changes are
          local to this session for now.
        </p>
      </header>

      {/* Tabs + status pill on the right */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Careers sections"
          className="inline-flex items-center gap-1 rounded-2xl border border-border/60 bg-surface p-1"
        >
          <button
            role="tab"
            type="button"
            aria-selected={activeTab === 'posts'}
            onClick={() => setActiveTab('posts')}
            className={`inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
              activeTab === 'posts'
                ? 'bg-accent text-white shadow-[0_8px_18px_-12px_rgba(99,102,241,0.7)]'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            Job posts
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === 'posts'
                  ? 'bg-white/25 text-white'
                  : 'bg-surface-muted text-text-muted'
              }`}
            >
              {posts.length}
            </span>
          </button>
          <button
            role="tab"
            type="button"
            aria-selected={activeTab === 'applicants'}
            onClick={() => setActiveTab('applicants')}
            className={`inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
              activeTab === 'applicants'
                ? 'bg-accent text-white shadow-[0_8px_18px_-12px_rgba(99,102,241,0.7)]'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            Applicants
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === 'applicants'
                  ? 'bg-white/25 text-white'
                  : 'bg-surface-muted text-text-muted'
              }`}
            >
              {applicants.length}
            </span>
          </button>
        </div>
        {unreadApplicants > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {unreadApplicants} new applicants
          </span>
        ) : null}
      </div>

      {/* Tab content */}
      {activeTab === 'posts' ? (
        <JobPostsTab
          posts={posts}
          setPosts={setPosts}
          applicantsCountByPost={applicantsCountByPost}
          selectedPostId={selectedPostId}
          setSelectedPostId={setSelectedPostId}
        />
      ) : (
        <ApplicantsTab
          posts={posts}
          applicants={applicants}
          setApplicants={setApplicants}
          onJumpToPost={handleJumpToPost}
        />
      )}
    </section>
  )
}

export default CareersPage
