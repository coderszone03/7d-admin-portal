const NotificationSettingsPage = () => {
  return (
    <div className="space-y-6 rounded-3xl border border-border/60 bg-surface/80 p-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-text-primary">Notification Policies</h2>
        <p className="text-sm text-text-muted">
          Control delivery channels, escalation paths, and alert routing for your teams.
        </p>
      </header>
      <div className="space-y-4 text-sm text-text-muted">
        <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
          <p className="text-text-secondary">Critical alerts</p>
          <p className="text-xs text-text-muted">Notify on-call responders in Slack and email instantly.</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
          <p className="text-text-secondary">Digest reports</p>
          <p className="text-xs text-text-muted">Weekly summaries delivered every Monday at 8:00 AM.</p>
        </div>
      </div>
    </div>
  )
}

export default NotificationSettingsPage
