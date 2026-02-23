import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import type { SidebarProps } from './types'
import BrandLogo from '../common/BrandLogo'

type NavigationChild = {
  label: string
  to: string
}

type NavigationItem = {
  label: string
  icon: ReactNode
  to?: string
  children?: NavigationChild[]
}

const iconClasses = 'h-4 w-4'

const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={iconClasses}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25A2.25 2.25 0 0 1 5.25 6h3A2.25 2.25 0 0 1 10.5 8.25v3A2.25 2.25 0 0 1 8.25 13.5h-3A2.25 2.25 0 0 1 3 11.25v-3Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 5.25h5.25a2.25 2.25 0 0 1 2.25 2.25V9a2.25 2.25 0 0 1-2.25 2.25H13.5A2.25 2.25 0 0 1 11.25 9V7.5a2.25 2.25 0 0 1 2.25-2.25Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5A2.25 2.25 0 0 1 5.25 14.25h3A2.25 2.25 0 0 1 10.5 16.5v3A2.25 2.25 0 0 1 8.25 21h-3A2.25 2.25 0 0 1 3 19.5v-3Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 13.5h5.25A2.25 2.25 0 0 1 21 15.75v3A2.25 2.25 0 0 1 18.75 21h-5.25A2.25 2.25 0 0 1 11.25 18.75v-3A2.25 2.25 0 0 1 13.5 13.5Z" />
  </svg>
)

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={iconClasses}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 7.125A3.375 3.375 0 1 1 10.125 7.125 3.375 3.375 0 0 1 16.5 7.125Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 8.25a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm13.5 8.25a4.5 4.5 0 0 0-9 0" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 14.25a4.125 4.125 0 0 0-4.125 4.125V19.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.125 19.5v-1.125A4.125 4.125 0 0 1 17.25 14.25h2.25A4.125 4.125 0 0 1 23.625 18.375V19.5" />
  </svg>
)

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={iconClasses}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3h.008v-.008H12Z" />
    <circle cx="12" cy="12" r="9" />
  </svg>
)

const FolderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={iconClasses}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5A2.25 2.25 0 0 1 5.25 5.25h3.879a2.25 2.25 0 0 1 1.59.659l1.5 1.5a2.25 2.25 0 0 0 1.59.659H18.75A2.25 2.25 0 0 1 21 10.318V16.5A2.25 2.25 0 0 1 18.75 18.75H5.25A2.25 2.25 0 0 1 3 16.5V7.5Z" />
  </svg>
)

const BriefcaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={iconClasses}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 6.75V5.25A2.25 2.25 0 0 1 12 3h0a2.25 2.25 0 0 1 2.25 2.25v1.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25A2.25 2.25 0 0 1 5.25 6h13.5A2.25 2.25 0 0 1 21 8.25v8.25a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 16.5V8.25Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6" />
  </svg>
)

const DocumentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={iconClasses}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25h3.75M12 12h3.75M12 15.75h3.75" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3h7.5L18 6.75V18A2.25 2.25 0 0 1 15.75 20.25h-9A2.25 2.25 0 0 1 4.5 18V5.25A2.25 2.25 0 0 1 6.75 3Z" />
  </svg>
)

const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={iconClasses}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2.25 2.25 0 0 1-2.25 2.25H8.25L3 21l1.5-4.5V6A2.25 2.25 0 0 1 6.75 3.75h12A2.25 2.25 0 0 1 21 6v9Z" />
  </svg>
)

const BadgeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={iconClasses}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25 12 15l-3.75 2.25L9 11.25l-3-2.25 3.75-.375L12 5.25l2.25 3.375 3.75.375-3 2.25 1.5 6Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 21 6 15" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 21 18 15" />
  </svg>
)

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={iconClasses}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75h4.5m-4.5 16.5h4.5M4.5 9.75h15m-15 4.5h15" />
    <circle cx="7.5" cy="19.5" r="1.5" />
    <circle cx="16.5" cy="4.5" r="1.5" />
    <circle cx="7.5" cy="4.5" r="1.5" />
    <circle cx="16.5" cy="19.5" r="1.5" />
  </svg>
)

const navigation: NavigationItem[] = [
  { label: 'Dashboard', to: '/', icon: <DashboardIcon /> },
  { label: 'Clients', to: '/clients', icon: <UsersIcon /> },
  { label: 'About Us', to: '/about', icon: <InfoIcon /> },
  {
    label: 'Portfolio',
    icon: <FolderIcon />,
    children: [
      { label: 'Projects', to: '/portfolio/projects' },
      { label: 'Features', to: '/portfolio/features' },
    ],
  },
  { label: 'Services', to: '/services', icon: <BriefcaseIcon /> },
  {
    label: 'Blog',
    icon: <DocumentIcon />,
    children: [
      { label: 'Categories', to: '/blog/categories' },
      { label: 'Posts', to: '/blog/posts' },
    ],
  },
  { label: 'Enquiry', to: '/enquiry', icon: <ChatIcon /> },
  { label: 'Careers', to: '/careers', icon: <BadgeIcon /> },
  {
    label: 'Settings',
    icon: <SettingsIcon />,
    children: [
      { label: 'Contact Settings', to: '/settings/contact' },
      { label: 'Mail Settings', to: '/settings/mail' },
    ],
  },
]

const Sidebar = ({ isMobileOpen = false, onClose }: SidebarProps) => {
  const location = useLocation()
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}

    navigation.forEach((item) => {
      if (
        item.children?.some((child) => location.pathname.startsWith(child.to)) ||
        (item.to && location.pathname === item.to)
      ) {
        initial[item.label] = true
      }
    })

    return initial
  })

  useEffect(() => {
    navigation.forEach((item) => {
      if (item.children?.some((child) => location.pathname.startsWith(child.to))) {
        setExpandedSections((prev) =>
          prev[item.label]
            ? prev
            : {
                ...prev,
                [item.label]: true,
              },
        )
      }
    })
  }, [location.pathname])

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [label]: !prev[label],
    }))
  }

  const isGroupActive = (item: NavigationItem) => {
    if (item.children) {
      return item.children.some((child) => location.pathname.startsWith(child.to))
    }

    return item.to ? location.pathname === item.to : false
  }

  const handleClose = () => {
    onClose?.()
  }

  const renderNavigationItems = () =>
    navigation.map((item) => {
      const isExpanded = expandedSections[item.label]
      const isActive = isGroupActive(item)

      const icon = (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
          {item.icon}
        </span>
      )

      if (item.children?.length) {
        return (
          <div key={item.label} className="space-y-1">
            <button
              type="button"
              onClick={() => toggleSection(item.label)}
              className={[
                'flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
                'text-text-muted hover:bg-accent/10 hover:text-text-primary',
                isActive ? 'bg-accent/15 text-text-primary' : '',
              ].join(' ')}
            >
              <span className="flex items-center gap-3">
                {icon}
                <span>{item.label}</span>
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className={[
                  'h-4 w-4 transition-transform duration-200',
                  isExpanded ? 'rotate-180 text-accent' : 'text-text-muted',
                ].join(' ')}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {isExpanded ? (
              <div className="space-y-1.5 pl-8">
                {item.children.map((child) => (
                  <NavLink
                    key={child.to}
                    to={child.to}
                    onClick={handleClose}
                    className={({ isActive: childActive }) =>
                      [
                        'flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200',
                        'text-text-muted hover:bg-accent/10 hover:text-text-primary',
                        childActive ? 'bg-accent/15 text-text-primary' : '',
                      ].join(' ')
                    }
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    {child.label}
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>
        )
      }

      return (
        <NavLink
          key={item.label}
          to={item.to ?? '/'}
          end={item.to === '/'}
          onClick={handleClose}
          className={({ isActive: childActive }) =>
            [
              'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
              'text-text-muted hover:bg-accent/10 hover:text-text-primary',
              childActive ? 'bg-accent/15 text-text-primary' : '',
            ].join(' ')
          }
        >
          {icon}
          {item.label}
        </NavLink>
      )
    })

  const SidebarBody = () => (
    <>
      <div className="relative flex h-16 items-center gap-2 px-6 after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-gradient-to-r after:from-transparent after:via-border/45 after:to-transparent after:content-['']">
        <BrandLogo className="h-9 w-auto" />
        <div>
          <p className="text-sm font-medium text-text-secondary">7D design</p>
          <p className="text-xs text-text-muted">Control Center</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-4 py-6">{renderNavigationItems()}</nav>
      <div className="relative px-6 py-5 text-xs text-text-muted before:pointer-events-none before:absolute before:top-0 before:left-0 before:h-px before:w-full before:bg-gradient-to-r before:from-transparent before:via-border/35 before:to-transparent before:content-['']">
        <p className="font-medium text-text-secondary">Need help?</p>
        <p>Reach out to your platform administrator.</p>
      </div>
    </>
  )

  return (
    <>
      <aside className="hidden h-screen w-64 flex-col bg-surface/85 backdrop-blur md:flex relative after:pointer-events-none after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gradient-to-b after:from-transparent after:via-border/45 after:to-transparent after:content-['']">
        <SidebarBody />
      </aside>
      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close navigation"
            onClick={handleClose}
          />
          <aside className="relative ml-auto flex h-full w-72 flex-col bg-surface/95 shadow-[0_32px_64px_-36px_rgba(15,17,21,0.8)] after:pointer-events-none after:absolute after:top-0 after:left-0 after:h-full after:w-px after:bg-gradient-to-b after:from-transparent after:via-border/45 after:to-transparent after:content-['']">
            <div className="flex h-16 items-center justify-between px-5 relative after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-gradient-to-r after:from-transparent after:via-border/45 after:to-transparent after:content-['']">
reduc              <div className="flex items-center gap-2">
                <BrandLogo className="h-9 w-auto" />
                <div>
                  <p className="text-sm font-medium text-text-secondary">Admin Portal</p>
                  <p className="text-xs text-text-muted">Control Center</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 text-text-muted transition hover:border-accent/60 hover:text-text-secondary"
                aria-label="Close navigation panel"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="h-5 w-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto">
              <nav className="flex flex-1 flex-col gap-1 px-4 py-6">{renderNavigationItems()}</nav>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  )
}

export default Sidebar
