const SettingsPage = () => {
  return (
    <div className="space-y-6 rounded-3xl border border-border/60 bg-surface/80 p-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-text-primary">Settings</h2>
        <p className="text-sm text-text-muted">
          Configure application preferences, notification policies, and integration tokens.
        </p>
      </header>
      <div className="space-y-4 text-sm text-text-muted">
        <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/40 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-text-secondary">Appearance</p>
            <p className="text-xs text-text-muted">Dark theme enforced for all users.</p>
          </div>
          <button
            type="button"
            className="rounded-xl border border-accent/50 px-3 py-2 text-xs font-medium text-accent hover:bg-accent/10"
          >
            Manage
          </button>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/40 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-text-secondary">Security</p>
            <p className="text-xs text-text-muted">Session timeout set to 45 minutes.</p>
          </div>
          <button
            type="button"
            className="rounded-xl border border-accent/50 px-3 py-2 text-xs font-medium text-accent hover:bg-accent/10"
          >
            Review
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
