import { useEffect, useMemo, useState } from 'react'
import ProjectFormModal from '../../components/portfolio/projects/ProjectFormModal'
import ProjectList from '../../components/portfolio/projects/ProjectList'
import {
  PROJECT_KEYWORD_OPTIONS,
  type Project,
  type ProjectCategoryValue,
  type ProjectDetailsStepPayload,
} from '../../components/portfolio/projects/types'

const ITEMS_PER_PAGE = 6

const palette = ['6366f1', '22d3ee', 'f97316', '10b981', 'ef4444', 'a855f7', '14b8a6', 'facc15']

const createThumbnailPlaceholder = (title: string) => {
  const initials = title
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase())
    .slice(0, 2)
    .join('') || 'PR'

  const color = palette[title.length % palette.length]

  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='240' viewBox='0 0 320 240'><defs><linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23${color}' stop-opacity='0.85'/><stop offset='100%' stop-color='%23${color}' stop-opacity='1'/></linearGradient></defs><rect width='320' height='240' rx='28' fill='url(%23grad)'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='Inter, Arial, sans-serif' font-size='72' fill='%23ffffff' font-weight='700'>${initials}</text></svg>`
}

const seedProjects: Array<{
  title: string
  year?: string
  category: ProjectCategoryValue
  shortDescription: string
  overviewDescription: string
  scopeOfWork: string
  industries: string
  keywords: string[]
}> = [
  {
    title: 'Horizon Rebrand Campaign',
    year: '2023',
    category: 'branding',
    shortDescription: 'A full identity refresh and product storytelling system for a global renewable energy startup.',
    overviewDescription:
      'Partnered with Horizon to overhaul positioning, launch a refreshed identity, and coordinate rollout across investor, partner, and customer touchpoints.',
    scopeOfWork: 'Brand strategy, identity system, launch collateral, microsite',
    industries: 'Renewable energy, cleantech',
    keywords: ['branding', 'campaign', 'storytelling', 'identity'],
  },
  {
    title: 'Orbit Mobile Experience',
    year: '2022',
    category: 'uiux',
    shortDescription: 'Native iOS and Android redesign with accessibility-first patterns and progressive analytics.',
    overviewDescription:
      'Unified Orbit’s mobile experience with a modular design system, increasing accessibility scores and accelerating handoffs for their product teams.',
    scopeOfWork: 'Product discovery, UX/UI design, design system foundations',
    industries: 'SaaS, analytics',
    keywords: ['digital', 'prototype', 'case-study'],
  },
  {
    title: 'Pulse Motion Launch',
    year: '2021',
    category: 'video',
    shortDescription: 'Launch film series with modular edits for paid social and event screens, delivered in four weeks.',
    overviewDescription:
      'Created a modular storytelling arc for product launch content, enabling Pulse to remix assets for events, social, and paid placements.',
    scopeOfWork: 'Creative direction, storyboard, production, post-production',
    industries: 'Consumer electronics',
    keywords: ['motion', 'animation', 'product-launch'],
  },
  {
    title: 'Northwind Seasonal Ads',
    year: '2020',
    category: 'ad',
    shortDescription: 'Cross-channel campaign including DOOH, paid social, and in-store displays with agile testing.',
    overviewDescription:
      'Integrated performance data and local insights to orchestrate Northwind’s seasonal retail push across OOH, social, and experiential channels.',
    scopeOfWork: 'Campaign strategy, art direction, media toolkit, motion',
    industries: 'Retail, apparel',
    keywords: ['campaign', 'ad', 'art-direction'],
  },
  {
    title: 'Lumen Health Portal',
    year: '2019',
    category: 'uiux',
    shortDescription: 'Healthcare platform dashboard with responsive design tokens for patient and practitioner roles.',
    overviewDescription:
      'Redesigned Lumen’s responsive portal with role-based navigation and modular dashboards that cut time-to-task for practitioners by 32%.',
    scopeOfWork: 'UX research, UI design, prototyping, design ops enablement',
    industries: 'Healthcare, healthtech',
    keywords: ['digital', 'uiux', 'prototype', 'case-study'],
  },
  {
    title: 'Vertex Brand Playbook',
    year: '2018',
    category: 'branding',
    shortDescription: 'Narrative and visual system guidelines, toolkit templates, and messaging pillars for global rollout.',
    overviewDescription:
      'Authored the Vertex brand playbook, translating refreshed positioning into a scalable toolkit for regional teams and agency partners.',
    scopeOfWork: 'Brand narrative, guidelines, toolkit, training sessions',
    industries: 'Enterprise SaaS',
    keywords: ['branding', 'identity', 'storytelling'],
  },
]

const buildSeedProjects = (): Project[] =>
  seedProjects.map((project, index) => {
    const now = new Date(Date.now() - index * 86400000)
    const year = project.year ?? String(now.getFullYear())
    const color = palette[index % palette.length]

    return {
      id: `seed-project-${index}`,
      title: project.title,
      year,
      category: project.category,
      shortDescription: project.shortDescription,
      overviewDescription: project.overviewDescription,
      scopeOfWork: project.scopeOfWork,
      industries: project.industries,
      keywords: project.keywords,
      thumbnailUrl: createThumbnailPlaceholder(project.title),
      clientMockupUrl: `https://placehold.co/1600x900/${color}/ffffff?text=Client+Mockup`,
      brandingMockupUrl: `https://placehold.co/800x800/${color}/ffffff?text=Branding+Mockup+1`,
      brandingMockupSecondaryUrl: `https://placehold.co/800x800/${color}/ffffff?text=Branding+Mockup+2`,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
  })

const PortfolioProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>(() => buildSeedProjects())
  const [currentPage, setCurrentPage] = useState(1)
  const [isFormOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [projectBeingEdited, setProjectBeingEdited] = useState<Project | null>(null)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(projects.length / ITEMS_PER_PAGE)), [projects.length])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    return projects.slice(start, end)
  }, [currentPage, projects])

  const handleOpenCreate = () => {
    setFormMode('create')
    setProjectBeingEdited(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (project: Project) => {
    setFormMode('edit')
    setProjectBeingEdited(project)
    setFormOpen(true)
  }

  const handleCloseForm = () => {
    setFormOpen(false)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleSubmitStep = async (payload: ProjectDetailsStepPayload) => {
    const timestamp = new Date().toISOString()

    if (formMode === 'edit' && projectBeingEdited) {
      setProjects((prev) => {
        const updated = prev.map((project) =>
          project.id === projectBeingEdited.id
            ? {
                ...project,
                title: payload.title,
                year: payload.year,
                category: payload.category,
                shortDescription: payload.shortDescription,
                overviewDescription: payload.overviewDescription,
                scopeOfWork: payload.scopeOfWork,
                industries: payload.industries,
                keywords: payload.keywords,
                thumbnailUrl: payload.thumbnailDataUrl,
                clientMockupUrl: payload.clientMockupDataUrl,
                brandingMockupUrl: payload.brandingMockupDataUrl,
                brandingMockupSecondaryUrl: payload.brandingMockupSecondaryDataUrl,
                updatedAt: timestamp,
              }
            : project,
        )

        return updated.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0))
      })
      return
    }

    const newProject: Project = {
      id: crypto.randomUUID?.() ?? `project-${Date.now()}`,
      title: payload.title,
      year: payload.year,
      category: payload.category,
      shortDescription: payload.shortDescription,
      overviewDescription: payload.overviewDescription,
      scopeOfWork: payload.scopeOfWork,
      industries: payload.industries,
      keywords: payload.keywords,
      thumbnailUrl: payload.thumbnailDataUrl,
      clientMockupUrl: payload.clientMockupDataUrl,
      brandingMockupUrl: payload.brandingMockupDataUrl,
      brandingMockupSecondaryUrl: payload.brandingMockupSecondaryDataUrl,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    setProjects((prev) => [newProject, ...prev])
    setCurrentPage(1)
  }

  const handleDelete = (project: Project) => {
    const shouldDelete =
      typeof window === 'undefined'
        ? true
        : window.confirm(`Delete "${project.title}" from your portfolio? This action cannot be undone.`)

    if (!shouldDelete) {
      return
    }

    setProjects((prev) => prev.filter((item) => item.id !== project.id))
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.25em] text-text-muted">Portfolio</p>
          <h2 className="text-3xl font-semibold text-text-primary">Projects</h2>
          <p className="max-w-2xl text-sm text-text-muted">
            Maintain a curated library of client stories, launches, and campaigns. Organize projects with consistent metadata for a polished portfolio in both themes.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_28px_-20px_rgba(99,102,241,0.9)] transition hover:bg-accent/90"
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
            </svg>
          </span>
          Add project
        </button>
      </header>

      <ProjectList
        projects={paginatedProjects}
        totalCount={projects.length}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={handlePageChange}
        onEditProject={handleOpenEdit}
        onDeleteProject={handleDelete}
      />

      <ProjectFormModal
        isOpen={isFormOpen}
        mode={formMode}
        initialProject={projectBeingEdited}
        keywordOptions={PROJECT_KEYWORD_OPTIONS}
        onClose={handleCloseForm}
        onSubmit={handleSubmitStep}
      />
    </div>
  )
}

export default PortfolioProjectsPage
