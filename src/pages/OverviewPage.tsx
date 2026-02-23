const metrics = [
  {
    name: 'Active Users',
    value: '1,842',
    change: '+12.5%',
    descriptor: 'vs. last week',
  },
  {
    name: 'Conversion Rate',
    value: '36.4%',
    change: '+4.1%',
    descriptor: 'Funnel completion',
  },
  {
    name: 'System Health',
    value: '99.98%',
    change: 'Stable',
    descriptor: 'Past 24 hours',
  },
]

const recentActivity = [
  {
    id: 1,
    title: 'New analytics dashboard published',
    timestamp: '12 minutes ago',
  },
  {
    id: 2,
    title: 'Policy update: API tokens rotated',
    timestamp: '58 minutes ago',
  },
  {
    id: 3,
    title: 'Team onboarding: Growth squad',
    timestamp: '2 hours ago',
  },
]

const OverviewPage = () => {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-text-muted">
          Dashboard
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold text-text-primary">Executive Overview</h2>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-accent/60 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/10"
          >
            <span className="inline-flex h-2 w-2 rounded-full bg-accent" />
            Generate report
          </button>
        </div>
        <p className="max-w-2xl text-sm text-text-muted">
          Monitor the pulse of your organization in real time. Everything in this workspace
          adapts to a high-contrast, low-distraction dark theme for night shifts and control rooms.
        </p>
      </header>

      <section className="grid gap-5 md:grid-cols-3">
        {metrics.map((metric) => (
          <article
            key={metric.name}
            className="rounded-3xl border border-border/60 bg-surface/80 p-6 shadow-lg shadow-black/20 transition hover:border-accent/40 hover:shadow-glow"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {metric.name}
            </p>
            <p className="mt-4 text-3xl font-semibold text-text-primary">{metric.value}</p>
            <p className="mt-2 text-xs font-medium text-success">{metric.change}</p>
            <p className="mt-1 text-xs text-text-muted">{metric.descriptor}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-border/60 bg-surface/80 p-6">
          <header className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Revenue streams</h3>
              <p className="text-xs text-text-muted">
                Rolling 12-month projection with forecast variance.
              </p>
            </div>
            <button
              type="button"
              className="rounded-full bg-accent/10 px-3 py-2 text-xs font-medium text-accent"
            >
              View details
            </button>
          </header>
          <div className="mt-6 h-52 rounded-2xl border border-dashed border-border/60 bg-background/40"></div>
        </div>
        <div className="rounded-3xl border border-border/60 bg-surface/80 p-6">
          <h3 className="text-lg font-semibold text-text-primary">Recent activity</h3>
          <ul className="mt-4 space-y-4">
            {recentActivity.map((activity) => (
              <li key={activity.id} className="rounded-2xl border border-transparent bg-background/50 p-4">
                <p className="text-sm font-medium text-text-secondary">{activity.title}</p>
                <p className="mt-1 text-xs text-text-muted">{activity.timestamp}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}

export default OverviewPage
