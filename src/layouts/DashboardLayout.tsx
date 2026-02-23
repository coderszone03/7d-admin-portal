import { useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import Sidebar from '../components/navigation/Sidebar'
import TopNav from '../components/navigation/TopNav'
import { logout, selectIsAuthenticated } from '../features/auth/authSlice'
import { AUTH_COOKIE_KEY, AUTH_COOKIE_MAX_AGE_MINUTES } from '../features/auth/constants'
import { getCookie } from '../lib/utils/cookies'

// Idle timeout is short (2 minutes) and independent of cookie expiry.
const IDLE_TIMEOUT_MS = 2 * 60 * 1000
const IDLE_WARNING_DURATION_MS = 8000

const formatSessionTimeoutLabel = (minutes: number) => {
  if (minutes % (24 * 60) === 0) {
    const days = minutes / (24 * 60)
    return `${days} day${days > 1 ? 's' : ''}`
  }

  if (minutes % 60 === 0) {
    const hours = minutes / 60
    return `${hours} hour${hours > 1 ? 's' : ''}`
  }

  return `${minutes} minute${minutes > 1 ? 's' : ''}`
}

const SESSION_TIMEOUT_LABEL = formatSessionTimeoutLabel(AUTH_COOKIE_MAX_AGE_MINUTES)

const DashboardLayout = () => {
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const location = useLocation()
  const navigate = useNavigate()
  const [sessionExpired, setSessionExpired] = useState(false)
  const [isIdleWarningOpen, setIsIdleWarningOpen] = useState(false)
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const expiryHandledRef = useRef(false)
  const idleTimeoutRef = useRef<number | null>(null)
  const idleWarningTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      setSessionExpired(false)
      expiryHandledRef.current = false
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const resetIdleTimers = () => {
      if (idleTimeoutRef.current !== null) {
        window.clearTimeout(idleTimeoutRef.current)
      }
      if (idleWarningTimeoutRef.current !== null) {
        window.clearTimeout(idleWarningTimeoutRef.current)
      }
      setIsIdleWarningOpen(false)

      idleTimeoutRef.current = window.setTimeout(() => {
        setIsIdleWarningOpen(true)

        idleWarningTimeoutRef.current = window.setTimeout(() => {
          handleIdleLogout()
        }, IDLE_WARNING_DURATION_MS)
      }, IDLE_TIMEOUT_MS - IDLE_WARNING_DURATION_MS)
    }

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'visibilitychange'] as const

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetIdleTimers)
    })

    resetIdleTimers()

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetIdleTimers)
      })
      if (idleTimeoutRef.current !== null) {
        window.clearTimeout(idleTimeoutRef.current)
      }
      if (idleWarningTimeoutRef.current !== null) {
        window.clearTimeout(idleWarningTimeoutRef.current)
      }
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const interval = window.setInterval(() => {
      const cookieExists = Boolean(getCookie(AUTH_COOKIE_KEY))

      if (!cookieExists && !expiryHandledRef.current) {
        expiryHandledRef.current = true
        setSessionExpired(true)
        dispatch(logout())
      }
    }, 5000)

    return () => {
      window.clearInterval(interval)
    }
  }, [dispatch, isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated && !sessionExpired) {
      navigate('/login', { replace: true, state: { from: location } })
    }
  }, [isAuthenticated, sessionExpired, navigate, location])

  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [location.pathname, sessionExpired])

  const handleGoToLogin = () => {
    setSessionExpired(false)
    navigate('/login', { replace: true })
  }

  const handleIdleStayLoggedIn = () => {
    setIsIdleWarningOpen(false)
  }

  const handleIdleLogout = () => {
    setIsIdleWarningOpen(false)
    dispatch(logout())
  }

  const handleToggleSidebar = () => {
    setMobileSidebarOpen((prev) => !prev)
  }

  const handleCloseSidebar = () => {
    setMobileSidebarOpen(false)
  }

  if (!isAuthenticated && !sessionExpired) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-background text-text-primary">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-surface-glow" />
      <Sidebar isMobileOpen={isMobileSidebarOpen} onClose={handleCloseSidebar} />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopNav onToggleSidebar={handleToggleSidebar} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto w-full max-w-6xl space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
      {isIdleWarningOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-border/60 bg-surface/95 p-8 shadow-[0_30px_80px_-40px_rgba(99,102,241,0.8)]">
            <div className="absolute -left-16 -top-16 h-32 w-32 rounded-full bg-accent/20 blur-3xl" />
            <div className="absolute -bottom-20 -right-16 h-40 w-40 rounded-full bg-warning/20 blur-3xl" />
            <div className="relative space-y-4 text-center">
              <h2 className="text-xl font-semibold text-text-primary">You are in idle mode</h2>
              <p className="text-sm text-text-muted">
                You’ve been inactive for a while. You will be logged out automatically in 8 seconds
                unless you choose to stay logged in.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={handleIdleStayLoggedIn}
                  className="inline-flex items-center justify-center rounded-2xl border border-border/60 bg-surface-muted/60 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-accent/60 hover:text-accent"
                >
                  Stay logged in
                </button>
                <button
                  type="button"
                  onClick={handleIdleLogout}
                  className="inline-flex items-center justify-center rounded-2xl bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger/20"
                >
                  Log out now
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {sessionExpired ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/80 backdrop-blur-md" />
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border/60 bg-surface/95 shadow-[0_30px_80px_-40px_rgba(99,102,241,0.8)]">
            <div className="absolute -left-24 -top-24 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
            <div className="absolute -bottom-32 -right-24 h-56 w-56 rounded-full bg-danger/20 blur-3xl" />
            <div className="relative px-12 py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/15 text-danger shadow-[0_15px_45px_-20px_rgba(239,68,68,0.7)]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.4}
                  className="h-7 w-7"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m0 3h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-2xl font-semibold tracking-tight text-text-primary">
                Session timed out
              </h2>
              <p className="mt-3 text-sm leading-6 text-text-muted">
                You were signed out to keep your account secure. Save your work and sign back in to
                continue managing the workspace.
              </p>
              <div className="mt-8 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleGoToLogin}
                  className="inline-flex items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-[0_20px_40px_-18px_rgba(99,102,241,0.8)] transition hover:bg-accent/90"
                >
                  Return to login
                </button>
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-text-muted">
                  Session expired after {SESSION_TIMEOUT_LABEL}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default DashboardLayout
