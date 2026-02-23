type PagePlaceholderProps = {
  title: string
  description: string
  message?: string
}

const PagePlaceholder = ({
  title,
  description,
  message = 'This section is under construction.',
}: PagePlaceholderProps) => {
  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-text-secondary">{title}</h1>
          <p className="text-sm text-text-muted">{description}</p>
        </div>
      </header>
      <div className="rounded-3xl border border-dashed border-border/60 bg-surface/60 p-6 text-sm text-text-muted">
        {message}
      </div>
    </section>
  )
}

export default PagePlaceholder
