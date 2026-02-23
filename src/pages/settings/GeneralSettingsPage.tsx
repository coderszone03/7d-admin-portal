const GeneralSettingsPage = () => {
  return (
    <div className="space-y-6 rounded-3xl border border-border/60 bg-surface/80 p-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-text-primary">General Settings</h2>
        <p className="text-sm text-text-muted">
          Manage workspace identity, domains, and basic preferences for all administrators.
        </p>
      </header>
      <div className="space-y-4 text-sm text-text-muted">
        <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
          <p className="text-text-secondary">Workspace Name</p>
          <p className="text-xs text-text-muted">Update the brand name displayed across the console.</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
          <p className="text-text-secondary">Primary Domain</p>
          <p className="text-xs text-text-muted">Configure verified domains for outbound communications.</p>
        </div>
      </div>
    </div>
  )
}

export default GeneralSettingsPage
