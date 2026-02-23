import type { FormEvent } from 'react'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { loginSuccess, selectIsAuthenticated } from '../features/auth/authSlice'
import BrandLogo from '../components/common/BrandLogo'
import { login } from '../lib/api/auth'

type FormState = {
  email: string
  password: string
}

const LoginPage = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [formState, setFormState] = useState<FormState>({
    email: '',
    password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field: keyof FormState) => (value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!formState.email || !formState.password) {
      setError('Please enter both an email and password.')
      return
    }

    try {
      setIsSubmitting(true)

      const response = await login({
        email: formState.email,
        password: formState.password,
      })

      dispatch(
        loginSuccess({
          email: formState.email,
          name: formState.email.split('@')[0],
          token: response.token,
        }),
      )

      const redirectPath = (location.state as { from?: { pathname?: string } } | undefined)?.from
        ?.pathname
      navigate(redirectPath ?? '/', { replace: true })
    } catch (err: unknown) {
      setError('Unable to sign in with those credentials.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-surface-glow" />
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl sm:h-72 sm:w-72" />
      <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl border border-border/60 bg-surface/70 shadow-glow backdrop-blur md:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden flex-col justify-between border-r border-border/50 bg-surface/80 px-10 py-12 md:flex">
          <div className="space-y-8">
            <BrandLogo className="h-12 w-auto" />
            <header className="space-y-3">
              <p className="text-sm uppercase tracking-[0.35em] text-text-muted">
                Welcome back
              </p>
              <h1 className="text-3xl font-semibold text-text-primary">
                Reconnect with your workspace
              </h1>
            </header>
            <p className="text-sm leading-relaxed text-text-muted">
              Access analytics, monitor KPIs, and keep your teams aligned from a
              single, beautifully crafted control panel.
            </p>
          </div>
          <div className="space-y-3 text-sm text-text-muted">
            <p className="font-medium text-text-secondary">Security Tips</p>
            <ul className="space-y-2 text-xs leading-relaxed">
              <li>• Enable two-factor authentication for all admins.</li>
              <li>• Review access logs every Monday morning.</li>
              <li>• Rotate API credentials at least once per quarter.</li>
            </ul>
          </div>
        </section>
        <section className="flex flex-col justify-center px-8 py-10 text-text-primary sm:px-10">
          <header className="mb-8 space-y-2 md:hidden">
            <BrandLogo className="h-10 w-auto" />
            <h1 className="text-2xl font-semibold">Sign in to continue</h1>
            <p className="text-sm text-text-muted">
              Enter your credentials below to access the admin console.
            </p>
          </header>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-medium uppercase tracking-wide text-text-muted"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={formState.email}
                onChange={(event) => handleChange('email')(event.target.value)}
                placeholder="admin@domain.com"
                className="w-full rounded-xl border border-border/60 bg-background/80 px-4 py-3 text-sm text-text-secondary outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-medium uppercase tracking-wide text-text-muted"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formState.password}
                onChange={(event) =>
                  handleChange('password')(event.target.value)
                }
                placeholder="••••••••"
                className="w-full rounded-xl border border-border/60 bg-background/80 px-4 py-3 text-sm text-text-secondary outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-xs text-text-muted">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-border/60 bg-background/80 text-accent focus:ring-accent/40"
                />
                Remember me
              </label>
              <button
                type="button"
                className="font-medium text-accent hover:text-accent-foreground"
              >
                Forgot password?
              </button>
            </div>
            {error ? (
              <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-glow transition hover:bg-accent/90"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <footer className="mt-10 text-xs text-text-muted">
            By continuing you agree to our{' '}
            <span className="text-text-secondary underline">terms</span> and{' '}
            <span className="text-text-secondary underline">privacy policy</span>
            .
          </footer>
        </section>
      </div>
    </div>
  )
}

export default LoginPage
