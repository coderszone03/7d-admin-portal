const SecuritySettingsPage = () => {
  return (
    <div className="space-y-6 rounded-3xl border border-border/60 bg-surface/80 p-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-text-primary">Security Controls</h2>
        <p className="text-sm text-text-muted">
          Enforce policies for authentication, session lifetimes, and recovery protocols.
        </p>
      </header>
      <div className="space-y-4 text-sm text-text-muted">
        <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
          <p className="text-text-secondary">Multi-factor authentication</p>
          <p className="text-xs text-text-muted">MFA is currently required for every administrator.</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
          <p className="text-text-secondary">Session timeout</p>
          <p className="text-xs text-text-muted">Sessions expire after 45 minutes of inactivity.</p>
        </div>
      </div>
    </div>
  )
}

export default SecuritySettingsPage
