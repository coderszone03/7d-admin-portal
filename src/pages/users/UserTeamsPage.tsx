const UserTeamsPage = () => {
  return (
    <div className="space-y-6 rounded-3xl border border-border/60 bg-surface/80 p-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-text-primary">Teams & Roles</h2>
        <p className="text-sm text-text-muted">
          Organize squads, assign maintainers, and sync their permissions with your identity provider.
        </p>
      </header>
      <div className="h-72 rounded-2xl border border-dashed border-border/50 bg-background/40"></div>
    </div>
  )
}

export default UserTeamsPage
