import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { logout, selectCurrentUser } from '../../features/auth/authSlice'
import type { SidebarToggleProps } from './types'
import { useState, type FormEvent } from 'react'
import Modal from '../common/Modal'
import BrandLogo from '../common/BrandLogo'

const TopNav = ({ onToggleSidebar }: SidebarToggleProps) => {
  const user = useAppSelector(selectCurrentUser)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isPasswordMode, setIsPasswordMode] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
  })

  const handleLogout = () => {
    setIsProfileOpen(false)
    dispatch(logout())
    navigate('/login', { replace: true })
  }

  const handleOpenProfile = () => {
    setIsProfileOpen(true)
    setIsPasswordMode(false)
    setPasswordError(null)
    setPasswordSuccess(null)
    setPasswordForm({
      current: '',
      next: '',
      confirm: '',
    })
  }

  const handleCloseProfile = () => {
    setIsProfileOpen(false)
    setIsPasswordMode(false)
    setPasswordError(null)
    setPasswordSuccess(null)
    setPasswordForm({
      current: '',
      next: '',
      confirm: '',
    })
  }

  const handleChangePassword = () => {
    setPasswordError(null)
    setPasswordSuccess(null)
    setPasswordForm({
      current: '',
      next: '',
      confirm: '',
    })
    setIsPasswordMode(true)
  }

  const displayName = user?.name ?? user?.email?.split('@')[0] ?? 'Admin'
  const displayEmail = user?.email ?? 'admin@7d.io'

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      setPasswordError('All fields are required.')
      return
    }

    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError('New passwords do not match.')
      return
    }

    // Placeholder success handling since there is no backend integration yet.
    setPasswordSuccess('Password updated successfully.')
    setPasswordForm({
      current: '',
      next: '',
      confirm: '',
    })
    setIsPasswordMode(false)
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-surface/85 px-4 backdrop-blur md:px-6 shadow-[0_12px_36px_-30px_rgba(99,102,241,0.3)] relative after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-gradient-to-r after:from-transparent after:via-border/50 after:to-transparent after:content-['']">
      <div className="flex flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-background/70 text-text-muted transition hover:border-accent/60 hover:text-text-secondary md:hidden"
          aria-label="Toggle navigation"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-5 w-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-3 md:hidden">
          <BrandLogo className="h-9 w-auto" />
          <span className="text-sm font-medium text-text-secondary">7D design</span>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-end gap-3 md:gap-4">
        <div className="relative">
          <button
            type="button"
            onClick={handleOpenProfile}
            className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-sm text-text-secondary transition hover:border-accent/60 hover:text-accent"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent">
              {user?.email?.[0]?.toUpperCase() ?? 'A'}
            </span>
            <span className="hidden flex-col text-left md:flex">
              <span className="font-semibold">{displayName}</span>
              <span className="text-xs text-text-muted">Administrator</span>
            </span>
          </button>
        </div>
      </div>
      <Modal isOpen={isProfileOpen} onClose={handleCloseProfile}>
        <button
          type="button"
          onClick={handleCloseProfile}
          className="absolute right-4 top-4 rounded-full p-1 text-text-muted transition hover:text-text-secondary"
          aria-label="Close profile panel"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-5 w-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <div className="mb-6 flex flex-col items-center gap-3">
          <BrandLogo className="h-12 w-auto" />
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-lg font-semibold text-text-secondary">{displayName}</p>
            <p className="text-sm text-text-muted">{displayEmail}</p>
            <span className="rounded-full border border-border/60 px-3 py-0.5 text-xs font-medium text-text-muted">
              Administrator
            </span>
          </div>
        </div>
        {isPasswordMode ? (
          <form className="space-y-5" onSubmit={handlePasswordSubmit}>
            <div className="flex flex-col gap-3 text-sm">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Current password
                </span>
                <input
                  type="password"
                  value={passwordForm.current}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({ ...prev, current: event.target.value }))
                  }
                  placeholder="Enter current password"
                  className="w-full rounded-xl border border-border/60 bg-surface-muted/60 px-4 py-2 text-sm text-text-secondary outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  New password
                </span>
                <input
                  type="password"
                  value={passwordForm.next}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({ ...prev, next: event.target.value }))
                  }
                  placeholder="Enter new password"
                  className="w-full rounded-xl border border-border/60 bg-surface-muted/60 px-4 py-2 text-sm text-text-secondary outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Confirm new password
                </span>
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({ ...prev, confirm: event.target.value }))
                  }
                  placeholder="Re-enter new password"
                  className="w-full rounded-xl border border-border/60 bg-surface-muted/60 px-4 py-2 text-sm text-text-secondary outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>
            {passwordError ? (
              <p className="rounded-xl border border-danger/50 bg-danger/10 px-3 py-2 text-xs text-danger">
                {passwordError}
              </p>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsPasswordMode(false)
                  setPasswordError(null)
                  setPasswordForm({
                    current: '',
                    next: '',
                    confirm: '',
                  })
                }}
                className="inline-flex items-center justify-center rounded-xl border border-border/60 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-accent/60 hover:text-accent"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
              >
                Submit
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Full name
                </p>
                <div className="mt-1 rounded-xl border border-border/60 bg-surface-muted/60 px-3 py-2 text-text-secondary">
                  {displayName}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Email
                </p>
                <div className="mt-1 rounded-xl border border-border/60 bg-surface-muted/60 px-3 py-2 text-text-secondary">
                  {displayEmail}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Role
                </p>
                <div className="mt-1 rounded-xl border border-border/60 bg-surface-muted/60 px-3 py-2 text-text-secondary">
                  Administrator
                </div>
              </div>
            </div>
            {passwordSuccess ? (
              <p className="rounded-xl border border-success/40 bg-success/10 px-3 py-2 text-xs text-success">
                {passwordSuccess}
              </p>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:gap-4">
              <button
                type="button"
                onClick={handleChangePassword}
                className="inline-flex items-center justify-center rounded-xl border border-border/60 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-accent/60 hover:text-accent"
              >
                Change password
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-xl bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger/20"
              >
                Log out
              </button>
            </div>
          </div>
        )}
      </Modal>
    </header>
  )
}

export default TopNav
