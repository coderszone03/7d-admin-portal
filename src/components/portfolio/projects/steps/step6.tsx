import type { ProjectDetailsFormValues } from '../types'

type PreviewStepProps = {
  values: ProjectDetailsFormValues
}

const Step6 = ({ values }: PreviewStepProps) => {
  const yearLabel = values.year || '2024'
  const title = values.title || 'Project title'
  const description =
    values.shortDescription ||
    'Short description of the project will appear here in the live preview.'
  const overviewDescription =
    values.overviewDescription ||
    'Longer-form overview of the project will appear here once you add it in Step 2. Use this space to describe the objectives, approach, and outcomes.'
  const scopeOfWork = values.scopeOfWork || 'Brand Identity'
  const industries = values.industries || 'Construction'
  const primaryColor = values.primaryColor || '#2A2A76'
  const secondaryColor = values.secondaryColor || '#C3C3C3'
  const accentColor = values.accentColor || '#EF5A2B'
  const badgeName = values.badgeName || 'Extending the brand'
  const brandTitle =
    values.brandTitle || 'Creating a Cohesive Visual Narrative'
  const brandDescription =
    values.brandDescription ||
    'By redefining the brand identity and crafting a cohesive visual narrative, we positioned the client as a leader in their space and aligned messaging, visuals, and touchpoints to create a consistent experience.'

  const chips: string[] = values.keywords
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .map((keyword) => keyword.toUpperCase())

  const bannerSrc =
    values.thumbnailPreview ??
    'https://placehold.co/1600x700/ff6b35/ffffff?text=PROJECT+THUMBNAIL'
  const clientMockupSrc =
    values.clientMockupPreview ??
    'https://placehold.co/1600x900/111111/666666?text=CLIENT+MOCKUP'
  const brandingMockupSrc =
    values.brandingMockupPreview ??
    'https://placehold.co/800x800/171717/666666?text=BRANDING+MOCKUP+1'
  const brandingMockupSecondarySrc =
    values.brandingMockupSecondaryPreview ??
    'https://placehold.co/800x800/171717/666666?text=BRANDING+MOCKUP+2'
  const landscapeMockupSrc =
    values.landscapeMockupPreview ??
    'https://placehold.co/1600x700/222222/666666?text=LANDSCAPE+MOCKUP'
  const websiteMockupSrc =
    values.websiteMockupPreview ??
    'https://placehold.co/1600x700/111111/666666?text=WEBSITE+MOCKUP'
  const websiteTitle =
    values.websiteTitle.trim() || 'Website'
  const websiteDescription =
    values.websiteDescription.trim() ||
    'We aimed to modernise the brand to increase awareness, with a subtle nod to its previous logo.'
  const websiteUrl = values.websiteUrl.trim()
  const isWebsiteEnabled = values.isWebsiteEnabled && Boolean(websiteUrl)
  const testimonialText =
    values.testimonialFeedback.trim() ||
    'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry’s standard dummy text ever since the 1500s.'
  const testimonialClient =
    values.testimonialClientName.trim() || 'Anushka Sharma'
  const testimonialRole =
    values.testimonialDesignation.trim() || 'Founder'
  const footerMockupSrc =
    values.footerMockupPreview ??
    'https://placehold.co/1600x120/111111/666666?text=FOOTER+BRAND+STRIP'

  return (
    <div className="h-auto rounded-xl bg-[#1D1D1D] pt-[5%]">
      <div className="mx-auto w-full p-5">
        {/* Top Tags */}
        <div className="mb-[1.8rem] flex h-auto w-full items-center justify-start">
          <div className="flex items-center gap-[0.9rem]">
            {chips.length
              ? chips.map((label) => (
                  <div
                    key={label}
                    className="h-auto w-auto rounded-[6px] bg-[#ff6b35] px-[0.9rem] py-[0.35rem] text-[0.8rem] font-bold uppercase tracking-[0.14em] text-white"
                  >
                    {label}
                  </div>
                ))
              : (
                <>
                  <div className="h-auto w-auto rounded-[6px] bg-[#ff6b35] px-[0.9rem] py-[0.35rem] text-[0.9rem] font-semibold uppercase tracking-[0.14em] text-white">
                    BRANDING
                  </div>
                  <div className="h-auto w-auto rounded-[6px] bg-[#ff6b35] px-[0.9rem] py-[0.35rem] text-[0.9rem] font-semibold uppercase tracking-[0.14em] text-white">
                    WEBSITE
                  </div>
                </>
              )}
          </div>
        </div>

        {/* Hero Section with Banner */}
        <div className="relative h-auto w-full">
          <div className="mb-2 h-full w-full overflow-hidden rounded-[32px]">
            <img className="w-full object-cover" alt={title} src={bannerSrc} />
          </div>

          {/* Dark overlay box */}
          <div className="absolute bottom-[92%] right-0 h-auto w-[54%] rounded-bl-[32px] bg-[#1D1D1D] px-[3rem] py-[2rem]">
            <div className="w-full">
              <div className="mb-1 flex h-auto w-full items-center justify-start gap-1">
                <div className="h-[0.5rem] w-[0.5rem] rounded-full bg-purple-500" />
                <p className="text-[0.8rem] font-semibold text-white">{yearLabel}</p>
              </div>
              <h3 className="mb-2 text-[2rem] font-black uppercase leading-none text-white">
                {title}
              </h3>
              <p className="w-full text-[1rem] text-white">{description}</p>
            </div>

            {/* Corner SVG */}
            <svg
              className="absolute top-[calc(100%-1px)] -right-[1px] h-[4.0rem] w-[4.0rem] rotate-90 fill-current text-[#1D1D1D]"
              viewBox="0 0 100 100"
            >
              <path d="M51.9 0v1.9c-27.6 0-50 22.4-50 50H0V0h51.9z" />
            </svg>
          </div>

          {/* Left corner SVG */}
          <svg
            className="absolute -top-[1px] left-[calc(46%-3.6rem+1px)] h-[3.0rem] w-[4.5rem] rotate-90 fill-current text-[#1D1D1D]"
            viewBox="0 0 100 100"
          >
            <path d="M51.9 0v1.9c-27.6 0-50 22.4-50 50H0V0h51.9z" />
          </svg>
        </div>

        {/* Project Overview Section (Step 2 details) */}
        <div className="mt-16 border-y border-[#3C3C3C] py-10">
          <div className="flex flex-col gap-10 md:flex-row md:gap-16">
            <div className="md:w-1/3">
              <p className="text-3xl font-semibold uppercase tracking-[0.3em] text-[#ff6b35]">
                PROJECT
                <br />
                OVERVIEW
              </p>
            </div>

            <div className="space-y-10 md:w-2/3">
              <p className="max-w-3xl text-[0.975rem] leading-7 text-white">
                {overviewDescription}
              </p>

              <div className="grid gap-10 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff6b35]">
                    Scope of work
                  </p>
                  <p className="text-base font-semibold text-white">{scopeOfWork}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff6b35]">
                    Industries
                  </p>
                  <p className="text-base font-semibold text-white">{industries}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        

        {/* Branding Media Section (Step 3 details) */}
        <div className="border-b border-[#3C3C3C] pb-12">
          {/* Client mockup full-width */}
          <div className="mt-10">
            <div className="overflow-hidden rounded-[28px] bg-black/40">
              <img
                src={clientMockupSrc}
                alt="Client mockup preview"
                className="h-[420px] w-full object-cover"
              />
            </div>
          </div>

          {/* Branding mockups grid */}
          <div className="mt-10">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="aspect-square overflow-hidden rounded-[24px] bg-black/40">
                <img
                  src={brandingMockupSrc}
                  alt="Branding mockup primary preview"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="aspect-square overflow-hidden rounded-[24px] bg-black/40">
                <img
                  src={brandingMockupSecondarySrc}
                  alt="Branding mockup secondary preview"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
        {/* Brand Identity Color Palette */}
        <div className="mt-12 space-y-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3 md:max-w-md">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#a5a6ff]">
                <span className="h-2 w-2 rounded-full bg-[#7B61FF]" />
                <span>Brand identity</span>
              </div>
              <h3 className="text-2xl font-semibold leading-tight text-white md:text-3xl">
                From concept to completion
              </h3>
            </div>

            <p className="max-w-xl text-sm leading-6 text-[#f5f5f5]/80">
              We aimed to modernise the brand to increase awareness while keeping a subtle nod to
              its heritage. The palette below reflects the primary colors used across the identity
              and digital touchpoints.
            </p>
          </div>

          <div className="overflow-hidden rounded-[24px] bg-black/40">
            <div className="flex h-20 w-full">
              <div
                className="flex-1"
                style={{ backgroundColor: primaryColor }}
              />
              <div
                className="flex-1"
                style={{ backgroundColor: secondaryColor }}
              />
              <div
                className="flex-1"
                style={{ backgroundColor: accentColor }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-medium tracking-[0.16em]">
            <span className="text-slate-200">{primaryColor.toUpperCase()}</span>
            <span className="text-slate-300">{secondaryColor.toUpperCase()}</span>
            <span className="text-[#EF5A2B]">{accentColor.toUpperCase()}</span>
          </div>
        </div>

        {/* Landscape Mockup Section (Step 4) */}
        <div className="mt-14 space-y-10">
          <div className="overflow-hidden rounded-[28px] bg-black/40">
            <img
              src={landscapeMockupSrc}
              alt="Landscape mockup preview"
              className="w-full object-cover"
            />
          </div>

          {/* Brand information section (badge, title, description) */}
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3 md:max-w-xl">
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#FFE066]">
                <span className="h-2 w-2 rounded-full bg-[#FFE066]" />
                <span>{badgeName.toUpperCase()}</span>
              </div>
              <h3 className="text-2xl font-semibold leading-tight text-white md:text-3xl">
                {brandTitle}
              </h3>
            </div>

            <p className="max-w-xl text-sm leading-7 text-[#f5f5f5]/85">
              {brandDescription}
            </p>
          </div>
        </div>

        {/* Website Mockup Section (Step 4 website) */}
        <div className="mt-16">
          <div
            className="relative rounded-[40px] px-6 py-6 md:px-10 md:py-10"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex flex-col gap-8 md:flex-row md:items-stretch md:gap-10">
              {/* Website mockup image */}
              <div className="md:w-3/4">
                <div className="overflow-hidden rounded-[28px] bg-black/30">
                  <img
                    src={websiteMockupSrc}
                    alt="Website mockup preview"
                    className=" w-full object-cover "
                  />
                </div>
              </div>

              {/* Website copy */}
              <div className="flex md:w-1/3 md:items-center">
                <div className="space-y-3 md:space-y-4">
                  <p
                    className="text-xs font-semibold uppercase tracking-[0.25em]"
                    style={{ color: secondaryColor }}
                  >
                    | Website
                  </p>
                  <h3
                    className="text-xl font-semibold leading-snug md:text-2xl"
                    style={{ color: secondaryColor }}
                  >
                    {websiteTitle}
                  </h3>
                  <p
                    className="text-sm leading-6"
                    style={{ color: secondaryColor }}
                  >
                    {websiteDescription}
                  </p>
                </div>
              </div>
            </div>

            {/* Curved dock + Visit button using corner SVG */}
            {/* Exact dock + curves from marketing layout */}
            <div className="absolute bottom-0 right-0 w-auto rounded-tl-[3.2rem] bg-[#1D1D1D] p-[1.8rem] pb-0">
              {/* Left bottom curve */}
              <svg
                className="pointer-events-none absolute -bottom-px left-px h-[6rem] w-[6rem] -translate-x-full rotate-180 fill-current text-[#1D1D1D]"
                viewBox="0 0 100 100"
              >
                <path d="M51.9 0v1.9c-27.6 0-50 22.4-50 50H0V0h51.9z" />
              </svg>

              {/* Top right curve */}
              <svg
                className="pointer-events-none absolute -right-px top-px h-[6rem] w-[6rem] -translate-y-full rotate-180 fill-current text-[#1D1D1D]"
                viewBox="0 0 100 100"
              >
                <path d="M51.9 0v1.9c-27.6 0-50 22.4-50 50H0V0h51.9z" />
              </svg>

              {/* Visit live site button */}
              <button
                type="button"
                disabled={!isWebsiteEnabled}
                onClick={() => {
                  if (!isWebsiteEnabled) return
                  const targetUrl = websiteUrl.startsWith('http')
                    ? websiteUrl
                    : `https://${websiteUrl}`
                  window.open(targetUrl, '_blank', 'noopener,noreferrer')
                }}
                className={[
                  'flex w-auto items-center justify-center gap-4 rounded-full px-[4.6rem] py-[1.3rem] text-sm font-semibold text-white transition',
                  isWebsiteEnabled ? '' : 'cursor-not-allowed opacity-50',
                ].join(' ')}
                style={{ backgroundColor: accentColor }}
              >
                <span className="text-[1rem] font-medium">Visit Live Site</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 17 17 7M9 7h8v8"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Testimonials & footer mockup (Step 5) */}
        <div className="mt-20 border-y border-[#3C3C3C] py-12">
          <div className="flex flex-col gap-10 md:flex-row md:gap-16">
            <div className="md:w-1/4">
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#ff6b35]">
                TESTIMONIALS
              </p>
            </div>

            <div className="space-y-10 md:w-3/4">
              <p className="max-w-3xl text-[0.975rem] leading-7 text-white">
                <span className="mr-1 text-2xl align-top">“</span>
                {testimonialText}
                <span className="ml-1 text-2xl align-top">”</span>
              </p>

              <div className="space-y-4">
                <div className="h-px w-full bg-[#3C3C3C]" />
                <div>
                  <p className="text-base font-semibold text-white">
                    {testimonialClient}
                  </p>
                  <p className="text-sm text-[#7f7f7f]">{testimonialRole}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer brand strip mockup */}
        
      </div>
      <div className="mt-10 overflow-hidden bg-black/40 mb-5">
          <img
            src={footerMockupSrc}
            alt="Footer brand mockup preview"
            className=" w-full object-cover h-50"
          />
        </div>
    </div>
  )
}

export default Step6
